import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BackupPage from '@/components/admin/BackupPage'

export const metadata = {
  title: 'Backup & Restore | Si-Aziz Admin',
}

export default async function AdminBackupPage() {
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

  return (
    <AdminLayout profile={profile} activeMenu="backup">
      <BackupPage />
    </AdminLayout>
  )
}
