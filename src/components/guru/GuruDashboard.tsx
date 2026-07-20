'use client'

import { useState, useEffect } from 'react'
import { Profile, SchoolSettings, Attendance } from '@/lib/types'
import { logout } from '@/app/actions/auth'
import { scanAttendance } from '@/app/actions/attendance'
import { checkGpsRadius, playBeepSound, vibrate, formatTime } from '@/lib/utils'
import QrScanner from './QrScanner'
import ScanSuccessModal from './ScanSuccessModal'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, Clock, LogOut, MapPin, AlertCircle,
  CalendarCheck, Scan, ChevronRight, User
} from 'lucide-react'

interface Props {
  profile: Profile
  settings: SchoolSettings | null
  todayAttendance: Attendance | null
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error' | 'done'

export default function GuruDashboard({ profile, settings, todayAttendance }: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(todayAttendance)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState<{ message: string; type: 'masuk' | 'pulang' } | null>(null)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])


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

    const gps = await checkGpsRadius(settings.latitude, settings.longitude, settings.max_radius_meters)
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
            <div className="w-10 h-10 rounded-xl bg-gold-600 flex items-center justify-center shadow-lg shadow-gold-600/40">
              <span className="text-white font-black text-sm">MI</span>
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
              <Clock size={14} className="text-gold-400" />
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
              <p className="text-emerald-400 text-sm mt-1">Belum absen</p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <CalendarCheck size={14} className="text-gold-400" />
              <span className="text-emerald-300 text-xs font-medium">Absen Pulang</span>
            </div>
            {attendance?.waktu_pulang ? (
              <p className="text-white font-bold text-xl tabular-nums">{formatTime(attendance.waktu_pulang)}</p>
            ) : (
              <p className="text-emerald-400 text-sm mt-1">Belum absen</p>
            )}
          </div>
        </div>

        {/* Settings info */}
        {settings && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs px-1">
            <Clock size={12} />
            <span>Jam Masuk: {formatTime(settings.jam_masuk)} • Jam Pulang: {formatTime(settings.jam_pulang)}</span>
          </div>
        )}
  
        {/* Error Message */}
        {scanState === 'error' && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Scanner */}
        {scanState === 'scanning' && (
          <div className="animate-fade-in">
            <QrScanner onScan={handleScan} onClose={() => setScanState('idle')} />
          </div>
        )}

        {/* Main Scan Button */}
        {!isDone ? (
          <button
            onClick={() => {
              setErrorMsg('')
              setScanState(scanState === 'scanning' ? 'idle' : 'scanning')
            }}
            disabled={scanState === 'processing'}
            className={`w-full py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl
              ${scanState === 'scanning'
                ? 'bg-red-500/80 text-white border border-red-400/50'
                : 'bg-gold-600 hover:bg-gold-500 text-white shadow-gold-600/40 hover:-translate-y-0.5 active:translate-y-0'
              }
              ${scanState === 'processing' ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {scanState === 'processing' ? (
              <>
                <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : scanState === 'scanning' ? (
              <>
                <AlertCircle size={24} />
                Tutup Kamera
              </>
            ) : (
              <>
                <Scan size={24} />
                {getScanButtonLabel()}
                <ChevronRight size={20} className="ml-auto" />
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
