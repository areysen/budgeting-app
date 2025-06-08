import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type Database = any;

export const createServerSupabaseClient = async () =>
  createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: await cookies() }
  );
