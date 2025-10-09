import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

export function getSupabaseClient() {
  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.')
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Supabase key is not configured. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}
