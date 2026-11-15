import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Server-only client using the service_role key. RLS on this project has no
// SELECT policy for anon/publishable, so all reads must happen server-side
// with this key — never import this module from a Client Component.
//
// Created on first use rather than at import time, so the app can run from a
// local snapshot (LOCAL_DATA_DIR) with no Supabase credentials at all.
export function supabaseServer(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
        "Set them in .env.local (see .env.example), or set LOCAL_DATA_DIR to run " +
        "from a local snapshot."
    );
  }

  client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}
