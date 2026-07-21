import { createClient } from '@/lib/supabase/server'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  // Jangan redirect admin dari sini — biarkan middleware yang handle
  // Middleware sudah protect /admin, guru page tetap tampil untuk semua role yang valid

  const { data: settings } = await supabase
    .from('school_settings')
    .select('*')
    .eq('id', 1)
    .single()

  const today = new Date().toLocaleDateString('en-CA')
  const { data: todayAttendance } = await supabase
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
