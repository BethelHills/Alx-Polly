// lib/supabaseServerClient.ts - server-only client (use with caution)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE as string;

if (!url || !serviceRole) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE or NEXT_PUBLIC_SUPABASE_URL");
}

// This client uses the service role - DO NOT import it into client-side code.
export const supabaseServerClient = createClient(url, serviceRole, {
  auth: { persistSession: false },
});
