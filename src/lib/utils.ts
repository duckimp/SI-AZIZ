import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
 * Checks if a user is within the allowed radius from school.
 */
export async function checkGpsRadius(
  schoolLat: number,
  schoolLon: number,
  maxRadius: number
): Promise<{ allowed: boolean; distance: number; error?: string }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ allowed: false, distance: 0, error: 'GPS tidak tersedia di browser ini.' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = haversineDistance(
          position.coords.latitude,
          position.coords.longitude,
          schoolLat,
          schoolLon
        )
        resolve({ allowed: distance <= maxRadius, distance: Math.round(distance) })
      },
      (err) => {
        resolve({ allowed: false, distance: 0, error: `Gagal mendapatkan lokasi: ${err.message}` })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
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
