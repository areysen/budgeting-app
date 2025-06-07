import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";
import util from "util";

const requestSchema = z.object({
  plaidItemId: z.string(),
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    console.error("User fetch error", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = userData.user;

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { plaidItemId } = parsed.data;

  // Retrieve full plaid_items row to get access_token and plaid_item_id
  const { data: plaidItem, error: itemError } = await supabase
    .from("plaid_items")
    .select("*")
    .eq("plaid_item_id", plaidItemId)
    .single();

  // Get plaid_item_id from the record (should match input)
  const dbPlaidItemId = plaidItem?.plaid_item_id;

  if (itemError || !plaidItem?.access_token || !dbPlaidItemId) {
    console.error(
      "Failed to retrieve access token or plaid_item_id",
      itemError
    );
    return NextResponse.json(
      { error: "Missing Plaid item or access token for user." },
      { status: 500 }
    );
  }

  const plaid = getPlaidClient();
  console.log(
    "🔍 Fetching accounts with access_token:",
    plaidItem.access_token
  );

  try {
    const response = await plaid.accountsGet({
      access_token: plaidItem.access_token,
    });

    // Debug Plaid response structure
    console.dir(response, { depth: null });

    const accounts = response.data.accounts;

    if (
      !Array.isArray(accounts) ||
      accounts.length === 0 ||
      typeof accounts[0] !== "object"
    ) {
      console.error("❌ Invalid or empty `accounts` array. Full response:");
      console.dir(response, { depth: 5 });
      return NextResponse.json(
        { error: "Invalid accounts response from Plaid" },
        { status: 500 }
      );
    }

    console.log(
      "✅ Plaid accounts response payload:",
      JSON.stringify(accounts, null, 2)
    );
    console.log(`📦 ${accounts.length} account(s) retrieved`);

    // Retrieve the most recent plaid_item_id for the user before upserting accounts
    const { data: plaidItems, error: plaidItemsError } = await supabase
      .from("plaid_items")
      .select("plaid_item_id, created_at")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const plaidItemId = plaidItems?.[0]?.plaid_item_id;

    if (!plaidItemId) {
      throw new Error("No plaid_item_id found for user.");
    }

    // Retrieve user_id from plaid_items using plaidItemId
    const { data: plaidItemUser, error: plaidItemUserError } = await supabase
      .from("plaid_items")
      .select("user_id")
      .eq("plaid_item_id", plaidItemId)
      .single();

    if (plaidItemUserError || !plaidItemUser?.user_id) {
      console.error(
        "Failed to retrieve user_id for plaid_item",
        plaidItemUserError
      );
      return NextResponse.json(
        { error: "Missing user_id for Plaid item." },
        { status: 500 }
      );
    }

    // --- Patch: format accounts for upsert and log results ---
    const formattedAccounts = accounts.map((acct) => ({
      user_id: plaidItemUser.user_id,
      plaid_account_id: acct.account_id,
      name: acct.name,
      type: acct.type,
      subtype: acct.subtype,
      mask: acct.mask,
      available_balance: acct.balances.available,
      current_balance: acct.balances.current,
      iso_currency_code: acct.balances.iso_currency_code,
      plaid_item_id: plaidItemId,
    }));

    console.log("🔧 Attempting to upsert formatted accounts:");
    console.dir(formattedAccounts, { depth: 3 });

    const {
      data: insertedAccounts,
      error: insertError,
      status: insertStatus,
    } = await supabase
      .from("plaid_accounts")
      .upsert(formattedAccounts, { onConflict: "plaid_account_id" })
      .select();

    console.log("📥 Insert status:", insertStatus);
    console.dir(insertedAccounts, { depth: null });
    if (insertError || !insertedAccounts) {
      console.error("❌ Insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to insert accounts into Supabase",
          detail: insertError?.message || "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
    // --- End Patch ---
  } catch (error: any) {
    if (error?.response?.data) {
      console.log("🧠 Plaid API error response data:");
      console.dir(error.response.data, { depth: null });
    }
    console.error("❌ Plaid API error fetching accounts:", error.message);
    console.error(util.inspect(error, { depth: 5, colors: true }));
    return NextResponse.json(
      { error: "Failed to fetch accounts from Plaid" },
      { status: 500 }
    );
  }
}
