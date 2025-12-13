// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for client-side (browser)
export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Client untuk admin/server
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)

// ✅ TAMBAHKAN INI (ALIAS)
export const supabaseServer = supabaseAdmin

export default supabase
