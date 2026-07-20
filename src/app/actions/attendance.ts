'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAttendanceStatus, getTodayDate, getCurrentTime } from '@/lib/utils'

export async function scanAttendance(qrToken: string, distance: number) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Tidak terautentikasi.' }

  // Validate QR token
  const { data: settings } = await supabase
    .from('school_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (!settings) return { success: false, message: 'Pengaturan sekolah tidak ditemukan.' }
  if (settings.qr_secret_token !== qrToken) {
    return { success: false, message: 'QR Code tidak valid atau sudah kadaluarsa!' }
  }

  const today = getTodayDate()
  const currentTime = getCurrentTime()

  // Check existing attendance for today
  const { data: existing } = await supabase
    .from('attendances')
    .select('*')
    .eq('user_id', user.id)
    .eq('tanggal', today)
    .single()

  if (existing) {
    if (!existing.waktu_pulang && existing.waktu_masuk) {
      // Record pulang
      const { data: updated, error } = await supabase
        .from('attendances')
        .update({
          waktu_pulang: currentTime,
          distance_pulang_meters: distance,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return { success: false, message: `Error: ${error.message}` }

      revalidatePath('/guru')
      return {
        success: true,
        scanType: 'pulang',
        message: `Absen Pulang berhasil! Jam ${currentTime.slice(0, 5)}`,
        attendance: updated,
      }
    } else if (existing.waktu_pulang) {
      return { success: false, message: 'Anda sudah selesai absen hari ini.' }
    }
  }

  // Record masuk
  const status = getAttendanceStatus(currentTime, settings.jam_masuk)
  const { data: newAttendance, error } = await supabase
    .from('attendances')
    .insert({
      user_id: user.id,
      tanggal: today,
      waktu_masuk: currentTime,
      status_masuk: status,
      status_kehadiran: 'Hadir',
      distance_masuk_meters: distance,
    })
    .select()
    .single()

  if (error) return { success: false, message: `Error: ${error.message}` }

  revalidatePath('/guru')
  return {
    success: true,
    scanType: 'masuk',
    message: `Absen Masuk berhasil! ${status === 'Terlambat' ? '⚠️ Terlambat' : '✓ Tepat Waktu'}`,
    attendance: newAttendance,
  }
}

export async function getMyTodayAttendance() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = getTodayDate()
  const { data } = await supabase
    .from('attendances')
    .select('*')
    .eq('user_id', user.id)
    .eq('tanggal', today)
    .single()

  return data
}
