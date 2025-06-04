import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";

const requestSchema = z.object({
  plaidItemId: z.string(),
});

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient(cookies);
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
    .from('plaid_items')
    .select('access_token, last_cursor')
    .eq('id', plaidItemId)
    .single();

  if (itemError || !item?.access_token) {
    console.error('Failed to retrieve access token', itemError);
    return NextResponse.json(
      { error: 'Missing access token' },
      { status: 500 }
    );
  }

  const plaid = getPlaidClient();

  try {
    const cursor = item.last_cursor ?? null;
    let hasMore = true;
    let added: unknown[] = [];
    let newCursor = cursor;

    while (hasMore) {
      const response = await plaid.transactionsSync({
        access_token: item.access_token,
        cursor: newCursor || undefined,
      });

      added = [...added, ...response.added];
      newCursor = response.next_cursor;
      hasMore = response.has_more;
    }

    const inserts = added.map((txn) => ({
      plaid_transaction_id: txn.transaction_id,
      plaid_account_id: txn.account_id,
      plaid_item_id: plaidItemId,
      user_id: user.id,
      name: txn.name,
      amount: txn.amount,
      date: txn.date,
      category: txn.category?.join(" > "),
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

    const { error: cursorUpdateError } = await supabase
      .from("plaid_items")
      .update({ last_cursor: newCursor })
      .eq("id", plaidItemId);

    if (cursorUpdateError) {
      console.error("Cursor update error:", cursorUpdateError);
      return NextResponse.json(
        { error: "Failed to update cursor" },
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
