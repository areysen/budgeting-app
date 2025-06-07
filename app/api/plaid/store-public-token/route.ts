import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, serviceRole, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { public_token, institution } = await req.json();
    if (!public_token) {
      return NextResponse.json({ error: "public_token required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("plaid_items")
      .insert({
        user_id: user.id,
        access_token: null,
        institution_name: institution,
        status: "pending",
      })
      .select("id, plaid_item_id")
      .single();

    if (error) {
      console.error("Error storing public token", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item_id: data.id, plaid_item_id: data.plaid_item_id });
  } catch (err) {
    console.error("Unexpected error storing public token", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
