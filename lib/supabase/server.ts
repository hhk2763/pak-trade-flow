import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
      "Set them in .env.local (see .env.example)."
  );
}

// Server-only client using the service_role key. RLS on this project has no
// SELECT policy for anon/publishable, so all reads must happen server-side
// with this key — never import this module from a Client Component.
export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  { auth: { persistSession: false } }
);
