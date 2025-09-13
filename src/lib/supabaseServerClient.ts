// lib/supabaseServerClient.ts - server-only client (use with caution)
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE as string;

// Create mock client for build time when environment variables are not properly configured
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      limit: () => Promise.resolve({ data: null, error: null })
    })
  })
});

// Export the appropriate client based on environment configuration
export const supabaseServerClient = (() => {
  // Check for placeholder values or missing environment variables
  if (!url || !serviceRole || url === 'your-url' || serviceRole === 'your-service-role') {
    console.warn("Supabase environment variables not properly configured. Using mock client for build.");
    return createMockClient() as unknown as SupabaseClient;
  } else {
    // This client uses the service role - DO NOT import it into client-side code.
    return createClient(url, serviceRole, {
      auth: { persistSession: false },
    });
  }
})();