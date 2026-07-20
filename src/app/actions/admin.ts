'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export async function getDashboardStats(date: string) {
  const supabase = createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'guru')

  const totalGuru = profiles?.length ?? 0

  const { data: attendances } = await supabase
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
  const supabase = createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nama, nip')
    .eq('role', 'guru')

  const { data: attendances } = await supabase
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
  const supabase = createClient()
  const { data } = await supabase
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
  const supabase = createClient()

  // Create auth user via admin API (needs service role key in real deploy)
  // For now we use regular signUp
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: { nama: formData.nama, nip: formData.nip },
  })

  if (authError) return { success: false, error: authError.message }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    nama: formData.nama,
    nip: formData.nip,
    role: 'guru',
  })

  if (profileError) return { success: false, error: profileError.message }

  revalidatePath('/admin/guru')
  return { success: true }
}

export async function updateGuru(id: string, formData: { nama: string; nip: string }) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ nama: formData.nama, nip: formData.nip })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/guru')
  return { success: true }
}

export async function deleteGuru(id: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.admin.deleteUser(id)
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
  const supabase = createClient()

  const { error } = await supabase
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
  const supabase = createClient()

  let query = supabase
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
  const supabase = createClient()
  const { data } = await supabase.from('school_settings').select('*').eq('id', 1).single()
  return data
}

export async function resetQrToken(newToken: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('school_settings')
    .update({ qr_secret_token: newToken })
    .eq('id', 1)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/qr')
  return { success: true }
}
