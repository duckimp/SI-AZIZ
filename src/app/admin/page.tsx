import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { getAdminDashboardData } from '@/app/actions/admin'
import { getTodayDate } from '@/lib/utils'
import { Profile } from '@/lib/types'

export const metadata = {
  title: 'Dashboard Admin | Si-Aziz',
}

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const today = getTodayDate()

  const [{ data: profile }, dashboardData] = await Promise.all([
    admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    getAdminDashboardData(today),
  ])

  if (!profile || profile.role !== 'admin') redirect('/guru')

  const typedProfile = profile as Profile
  const { stats, attendanceList } = dashboardData

  return (
    <AdminLayout profile={typedProfile} activeMenu="dashboard">
      <AdminDashboard stats={stats} attendanceList={attendanceList} today={today} />
    </AdminLayout>
  )
}
