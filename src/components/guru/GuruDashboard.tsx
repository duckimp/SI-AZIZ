'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Profile, SchoolSettings, Attendance } from '@/lib/types'
import { scanAttendance } from '@/app/actions/attendance'
import { checkGpsRadius, playBeepSound, vibrate, formatTime } from '@/lib/utils'
import DigitalClock from './DigitalClock'
import ScanSuccessModal from './ScanSuccessModal'
import LogoutModal from '@/components/LogoutModal'

const QrScanner = dynamic(() => import('./QrScanner'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white p-4">
      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
      <p className="text-sm font-semibold tracking-wide">Menyiapkan Kamera...</p>
    </div>
  ),
})
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, Clock, LogOut, MapPin, AlertCircle,
  CalendarCheck, User, Sparkles, RefreshCw, ShieldCheck, X, ArrowUpCircle
} from 'lucide-react'
import NextImage from 'next/image'

interface Props {
  profile: Profile
  settings: SchoolSettings | null
  todayAttendance: Attendance | null
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error' | 'done'

// Versi tampilan aplikasi saat ini (ganti string ini saat ingin memicu banner update ke semua guru)
const APP_VERSION = '2026.10.17-light'

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
  const gpsCache = useRef<{ allowed: boolean; distance: number; error?: string; ts: number } | null>(null)

  // Callback saat pergantian hari di tengah malam waktu Jakarta
  const handleDayChange = useCallback(() => {
    setAttendance(null)
    setScanState('idle')
    gpsCache.current = null
  }, [])

