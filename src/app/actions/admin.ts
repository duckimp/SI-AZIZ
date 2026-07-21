'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export async function getDashboardStats(date: string) {
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'guru')

  const totalGuru = profiles?.length ?? 0

  const { data: attendances } = await admin
    .from('attendances')
    .select('*')
    .eq('tanggal', date)

  const hadirTepat = attendances?.filter(a => a.status_kehadiran === 'Hadir' && a.status_masuk === 'Tepat Waktu').length ?? 0
  const terlambat = attendances?.filter(a => a.status_kehadiran === 'Hadir' && a.status_masuk === 'Terlambat').length ?? 0
  const izinSakit = attendances?.filter(a => ['Izin', 'Sakit'].includes(a.status_kehadiran)).length ?? 0
  const alpha = attendances?.filter(a => a.status_kehadiran === 'Alpha').length ?? 0
  const belumAbsen = totalGuru - (attendances?.length ?? 0)

  return { totalGuru, hadirTepat, terlambat, izinSakit, alpha, belumAbsen }
}

export async function getTodayAttendanceList(date: string) {
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nama, nip')
    .eq('role', 'guru')

  const { data: attendances } = await admin
    .from('attendances')
    .select('*')
    .eq('tanggal', date)

  return profiles?.map(p => {
    const att = attendances?.find(a => a.user_id === p.id)
    return {
      profile: p,
      attendance: att ?? null,
    }
  }) ?? []
}

// ── GURU CRUD ─────────────────────────────────────────────────────────────────

export async function getAllGuru() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'guru')
    .order('nama')
  return data ?? []
}

export async function createGuru(formData: {
  nama: string
  nip: string
  email: string
  password: string
}) {
  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: { nama: formData.nama, nip: formData.nip, role: 'guru' },
  })

  if (authError) return { success: false, error: authError.message }

  // Upsert profile — override trigger yang mungkin sudah insert duluan tanpa NIP
  const { error: profileError } = await admin.from('profiles').upsert({
    id: authData.user.id,
    nama: formData.nama,
    nip: formData.nip || null,
    role: 'guru',
  }, { onConflict: 'id' })

  if (profileError) return { success: false, error: profileError.message }

  revalidatePath('/admin/guru')
  return { success: true }
}

export async function updateGuru(id: string, formData: { nama: string; nip: string }) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ nama: formData.nama, nip: formData.nip })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/guru')
  return { success: true }
}

export async function deleteGuru(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/guru')
  return { success: true }
}

// ── MANUAL ATTENDANCE ─────────────────────────────────────────────────────────

export async function inputManualAttendance(data: {
  userId: string
  tanggal: string
  statusKehadiran: 'Izin' | 'Sakit' | 'Alpha'
  keterangan?: string
}) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('attendances')
    .upsert({
      user_id: data.userId,
      tanggal: data.tanggal,
      status_kehadiran: data.statusKehadiran,
      keterangan: data.keterangan ?? '',
    }, { onConflict: 'user_id,tanggal' })

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

// ── LAPORAN & EXPORT ──────────────────────────────────────────────────────────

export async function getAttendanceReport(
  startDate: string,
  endDate: string,
  userId?: string
) {
  const admin = createAdminClient()

  let query = admin
    .from('attendances')
    .select('*, profiles(nama, nip)')
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)
    .order('tanggal', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data } = await query
  return data ?? []
}

// ── SCHOOL SETTINGS ────────────────────────────────────────────────────────────

export async function getSchoolSettings() {
  const admin = createAdminClient()
  const { data } = await admin.from('school_settings').select('*').eq('id', 1).single()
  return data
}

export async function resetQrToken(newToken: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('school_settings')
    .update({ qr_secret_token: newToken })
    .eq('id', 1)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/qr')
  return { success: true }
}

export async function updateJadwalHarian(jadwal: Record<string, { masuk: string; pulang: string; libur: boolean }>) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('school_settings')
    .update({ jadwal_harian: jadwal })
    .eq('id', 1)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/qr')
  return { success: true }
}
