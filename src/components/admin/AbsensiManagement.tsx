'use client'

import { useState, useEffect, useTransition } from 'react'
import { getAttendanceManagementData, upsertFullAttendance, bulkFillWaktuPulang, deleteAttendanceRecord } from '@/app/actions/admin'
import { formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarDays, Search, Clock, CheckCircle2, AlertCircle,
  XCircle, UserX, Users, Edit3, Trash2, LogOut, Loader2, Sparkles, RefreshCw, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface TeacherProfile {
  id: string
  nama: string
  nip: string | null
}

interface AttendanceRecord {
  id?: string
  waktu_masuk?: string | null
  waktu_pulang?: string | null
  status_masuk?: 'Tepat Waktu' | 'Terlambat' | null
  status_kehadiran?: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | null
  keterangan?: string | null
}

interface TeacherAttendanceItem {
  profile: TeacherProfile
  attendance: AttendanceRecord | null
}

interface Stats {
  totalGuru: number
  hadir: number
  terlambat: number
  belumPulang: number
  izinSakit: number
  alpha: number
  belumAbsen: number
}

interface Props {
  initialDate: string
  initialList: TeacherAttendanceItem[]
  initialStats: Stats
}

export default function AbsensiManagement({ initialDate, initialList, initialStats }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [list, setList] = useState<TeacherAttendanceItem[]>(initialList)
  const [stats, setStats] = useState<Stats>(initialStats)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'semua' | 'hadir' | 'belum_pulang' | 'belum_absen' | 'izin_sakit' | 'alpha'>('semua')
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Modal Edit State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TeacherAttendanceItem | null>(null)
  const [editStatusKehadiran, setEditStatusKehadiran] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alpha'>('Hadir')
  const [editWaktuMasuk, setEditWaktuMasuk] = useState('')
  const [editWaktuPulang, setEditWaktuPulang] = useState('')
  const [editStatusMasuk, setEditStatusMasuk] = useState<'Tepat Waktu' | 'Terlambat'>('Tepat Waktu')
  const [editKeterangan, setEditKeterangan] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Modal Bulk Action State
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkWaktuPulang, setBulkWaktuPulang] = useState('14:00')
  const [isBulking, setIsBulking] = useState(false)

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch data when selectedDate changes
  const loadData = async (date: string) => {
    setIsLoading(true)
    try {
      const { list: newList, stats: newStats } = await getAttendanceManagementData(date)
      setList(newList)
      setStats(newStats)
    } catch {
      toast.error('Gagal mengambil data absensi')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDate !== initialDate) {
      loadData(selectedDate)
    }
  }, [selectedDate, initialDate])

  const handleRefresh = () => {
    startTransition(() => {
      loadData(selectedDate)
    })
  }

  // Handle open edit modal
  const openEditModal = (item: TeacherAttendanceItem) => {
    setSelectedItem(item)
    const att = item.attendance
    if (att) {
      setEditStatusKehadiran(att.status_kehadiran || 'Hadir')
      setEditWaktuMasuk(att.waktu_masuk ? att.waktu_masuk.slice(0, 5) : '07:00')
      setEditWaktuPulang(att.waktu_pulang ? att.waktu_pulang.slice(0, 5) : '')
      setEditStatusMasuk(att.status_masuk || 'Tepat Waktu')
      setEditKeterangan(att.keterangan || '')
    } else {
      setEditStatusKehadiran('Hadir')
      setEditWaktuMasuk('07:00')
      setEditWaktuPulang('')
      setEditStatusMasuk('Tepat Waktu')
      setEditKeterangan('')
    }
    setEditModalOpen(true)
  }

  // Handle Submit Edit Single Attendance
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setIsSaving(true)
    try {
      const res = await upsertFullAttendance({
        userId: selectedItem.profile.id,
        tanggal: selectedDate,
        statusKehadiran: editStatusKehadiran,
        waktuMasuk: editStatusKehadiran === 'Hadir' && editWaktuMasuk ? `${editWaktuMasuk}:00` : null,
        waktuPulang: editStatusKehadiran === 'Hadir' && editWaktuPulang ? `${editWaktuPulang}:00` : null,
        statusMasuk: editStatusKehadiran === 'Hadir' ? editStatusMasuk : undefined,
        keterangan: editKeterangan,
      })

      if (res.success) {
        toast.success(`Data absensi ${selectedItem.profile.nama} berhasil diperbarui`)
        setEditModalOpen(false)
        await loadData(selectedDate)
      } else {
        toast.error(res.error || 'Gagal menyimpan absensi')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Quick Fill Jam Pulang Single
  const handleQuickFillPulang = async (item: TeacherAttendanceItem) => {
    const defaultTime = '14:00:00'
    try {
      const res = await upsertFullAttendance({
        userId: item.profile.id,
        tanggal: selectedDate,
        statusKehadiran: 'Hadir',
        waktuMasuk: item.attendance?.waktu_masuk || '07:00:00',
        waktuPulang: defaultTime,
        statusMasuk: item.attendance?.status_masuk || 'Tepat Waktu',
        keterangan: item.attendance?.keterangan || 'Jam pulang diisi admin',
      })

      if (res.success) {
        toast.success(`Jam pulang ${item.profile.nama} diisi (14:00)`)
        await loadData(selectedDate)
      } else {
        toast.error(res.error || 'Gagal mengisi jam pulang')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  // Handle Bulk Fill Jam Pulang
  const handleBulkFillPulang = async () => {
    if (!bulkWaktuPulang) {
      toast.error('Isi jam pulang terlebih dahulu')
      return
    }

    setIsBulking(true)
    try {
      const formattedTime = bulkWaktuPulang.length === 5 ? `${bulkWaktuPulang}:00` : bulkWaktuPulang
      const res = await bulkFillWaktuPulang(selectedDate, formattedTime)

      if (res.success) {
        toast.success(res.message || 'Berhasil mengisi jam pulang massal')
        setBulkModalOpen(false)
        await loadData(selectedDate)
      } else {
        toast.error(res.error || 'Gagal melakukan aksi massal')
      }
    } catch {
      toast.error('Terjadi kesalahan saat pengisian massal')
    } finally {
      setIsBulking(false)
    }
  }

  // Handle Delete / Reset Attendance
  const handleDeleteAttendance = async (item: TeacherAttendanceItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data absensi ${item.profile.nama} pada tanggal ${selectedDate}? Status akan kembali ke 'Belum Absen'.`)) {
      return
    }

    setDeletingId(item.profile.id)
    try {
      const res = await deleteAttendanceRecord(item.profile.id, selectedDate)
      if (res.success) {
        toast.success(`Data absensi ${item.profile.nama} berhasil dihapus/direset`)
        await loadData(selectedDate)
      } else {
        toast.error(res.error || 'Gagal menghapus absensi')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus')
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered list
  const filteredList = list.filter((item) => {
    const matchesSearch =
      item.profile.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.profile.nip && item.profile.nip.includes(searchQuery))

    if (!matchesSearch) return false

    const att = item.attendance
    if (activeFilter === 'hadir') return att?.status_kehadiran === 'Hadir'
    if (activeFilter === 'belum_pulang') return att?.status_kehadiran === 'Hadir' && att?.waktu_masuk && !att?.waktu_pulang
    if (activeFilter === 'belum_absen') return !att
    if (activeFilter === 'izin_sakit') return att?.status_kehadiran === 'Izin' || att?.status_kehadiran === 'Sakit'
    if (activeFilter === 'alpha') return att?.status_kehadiran === 'Alpha'

    return true
  })

  const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Date Picker */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900">Manajemen Absensi Guru</h2>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              CRUD Manual & Edit Tanggal
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Kelola, edit jam masuk/pulang, dan selesaikan absensi guru untuk tanggal <span className="font-semibold text-gray-700">{dateFormatted}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker Filter */}
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-800 outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isPending}
            className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading || isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Bulk Action Button */}
          <Button
            onClick={() => setBulkModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 font-medium"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Isi Jam Pulang Massal ({stats.belumPulang})
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.totalGuru}</p>
              <p className="text-xs text-gray-500 font-medium">Total Guru</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.hadir}</p>
              <p className="text-xs text-gray-500 font-medium">Total Hadir</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <LogOut size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-900">{stats.belumPulang}</p>
              <p className="text-xs text-amber-700 font-semibold">Belum Pulang</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
              <UserX size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.belumAbsen}</p>
              <p className="text-xs text-gray-500 font-medium">Belum Absen</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.izinSakit}</p>
              <p className="text-xs text-gray-500 font-medium">Izin / Sakit</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.alpha}</p>
              <p className="text-xs text-gray-500 font-medium">Alpha</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Controls: Search & Tabs */}
        <div className="p-4 lg:p-6 border-b border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama guru atau NIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Total Results */}
            <p className="text-xs text-gray-500 self-end sm:self-center">
              Menampilkan <span className="font-bold text-gray-800">{filteredList.length}</span> dari {list.length} guru
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveFilter('semua')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'semua'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({list.length})
            </button>
            <button
              onClick={() => setActiveFilter('hadir')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'hadir'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Hadir ({stats.hadir})
            </button>
            <button
              onClick={() => setActiveFilter('belum_pulang')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'belum_pulang'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              ⚠️ Belum Absen Pulang ({stats.belumPulang})
            </button>
            <button
              onClick={() => setActiveFilter('belum_absen')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'belum_absen'
                  ? 'bg-gray-700 text-white shadow-md shadow-gray-700/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Belum Absen ({stats.belumAbsen})
            </button>
            <button
              onClick={() => setActiveFilter('izin_sakit')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'izin_sakit'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Izin / Sakit ({stats.izinSakit})
            </button>
            <button
              onClick={() => setActiveFilter('alpha')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'alpha'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Alpha ({stats.alpha})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-bold">Guru & NIP</th>
                <th className="px-6 py-4 font-bold">Jam Masuk</th>
                <th className="px-6 py-4 font-bold">Jam Pulang</th>
                <th className="px-6 py-4 font-bold">Status Kehadiran</th>
                <th className="px-6 py-4 font-bold">Keterangan</th>
                <th className="px-6 py-4 font-bold text-right">Aksi Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredList.map((item) => {
                const att = item.attendance
                const isBelumPulang = att?.status_kehadiran === 'Hadir' && att?.waktu_masuk && !att?.waktu_pulang

                return (
                  <tr key={item.profile.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Nama & NIP */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{item.profile.nama}</p>
                      <p className="text-xs text-gray-400">{item.profile.nip ? `NIP: ${item.profile.nip}` : 'Tanpa NIP'}</p>
                    </td>

                    {/* Jam Masuk */}
                    <td className="px-6 py-4">
                      {att?.waktu_masuk ? (
                        <div className="space-y-0.5">
                          <span className="font-mono text-sm font-semibold text-gray-800">
                            {formatTime(att.waktu_masuk)}
                          </span>
                          {att.status_masuk === 'Terlambat' ? (
                            <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                              Terlambat
                            </Badge>
                          ) : (
                            <Badge className="ml-2 bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                              Tepat Waktu
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm font-mono">—</span>
                      )}
                    </td>

                    {/* Jam Pulang */}
                    <td className="px-6 py-4">
                      {att?.waktu_pulang ? (
                        <span className="font-mono text-sm font-semibold text-gray-800">
                          {formatTime(att.waktu_pulang)}
                        </span>
                      ) : isBelumPulang ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 animate-pulse text-amber-600" /> Belum Absen Pulang
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm font-mono">—</span>
                      )}
                    </td>

                    {/* Status Kehadiran */}
                    <td className="px-6 py-4">
                      {!att ? (
                        <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">
                          Belum Absen
                        </Badge>
                      ) : att.status_kehadiran === 'Hadir' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Hadir ✓
                        </Badge>
                      ) : att.status_kehadiran === 'Izin' ? (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          Izin
                        </Badge>
                      ) : att.status_kehadiran === 'Sakit' ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Sakit
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Alpha
                        </Badge>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-600">
                      {att?.keterangan || <span className="text-gray-300">-</span>}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Fill Pulang Button */}
                        {isBelumPulang && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickFillPulang(item)}
                            title="Isi Jam Pulang (14:00)"
                            className="bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 text-xs px-2.5 py-1 h-8 rounded-lg"
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            + Pulang (14:00)
                          </Button>
                        )}

                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(item)}
                          className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-xs h-8 px-2.5 rounded-lg border-gray-200"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>

                        {/* Delete/Reset Button */}
                        {att && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAttendance(item)}
                            disabled={deletingId === item.profile.id}
                            title="Reset / Hapus Absensi"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                          >
                            {deletingId === item.profile.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    {searchQuery ? 'Tidak ada guru yang sesuai dengan kata kunci pencarian.' : 'Tidak ada data absensi untuk kriteria filter ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT SINGLE ATTENDANCE */}
      {editModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-900">
              <div>
                <h3 className="font-bold text-lg">Edit Manual Absensi</h3>
                <p className="text-xs text-emerald-300">{selectedItem.profile.nama} • Tanggal: {selectedDate}</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-emerald-300 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="p-6 space-y-4">
              {/* Status Kehadiran */}
              <div>
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Status Kehadiran
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditStatusKehadiran(status)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        editStatusKehadiran === status
                          ? status === 'Hadir'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : status === 'Izin'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                            : status === 'Sakit'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-red-600 text-white border-red-600 shadow-md'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs if HADIR */}
              {editStatusKehadiran === 'Hadir' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="waktuMasuk" className="text-xs font-semibold text-gray-700 mb-1 block">
                        Jam Masuk
                      </Label>
                      <Input
                        id="waktuMasuk"
                        type="time"
                        value={editWaktuMasuk}
                        onChange={(e) => setEditWaktuMasuk(e.target.value)}
                        className="rounded-xl border-gray-200"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="statusMasuk" className="text-xs font-semibold text-gray-700 mb-1 block">
                        Status Masuk
                      </Label>
                      <select
                        id="statusMasuk"
                        value={editStatusMasuk}
                        onChange={(e) => setEditStatusMasuk(e.target.value as 'Tepat Waktu' | 'Terlambat')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="Tepat Waktu">Tepat Waktu</option>
                        <option value="Terlambat">Terlambat</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="waktuPulang" className="text-xs font-semibold text-gray-700 mb-1 block">
                      Jam Pulang (Kosongkan jika belum absen pulang)
                    </Label>
                    <Input
                      id="waktuPulang"
                      type="time"
                      value={editWaktuPulang}
                      onChange={(e) => setEditWaktuPulang(e.target.value)}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
              )}

              {/* Keterangan */}
              <div>
                <Label htmlFor="keterangan" className="text-xs font-semibold text-gray-700 mb-1 block">
                  Keterangan / Alasan Edit
                </Label>
                <Textarea
                  id="keterangan"
                  rows={2}
                  placeholder="Contoh: HP tertinggal, diedit manual oleh admin"
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="rounded-xl border-gray-200 text-sm"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border-gray-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BULK FILL WAKTU PULANG */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Isi Jam Pulang Massal
                </h3>
                <p className="text-xs text-amber-100">Tanggal: {selectedDate}</p>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-amber-200 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Aksi ini akan mengisi jam pulang secara otomatis untuk <strong className="font-bold">{stats.belumPulang} guru</strong> yang sudah absen masuk tetapi <span className="underline">belum memiliki record jam pulang</span> pada tanggal ini.
                </p>
              </div>

              <div>
                <Label htmlFor="bulkTime" className="text-xs font-bold text-gray-700 mb-1.5 block">
                  Pilih Jam Pulang Default
                </Label>
                <Input
                  id="bulkTime"
                  type="time"
                  value={bulkWaktuPulang}
                  onChange={(e) => setBulkWaktuPulang(e.target.value)}
                  className="rounded-xl border-gray-200 text-lg font-mono text-center font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkModalOpen(false)}
                  className="rounded-xl border-gray-200"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkFillPulang}
                  disabled={isBulking || stats.belumPulang === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20"
                >
                  {isBulking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses Massal...
                    </>
                  ) : (
                    `Terapkan ke ${stats.belumPulang} Guru`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
