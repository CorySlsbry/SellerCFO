import { createBrowserClient as createBrowserClient_ } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client
 * Used for client components and client-side operations
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  return createBrowserClient_<Database>(supabaseUrl, supabaseAnonKey);
}
