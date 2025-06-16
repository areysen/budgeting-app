import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { PlaidTransaction } from "@/types";

const requestSchema = z.object({
  plaidItemId: z.string(),
});

export async function POST(req: Request) {
  // const cookieStore = await cookies(); // Removed unused variable
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { plaidItemId } = parsed.data;

  const { data: item, error: itemError } = await supabase
    .from("plaid_items")
    .select("access_token")
    .eq("plaid_item_id", plaidItemId)
    .single();

  if (itemError || !item?.access_token) {
    console.error("Failed to retrieve access token", itemError);
    return NextResponse.json(
      { error: "Missing access token" },
      { status: 500 }
    );
  }

  const plaid = getPlaidClient();

  try {
    let hasMore = true;
    let added: PlaidTransaction[] = [];

    while (hasMore) {
      const response = await plaid.transactionsSync({
        access_token: item.access_token,
      });
      if (response.data.added) {
        added = [
          ...added,
          ...response.data.added.map((txn) => ({
            ...txn,
            category: Array.isArray(txn.category) ? txn.category : undefined,
          })),
        ];
      }
      hasMore = response.data.has_more;
    }

    const inserts = added.map((txn) => ({
      plaid_transaction_id: txn.transaction_id,
      plaid_account_id: txn.account_id,
      plaid_item_id: plaidItemId,
      user_id: user.id,
      name: txn.name,
      amount: txn.amount,
      date: txn.date,
      category: txn.category,
      iso_currency_code: txn.iso_currency_code,
      pending: txn.pending,
    }));

    const { error: insertError } = await supabase
      .from("plaid_transactions")
      .upsert(inserts, { onConflict: "plaid_transaction_id" });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to insert transactions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plaid Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
