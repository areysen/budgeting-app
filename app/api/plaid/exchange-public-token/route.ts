import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { public_token, item_id } = await req.json();
    if (!public_token || !item_id) {
      return NextResponse.json({ error: "Missing token or item_id" }, { status: 400 });
    }

    const plaidRes = await fetch("https://sandbox.plaid.com/item/public_token/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        public_token,
      }),
    });

    const plaidData = await plaidRes.json();
    if (!plaidData.access_token) {
      return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("plaid_items")
      .update({
        access_token: plaidData.access_token,
        plaid_item_id: plaidData.item_id ?? null,
        status: "active",
      })
      .eq("id", item_id);

    if (error) {
      console.error("Error updating plaid_items:", error);
      return NextResponse.json({ error: "Failed to update Supabase" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plaid_item_id: plaidData.item_id });
  } catch (err) {
    console.error("Unexpected error in exchange route:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}