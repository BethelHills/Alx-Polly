import { createClient } from '@supabase/supabase-js'

// Server-side Supabase configuration
// These variables should NEVER be exposed to the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'

// Service role key - has full database access
// This should be stored in GitHub Secrets for CI/CD and .env.local for development
// NEVER commit this key to the repository!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Server-side client with service role key for admin operations
// Use this for API routes that need full database access
export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Client for user authentication operations (server-side only)
// Use this for JWT token validation and user management
export const supabaseAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
