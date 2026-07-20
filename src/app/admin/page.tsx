import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { getDashboardStats, getTodayAttendanceList } from '@/app/actions/admin'
import { getTodayDate } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard Admin | Si-Aziz',
}

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/guru')

  const today = getTodayDate()
  const [stats, attendanceList] = await Promise.all([
    getDashboardStats(today),
    getTodayAttendanceList(today),
  ])

  return (
    <AdminLayout profile={profile} activeMenu="dashboard">
      <AdminDashboard stats={stats} attendanceList={attendanceList} today={today} />
    </AdminLayout>
  )
}
