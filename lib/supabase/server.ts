import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Define or import the Database type
type Database = any; // Replace 'any' with the actual type definition if available

export const createServerSupabaseClient = async () =>
  createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: await cookies() }
  );
