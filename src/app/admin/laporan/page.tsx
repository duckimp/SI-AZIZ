import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import LaporanPage from '@/components/admin/LaporanPage'
import { getAllGuru, getSchoolSettings } from '@/app/actions/admin'

export const metadata = {
  title: 'Laporan Absensi | Si-Aziz Admin',
}

export default async function AdminLaporanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/guru')

  const [guruList, settings] = await Promise.all([
    getAllGuru(),
    getSchoolSettings(),
  ])

  return (
    <AdminLayout profile={profile} activeMenu="laporan">
      <LaporanPage guruList={guruList} settings={settings} />
    </AdminLayout>
  )
}
