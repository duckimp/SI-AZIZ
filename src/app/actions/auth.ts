'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const user = data.user
  if (!user) return { error: 'Login gagal' }

  // Query profiles using service role via RPC to bypass RLS during login
  // Use the session from signInWithPassword directly
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If profile query fails due to RLS timing, fall back to checking user metadata
  const role = profile?.role ?? (user.user_metadata?.role as string | undefined)
  const redirectTo = role === 'admin' ? '/admin' : '/guru'
  return { redirectTo }
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
