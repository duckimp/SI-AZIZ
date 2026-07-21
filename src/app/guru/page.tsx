import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import GuruDashboard from '@/components/guru/GuruDashboard'

export const metadata = {
  title: 'Absensi | Si-Aziz',
  description: 'Dashboard absensi guru MI Nur Aziz',
}

export default async function GuruPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  // Admin yang akses /guru dibiarkan — tidak redirect ke /admin
  // untuk mencegah loop. Admin bisa akses /admin langsung.

  const { data: settings } = await admin
    .from('school_settings')
    .select('*')
    .eq('id', 1)
    .single()

  const today = new Date().toLocaleDateString('en-CA')
  const { data: todayAttendance } = await admin
    .from('attendances')
    .select('*')
    .eq('user_id', user.id)
    .eq('tanggal', today)
    .single()

  return (
    <GuruDashboard
      profile={profile}
      settings={settings}
      todayAttendance={todayAttendance}
    />
  )
}
