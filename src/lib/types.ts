export type UserRole = 'guru' | 'admin'

export interface Profile {
  id: string
  nip: string | null
  nama: string
  role: UserRole
  created_at: string
}

export interface SchoolSettings {
  id: number
  nama_sekolah: string
  qr_secret_token: string
  latitude: number
  longitude: number
  max_radius_meters: number
  jam_masuk: string
  jam_pulang: string
}

export interface Attendance {
  id: string
  user_id: string
  tanggal: string
  waktu_masuk: string | null
  waktu_pulang: string | null
  status_masuk: 'Tepat Waktu' | 'Terlambat'
  status_kehadiran: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha'
  distance_masuk_meters: number | null
  distance_pulang_meters: number | null
  keterangan: string | null
  created_at: string
  profiles?: Profile
}

export type AttendanceScanType = 'masuk' | 'pulang'

export interface ScanResult {
  success: boolean
  message: string
  scanType?: AttendanceScanType
  attendance?: Attendance
}

export interface DashboardStats {
  totalGuru: number
  hadirTepat: number
  terlambat: number
  izinSakit: number
  alpha: number
  belumAbsen: number
}
