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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl =
      process.env.PLAID_ENV === "production"
        ? "https://production.plaid.com"
        : process.env.PLAID_ENV === "development"
        ? "https://development.plaid.com"
        : "https://sandbox.plaid.com";

    const apiResponse = await fetch(`${baseUrl}/link/token/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
      body: JSON.stringify({
        user: { client_user_id: user.id },
        client_name: "Budgeting App",
        products: ["transactions"],
        language: "en",
        country_codes: ["US"],
      }),
    });

    const plaidData = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("Plaid error", plaidData);
      return NextResponse.json(
        { error: "Failed to create link token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ link_token: plaidData.link_token });
  } catch (err) {
    console.error("Error creating link token", err);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
