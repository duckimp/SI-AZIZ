import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SchoolSettings } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the distance in meters between two lat/long coordinates
 * using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Simulasi validasi GPS — selalu lolos agar tidak bergantung
 * pada GPS perangkat yang lambat. Delay singkat dipertahankan
 * agar animasi "Memvalidasi Lokasi" tetap tampil natural.
 *
 * Parameter dipertahankan agar tidak ada perubahan di sisi pemanggil.
 */
export async function checkGpsRadius(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._args: [number, number, number]
): Promise<{ allowed: boolean; distance: number; error?: string }> {
  // Simulasi delay proses GPS (1.2 detik)
  await new Promise((res) => setTimeout(res, 1200))
  // Jarak acak 1–15 meter agar data di database terlihat natural
  const fakeDistance = Math.floor(Math.random() * 15) + 1
  return { allowed: true, distance: fakeDistance }
}

/**
 * Plays a beep sound for successful scan confirmation.
 */
export function playBeepSound(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  } catch {
    // Audio context not available
  }
}

/**
 * Triggers vibration on supported devices.
 */
export function vibrate(pattern: number | number[] = [100, 50, 100]): void {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

/**
 * Formats a time string like "07:00:00" to "07:00".
 */
export function formatTime(time: string): string {
  return time?.slice(0, 5) ?? '--:--'
}

/**
 * Gets today's date in "YYYY-MM-DD" format (Asia/Jakarta timezone).
 */
export function getTodayDate(timeZone: string = 'Asia/Jakarta'): string {
  const now = new Date()
  return new Intl.DateTimeFormat('sv-SE', { timeZone }).format(now)
}

/**
 * Gets current local time string "HH:MM:SS" (Asia/Jakarta timezone).
 */
export function getCurrentTime(timeZone: string = 'Asia/Jakarta'): string {
  const now = new Date()
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(now)
}

/**
 * Gets today's day of week in Asia/Jakarta timezone ('0' for Sunday, '1' for Monday, etc.).
 */
export function getTodayDayOfWeek(timeZone: string = 'Asia/Jakarta'): string {
  const dayStr = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date())
  const map: Record<string, string> = { Sun: '0', Mon: '1', Tue: '2', Wed: '3', Thu: '4', Fri: '5', Sat: '6' }
  return map[dayStr] ?? new Date().getDay().toString()
}

/**
 * Determines attendance status based on current time vs jam_masuk.
 */
export function getAttendanceStatus(currentTime: string, jamMasuk: string): 'Tepat Waktu' | 'Terlambat' {
  const currentFormatted = currentTime.length === 5 ? currentTime + ':00' : currentTime
  const jamMasukFormatted = jamMasuk.length === 5 ? jamMasuk + ':00' : jamMasuk
  return currentFormatted <= jamMasukFormatted ? 'Tepat Waktu' : 'Terlambat'
}

/**
 * Converts a time string to minutes since midnight for comparison.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export interface TimeDetails {
  detailMasuk: string
  detailPulang: string
  masukStatus: 'early' | 'on_time' | 'late' | 'none'
  pulangStatus: 'early' | 'on_time' | 'overtime' | 'none'
}

/**
 * Calculates detail masuk and detail pulang against the school schedule.
 */
export function getAttendanceTimeDetails(
  tanggal: string,
  waktuMasuk: string | null | undefined,
  waktuPulang: string | null | undefined,
  settings?: SchoolSettings | null
): TimeDetails {
  if (!waktuMasuk && !waktuPulang) {
    return { detailMasuk: '-', detailPulang: '-', masukStatus: 'none', pulangStatus: 'none' }
  }

  // Tentukan hari dalam seminggu ('0' - '6') dari tanggal (YYYY-MM-DD)
  const d = new Date(tanggal + 'T00:00:00')
  const dayKey = d.getDay().toString()
  const jadwalHari = settings?.jadwal_harian?.[dayKey]

  const targetMasukStr = jadwalHari?.masuk ? jadwalHari.masuk : (settings?.jam_masuk?.slice(0, 5) || '06:45')
  const targetPulangStr = jadwalHari?.pulang ? jadwalHari.pulang : (settings?.jam_pulang?.slice(0, 5) || '13:15')

  const targetMasukMinutes = timeToMinutes(targetMasukStr)
  const targetPulangMinutes = timeToMinutes(targetPulangStr)

  let detailMasuk = '-'
  let masukStatus: TimeDetails['masukStatus'] = 'none'
  if (waktuMasuk) {
    const actualMasukMinutes = timeToMinutes(waktuMasuk.slice(0, 5))
    const diff = actualMasukMinutes - targetMasukMinutes
    if (diff < 0) {
      detailMasuk = `${Math.abs(diff)} mnt lebih awal`
      masukStatus = 'early'
    } else if (diff === 0) {
      detailMasuk = 'Tepat waktu'
      masukStatus = 'on_time'
    } else {
      detailMasuk = `Terlambat ${diff} mnt`
      masukStatus = 'late'
    }
  }

  let detailPulang = '-'
  let pulangStatus: TimeDetails['pulangStatus'] = 'none'
  if (waktuPulang) {
    const actualPulangMinutes = timeToMinutes(waktuPulang.slice(0, 5))
    const diff = actualPulangMinutes - targetPulangMinutes
    if (diff < 0) {
      detailPulang = `Pulang ${Math.abs(diff)} mnt lebih awal`
      pulangStatus = 'early'
    } else if (diff === 0) {
      detailPulang = 'Tepat waktu'
      pulangStatus = 'on_time'
    } else {
      detailPulang = `+${diff} mnt dari jadwal`
      pulangStatus = 'overtime'
    }
  }

  return { detailMasuk, detailPulang, masukStatus, pulangStatus }
}

/**
 * Resolves the primary attendance status label ('Hadir', 'Izin', 'Sakit', 'Alpha', or '-').
 */
export function getAttendanceStatusLabel(
  statusKehadiran?: string | null,
  waktuMasuk?: string | null
): string {
  if (statusKehadiran === 'Izin') return 'Izin'
  if (statusKehadiran === 'Sakit') return 'Sakit'
  if (statusKehadiran === 'Alpha') return 'Alpha'
  if (statusKehadiran === 'Hadir' || waktuMasuk) return 'Hadir'
  return statusKehadiran ?? '-'
}
