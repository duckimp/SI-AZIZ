'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Pakai admin client untuk bypass RLS saat cek role
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[LOGIN DEBUG]', {
    userId: user.id,
    profileRole: profile?.role,
    profileError: profileError?.message,
    redirectTo: profile?.role === 'admin' ? '/admin' : '/guru'
  })

  const role = profile?.role
  const redirectTo = role === 'admin' ? '/admin' : '/guru'
  return { redirectTo }
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
