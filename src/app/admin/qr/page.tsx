import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import QrManagement from '@/components/admin/QrManagement'
import { getSchoolSettings } from '@/app/actions/admin'

export const metadata = {
  title: 'Kelola QR Code | Si-Aziz Admin',
}

export default async function AdminQrPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/guru')

  const settings = await getSchoolSettings()

  return (
    <AdminLayout profile={profile} activeMenu="qr">
      <QrManagement settings={settings} />
    </AdminLayout>
  )
}
