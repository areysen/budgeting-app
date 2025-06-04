import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Configuration, PlaidApi, PlaidEnvironments } from "https://esm.sh/plaid";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.log("🧪 Debug headers", Object.fromEntries(req.headers.entries()));
    console.warn("⚠️ No Authorization header received");
    return new Response("Unauthorized", { status: 401 });
  }

  // Supabase auth
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }
console.log("🔐 Environment check", {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.substring(0, 6), // just partial for safety
  PLAID_ENV: Deno.env.get("PLAID_ENV"),
  PLAID_CLIENT_ID: Deno.env.get("PLAID_CLIENT_ID"),
  PLAID_SECRET: Deno.env.get("PLAID_SECRET")?.substring(0, 4),
});
  // Plaid setup
  const config = new Configuration({
    basePath: PlaidEnvironments[Deno.env.get("PLAID_ENV")!],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": Deno.env.get("PLAID_CLIENT_ID")!,
        "PLAID-SECRET": Deno.env.get("PLAID_SECRET")!,
      },
    },
  });
  const plaid = new PlaidApi(config);

  try {
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Budgeting App",
      products: ["transactions"],
      language: "en",
      country_codes: ["US"],
    });

    console.log("🎉 Successful response from create-link-token function:", response.data);

    return new Response(JSON.stringify({ link_token: response.data.link_token }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Plaid link token creation failed:", {
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
      responseData: err?.response?.data,
      responseStatus: err?.response?.status,
      message: err?.message,
    });
    return new Response("Failed to create link token", { status: 500 });
  }
});