  // Update App Overlay state
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [hasNewUpdate, setHasNewUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Cek versi aplikasi di localStorage saat pertama kali dimuat
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem('siaziz_app_version')
      if (!storedVersion || storedVersion !== APP_VERSION) {
        setHasNewUpdate(true)
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, [])

  const handleApplyUpdate = async () => {
    setIsUpdating(true)
    try {
      localStorage.setItem('siaziz_app_version', APP_VERSION)
      // Bersihkan asset cache jika browser mendukung Cache API (tidak menyentuh cookie session)
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
      }
    } catch {
      // Continue reload even if cache clearing errors
    }
    // Hard reload browser untuk mengambil CSS & JS bundle terbaru
    window.location.reload()
  }

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
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col justify-between">
      <div>
        {/* Header Bersih & Berkarakter */}
        <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white px-5 pt-safe-top pt-6 pb-6 shadow-md">
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
                <p className="text-emerald-200 text-[11px] font-semibold tracking-wide uppercase">Si-Aziz Presensi</p>
                <p className="text-white font-bold text-sm leading-tight">MI Nur Aziz</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Manual Update Tampilan */}
              <button
                onClick={() => setShowUpdateModal(true)}
                title="Perbarui Tampilan Aplikasi"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-emerald-100 hover:text-white font-medium transition-all"
              >
                <Sparkles size={13} className="text-amber-300" />
                <span className="hidden xs:inline">Update</span>
              </button>

              {/* Tombol Keluar Merah Solid */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <LogOut size={13} />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* Profile Card Kontras Tinggi */}
          <div className="mt-5 bg-white text-gray-900 rounded-2xl p-4 shadow-sm border border-emerald-700/30 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-sm shrink-0">
              <User size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-extrabold text-base truncate">{profile.nama}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {profile.nip ? `NIP: ${profile.nip}` : 'Guru'}
                </span>
                <span className="text-gray-400 text-xs">• MI Nur Aziz</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content (Light Theme - Anti-Silau) */}
        <main className="px-5 py-6 space-y-4">
          {/* Jam & Tanggal Raksasa Kontras Tinggi (Komponen Terisolasi agar hemat CPU/RAM) */}
          <DigitalClock onDayChange={handleDayChange} />

          {/* Status Cards (Absen Masuk & Pulang) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Absen Masuk */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Clock size={16} />
                </div>
                <span className="text-gray-700 text-xs font-bold">Absen Masuk</span>
              </div>

              {attendance?.waktu_masuk ? (
                <div>
                  <p className="text-gray-900 font-black text-2xl font-mono tabular-nums">
                    {formatTime(attendance.waktu_masuk)}
                  </p>
                  <div className="mt-1.5">
                    {attendance.status_masuk === 'Terlambat' ? (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-bold">
                        Terlambat
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                        Tepat Waktu ✓
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 font-bold text-lg font-mono">--:--</p>
                  <span className="inline-block mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Belum Absen
                  </span>
                </div>
              )}
            </div>

            {/* Absen Pulang */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CalendarCheck size={16} />
                </div>
                <span className="text-gray-700 text-xs font-bold">Absen Pulang</span>
              </div>

              {attendance?.waktu_pulang ? (
                <div>
                  <p className="text-gray-900 font-black text-2xl font-mono tabular-nums">
                    {formatTime(attendance.waktu_pulang)}
                  </p>
                  <div className="mt-1.5">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                      Sudah Pulang ✓
                    </Badge>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 font-bold text-lg font-mono">--:--</p>
                  <span className="inline-block mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Belum Absen
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Jam Masuk & Pulang Info */}
          {settings && (
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 flex items-center justify-center gap-2 text-emerald-900 text-xs font-semibold">
              <Clock size={14} className="text-emerald-700 shrink-0" />
              <span>Jadwal: Masuk 06.45 WIB • Pulang 13.15 WIB</span>
            </div>
          )}

          {/* Error Message */}
          {scanState === 'error' && (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3 animate-fade-in shadow-sm">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Scanner Modal */}
          {scanState === 'scanning' && (
            <QrScanner onScan={handleScan} onClose={() => setScanState('idle')} />
          )}

          {/* Main Action Scan Button */}
          {!isDone ? (
            <button
              onClick={() => startScanner()}
              disabled={scanState === 'processing'}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-xl
                bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/30 active:scale-[0.98]
                ${scanState === 'processing' ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {scanState === 'processing' ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Memvalidasi Lokasi & Presensi...</span>
                </>
              ) : (
                <span className="font-extrabold tracking-wide">{getScanButtonLabel()}</span>
              )}
            </button>
          ) : (
            <div className="w-full py-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-800 flex items-center justify-center gap-3 shadow-sm">
              <CheckCircle2 size={24} className="text-emerald-600" />
              <span className="font-bold text-base">Presensi Hari Ini Selesai ✓</span>
            </div>
          )}

          {/* Location Info */}
          <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs px-1">
            <MapPin size={13} className="text-emerald-700" />
            <span>Validasi lokasi GPS aktif • Radius max {settings?.max_radius_meters ?? 50}m</span>
          </div>
        </main>
      </div>

      {/* FLOATING BANNER UPDATE (Muncul otomatis jika ada versi baru) */}
      {hasNewUpdate && !showUpdateModal && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-950 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">Tampilan Baru Tersedia!</p>
                <p className="text-[11px] text-emerald-200 truncate">Perbarui untuk tampilan lebih terang & jelas</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1"
              >
                {isUpdating ? <RefreshCw size={12} className="animate-spin" /> : <ArrowUpCircle size={13} />}
                <span>Update</span>
              </button>
              <button
                onClick={() => setHasNewUpdate(false)}
                className="text-emerald-300 hover:text-white p-1"
                title="Tutup pemberitahuan"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY DETAIL UPDATE (Bisa dibuka kapan saja lewat tombol 'Update' di header) */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles size={32} className="text-emerald-600" />
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-1">Pembaruan Tampilan</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Memuat aset CSS & JavaScript terbaru agar tampilan lebih kontras, anti-silau di luar ruangan, dan optimal.
            </p>

            {/* Jaminan Sesi Login Aman */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 text-left flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                <strong>Sesi login Anda aman 100%.</strong> Proses ini hanya me-refresh tampilan dan tidak akan mengeluarkan akun Anda.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-700/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Memperbarui Tampilan...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle size={18} />
                    <span>Perbarui Sekarang</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowUpdateModal(false)}
                disabled={isUpdating}
                className="w-full py-3 px-4 text-gray-500 hover:text-gray-700 text-sm font-semibold rounded-xl transition-all"
              >
                Tutup / Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {scanState === 'success' && successData && (
        <ScanSuccessModal
          message={successData.message}
          scanType={successData.type}
          onClose={() => setScanState('idle')}
        />
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  )
}

