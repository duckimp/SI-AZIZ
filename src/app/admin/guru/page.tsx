import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import GuruManagement from '@/components/admin/GuruManagement'
import { getAllGuru } from '@/app/actions/admin'

export const metadata = {
  title: 'Manajemen Guru | Si-Aziz Admin',
}

export default async function AdminGuruPage() {
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

  const guruList = await getAllGuru()

  return (
    <AdminLayout profile={profile} activeMenu="guru">
      <GuruManagement guruList={guruList} />
    </AdminLayout>
  )
}
