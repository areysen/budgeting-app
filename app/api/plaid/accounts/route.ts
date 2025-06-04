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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { plaidItemId } = parsed.data;

  const { data: item, error: itemError } = await supabase
    .from('plaid_items')
    .select('access_token')
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
    const response = await plaid.accountsGet({ access_token: item.access_token });

    const inserts = response.accounts.map((account) => ({
      plaid_account_id: account.account_id,
      plaid_item_id: plaidItemId,
      user_id: user.id,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      available_balance: account.balances.available,
      current_balance: account.balances.current,
      iso_currency_code: account.balances.iso_currency_code,
    }));

    const { error } = await supabase.from("plaid_accounts").upsert(inserts, {
      onConflict: "plaid_account_id",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to insert accounts" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plaid API error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts from Plaid" }, { status: 500 });
  }
}