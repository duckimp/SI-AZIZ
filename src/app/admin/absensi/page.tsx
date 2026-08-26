import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AbsensiManagement from '@/components/admin/AbsensiManagement'
import { getAttendanceManagementData } from '@/app/actions/admin'

export const metadata = {
  title: 'Manajemen Absensi | Si-Aziz Admin',
}

interface PageProps {
  searchParams?: { date?: string }
}

export default async function AdminAbsensiPage({ searchParams }: PageProps) {
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

  const today = new Date().toISOString().split('T')[0]
  const date = searchParams?.date || today

  const { list, stats } = await getAttendanceManagementData(date)

  return (
    <AdminLayout profile={profile} activeMenu="absensi">
      <AbsensiManagement initialDate={date} initialList={list} initialStats={stats} />
    </AdminLayout>
  )
}
