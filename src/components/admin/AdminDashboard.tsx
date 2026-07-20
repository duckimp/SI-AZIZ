'use client'

import { DashboardStats } from '@/lib/types'
import { Profile } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Users, CheckCircle2, Clock, XCircle, AlertCircle, UserX,
  TrendingUp
} from 'lucide-react'

interface AttendanceItem {
  profile: Pick<Profile, 'id' | 'nama' | 'nip'>
  attendance: {
    waktu_masuk?: string
    waktu_pulang?: string
    status_masuk?: string
    status_kehadiran?: string
    keterangan?: string
  } | null
}

interface Props {
  stats: DashboardStats
  attendanceList: AttendanceItem[]
  today: string
}

export default function AdminDashboard({ stats, attendanceList, today }: Props) {
  const statCards = [
    { label: 'Total Guru', value: stats.totalGuru, icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Tepat Waktu', value: stats.hadirTepat, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Terlambat', value: stats.terlambat, icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'Izin / Sakit', value: stats.izinSakit, icon: XCircle, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { label: 'Alpha', value: stats.alpha, icon: AlertCircle, color: 'bg-red-50 text-red-600 border-red-100' },
    { label: 'Belum Absen', value: stats.belumAbsen, icon: UserX, color: 'bg-gray-50 text-gray-600 border-gray-200' },
  ]

  const dateStr = new Date(today + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const getStatusBadge = (item: AttendanceItem) => {
    const att = item.attendance
    if (!att) return <Badge variant="outline" className="text-gray-500 border-gray-200">Belum Absen</Badge>
    if (att.status_kehadiran === 'Izin') return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Izin</Badge>
    if (att.status_kehadiran === 'Sakit') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Sakit</Badge>
    if (att.status_kehadiran === 'Alpha') return <Badge className="bg-red-100 text-red-700 border-red-200">Alpha</Badge>
    if (att.waktu_masuk && att.status_masuk === 'Terlambat') return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Terlambat</Badge>
    if (att.waktu_masuk) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Hadir ✓</Badge>
    return <Badge variant="outline">-</Badge>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">Dashboard Absensi</h2>
        <p className="text-gray-500 text-sm capitalize mt-1">{dateStr}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`stat-card border ${s.color}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Attendance Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-emerald-600" />
          <h3 className="font-bold text-gray-900">Tingkat Kehadiran Hari Ini</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
              style={{ width: `${stats.totalGuru ? Math.round(((stats.hadirTepat + stats.terlambat) / stats.totalGuru) * 100) : 0}%` }}
            />
          </div>
          <span className="text-emerald-700 font-bold text-sm w-12 text-right">
            {stats.totalGuru ? Math.round(((stats.hadirTepat + stats.terlambat) / stats.totalGuru) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Live Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Status Absensi Realtime</h3>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-semibold">Nama Guru</th>
                <th className="text-left px-6 py-3 font-semibold">NIP</th>
                <th className="text-left px-6 py-3 font-semibold">Masuk</th>
                <th className="text-left px-6 py-3 font-semibold">Pulang</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendanceList.map((item) => (
                <tr key={item.profile.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{item.profile.nama}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{item.profile.nip ?? '-'}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-700">
                      {item.attendance?.waktu_masuk ? formatTime(item.attendance.waktu_masuk) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-700">
                      {item.attendance?.waktu_pulang ? formatTime(item.attendance.waktu_pulang) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(item)}</td>
                </tr>
              ))}
              {attendanceList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Belum ada data guru. Tambahkan guru terlebih dahulu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
