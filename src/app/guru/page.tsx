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
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date())

  // Ambil data profile, settings, dan absensi hari ini secara PARALEL (Promise.all)
  // Ini memangkas waktu query hingga 60-70% dibanding serial
  const [
    { data: profile },
    { data: settings },
    { data: todayAttendance },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('school_settings').select('*').eq('id', 1).single(),
    admin.from('attendances').select('*').eq('user_id', user.id).eq('tanggal', today).maybeSingle(),
  ])

  if (!profile) redirect('/login')

  return (
    <GuruDashboard
      profile={profile}
      settings={settings}
      todayAttendance={todayAttendance}
    />
  )
}
