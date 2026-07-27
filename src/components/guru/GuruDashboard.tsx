'use client'

import { useState, useEffect, useRef } from 'react'
import { Profile, SchoolSettings, Attendance } from '@/lib/types'
import { logout } from '@/app/actions/auth'
import { scanAttendance } from '@/app/actions/attendance'
import { checkGpsRadius, playBeepSound, vibrate, formatTime } from '@/lib/utils'
import QrScanner from './QrScanner'
import ScanSuccessModal from './ScanSuccessModal'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, Clock, LogOut, MapPin, AlertCircle,
  CalendarCheck, User
} from 'lucide-react'
import NextImage from 'next/image'

interface Props {
  profile: Profile
  settings: SchoolSettings | null
  todayAttendance: Attendance | null
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error' | 'done'

export default function GuruDashboard({ profile, settings, todayAttendance }: Props) {
  // Helper: get today's date in Asia/Jakarta
  const getJakartaDate = () =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date())

  // Only use todayAttendance if it matches today's Jakarta date (prevents stale PWA cache)
  const [attendance, setAttendance] = useState<Attendance | null>(
    todayAttendance?.tanggal === getJakartaDate() ? todayAttendance : null
  )
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState<{ message: string; type: 'masuk' | 'pulang' } | null>(null)
  const [currentTime, setCurrentTime] = useState('')
  const currentDateRef = useRef(getJakartaDate())
  const gpsCache = useRef<{ allowed: boolean; distance: number; error?: string; ts: number } | null>(null)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }))

      // Detect day change — reset attendance state at midnight Jakarta
      const newDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(now)
      if (currentDateRef.current !== newDate) {
        currentDateRef.current = newDate
        setAttendance(null)
        setScanState('idle')
        gpsCache.current = null
      }
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Pre-fetch GPS as soon as scanner is opened so it's ready when QR is scanned
  const startScanner = () => {
    setErrorMsg('')
    setScanState('scanning')
    if (settings) {
      // Start GPS fetch in background immediately
      checkGpsRadius(settings.latitude, settings.longitude, settings.max_radius_meters)
        .then(result => {
          gpsCache.current = { ...result, ts: Date.now() }
        })
        .catch(() => {})
    }
  }

  const getScanButtonLabel = () => {
    if (!attendance?.waktu_masuk) return 'Scan Absen Masuk'
    if (attendance.waktu_masuk && !attendance.waktu_pulang) return 'Scan Absen Pulang'
    return 'Sudah Selesai Absen Hari Ini ✓'
  }

  const handleScan = async (qrData: string) => {
    setScanState('processing')
    setErrorMsg('')

    if (!settings) {
      setErrorMsg('Pengaturan sekolah belum dikonfigurasi.')
      setScanState('error')
      return
    }

    // Use cached GPS (if fresh < 15s), otherwise fetch again
    const GPS_CACHE_TTL = 15000
    const gps = gpsCache.current && (Date.now() - gpsCache.current.ts) < GPS_CACHE_TTL
      ? gpsCache.current
      : await checkGpsRadius(settings.latitude, settings.longitude, settings.max_radius_meters)

    gpsCache.current = { ...gps, ts: Date.now() }

    if (!gps.allowed) {
      setErrorMsg(gps.error ?? `Anda terlalu jauh dari sekolah (${gps.distance}m). Maksimal ${settings.max_radius_meters}m.`)
      setScanState('error')
      return
    }

    const result = await scanAttendance(qrData, gps.distance)

    if (result.success) {
      playBeepSound()
      vibrate([100, 50, 100])
      setAttendance(result.attendance as Attendance)
      setSuccessData({ message: result.message, type: result.scanType as 'masuk' | 'pulang' })
      setScanState('success')
    } else {
      setErrorMsg(result.message)
      setScanState('error')
    }
  }

  const isDone = attendance?.waktu_masuk && attendance?.waktu_pulang

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800">
      {/* Header */}
      <header className="px-5 pt-safe-top pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0 drop-shadow">
              <NextImage
                src="/logo.png"
                alt="Logo MI Nur Aziz"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-emerald-300 text-xs font-medium">Si-Aziz Absensi</p>
              <p className="text-white font-bold text-sm leading-tight">MI Nur Aziz</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1 text-emerald-300 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg">
              <User size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">{profile.nama}</p>
              <p className="text-emerald-300 text-xs">{profile.nip ?? 'Guru'} • MI Nur Aziz</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 pb-8 space-y-4">
        {/* Clock */}
        <div className="text-center py-2">
          <p className="text-5xl font-black text-white tabular-nums tracking-tight">{currentTime}</p>
          <p className="text-emerald-300 text-sm mt-1 capitalize">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-gold-400" />
              <span className="text-emerald-300 text-xs font-medium">Absen Masuk</span>
            </div>
            {attendance?.waktu_masuk ? (
              <>
                <p className="text-white font-bold text-xl tabular-nums">{formatTime(attendance.waktu_masuk)}</p>
                <Badge className={`mt-1 text-xs ${attendance.status_masuk === 'Tepat Waktu' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                  {attendance.status_masuk}
                </Badge>
              </>
            ) : (
              <p className="text-emerald-400 text-md mt-1">Belum absen</p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <CalendarCheck size={16} className="text-gold-400" />
              <span className="text-emerald-300 text-xs font-medium">Absen Pulang</span>
            </div>
            {attendance?.waktu_pulang ? (
              <p className="text-white font-bold text-xl tabular-nums">{formatTime(attendance.waktu_pulang)}</p>
            ) : (
              <p className="text-emerald-400 text-md mt-1">Belum absen</p>
            )}
          </div>
        </div>

        {/* Settings info */}
        {settings && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs px-1">
            <Clock size={12} />
            <span>Jam Masuk: 06.45 WIB • Jam Pulang: 13.15 WIB</span>
          </div>
        )}
  
        {/* Error Message */}
        {scanState === 'error' && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Scanner Modal */}
        {scanState === 'scanning' && (
          <QrScanner onScan={handleScan} onClose={() => setScanState('idle')} />
        )}

        {/* Main Scan Button */}
        {!isDone ? (
          <button
            onClick={() => startScanner()}
            disabled={scanState === 'processing'}
            className={`w-full py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl
              bg-gold-600 hover:bg-gold-500 text-white shadow-gold-600/40 hover:-translate-y-0.5 active:translate-y-0
              ${scanState === 'processing' ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {scanState === 'processing' ? (
              <>
                <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <span className="flex-1 text-center">{getScanButtonLabel()}</span>
              </>
            )}
          </button>
        ) : (
          <div className="w-full py-6 rounded-2xl bg-emerald-700/50 border border-emerald-500/30 flex items-center justify-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-300" />
            <span className="text-emerald-100 font-semibold text-lg">Selesai Absen Hari Ini ✓</span>
          </div>
        )}

        {/* Location info */}
        <div className="flex items-center gap-2 text-emerald-500 text-xs px-1">
          <MapPin size={12} />
          <span>Validasi lokasi GPS aktif • Radius max {settings?.max_radius_meters ?? 50}m dari sekolah</span>
        </div>
      </main>

      {/* Success Modal */}
      {scanState === 'success' && successData && (
        <ScanSuccessModal
          message={successData.message}
          scanType={successData.type}
          onClose={() => setScanState('idle')}
        />
      )}
    </div>
  )
}
