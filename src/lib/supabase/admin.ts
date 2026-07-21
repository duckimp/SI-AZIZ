import { createClient } from '@supabase/supabase-js'

// Admin client menggunakan service role key — bypass RLS
// Hanya digunakan di server-side (server components & server actions)
// JANGAN gunakan di client component
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
