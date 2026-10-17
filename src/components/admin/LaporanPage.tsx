'use client'

import { useState } from 'react'
import { Attendance, Profile, SchoolSettings } from '@/lib/types'
import { getAttendanceReport, updateAttendanceKeterangan } from '@/app/actions/admin'
import { formatTime, getTodayDate, getAttendanceTimeDetails } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { FileSpreadsheet, Search, Download, Loader2, Pencil, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Props {
  guruList: Profile[]
  settings?: SchoolSettings | null
}

export default function LaporanPage({ guruList, settings }: Props) {
  const today = getTodayDate()
  const firstOfMonth = today.slice(0, 8) + '01'

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [selectedGuru, setSelectedGuru] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [data, setData] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<Attendance | null>(null)
  const [keteranganText, setKeteranganText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleSearch() {
    setIsLoading(true)
    const result = await getAttendanceReport(startDate, endDate, selectedGuru === 'all' ? undefined : selectedGuru)
    setData(result)
    setSearched(true)
    setIsLoading(false)
  }

  function handleExportExcel() {
    const excelData = filteredData.map((row, i) => {
      const timeDetails = getAttendanceTimeDetails(row.tanggal, row.waktu_masuk, row.waktu_pulang, settings)
      return {
        'No': i + 1,
        'Tanggal': row.tanggal,
        'Nama Guru': row.profiles?.nama ?? '-',
        'NIP': row.profiles?.nip ?? '-',
        'Masuk': row.waktu_masuk ? formatTime(row.waktu_masuk) : '-',
        'Detail Masuk': timeDetails.detailMasuk,
        'Pulang': row.waktu_pulang ? formatTime(row.waktu_pulang) : '-',
        'Detail Pulang': timeDetails.detailPulang,
        'Status Masuk': row.status_masuk ?? '-',
        'Status Kehadiran': row.status_kehadiran ?? '-',
        'Keterangan': row.keterangan ?? '-',
      }
    })

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi')

    // Set column widths
    ws['!cols'] = [
      { wch: 4 }, { wch: 12 }, { wch: 28 }, { wch: 22 },
      { wch: 8 }, { wch: 22 }, { wch: 8 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 30 },
    ]

    XLSX.writeFile(wb, `Rekap_Absensi_${startDate}_${endDate}.xlsx`)
  }

  async function handleExportPdf() {
    const { exportAttendancePdf } = await import('@/lib/exportAttendancePdf')
    exportAttendancePdf(filteredData, startDate, endDate, selectedStatus, settings)
  }

  function openEditKeterangan(row: Attendance) {
    setSelectedRow(row)
    setKeteranganText(row.keterangan ?? '')
    setEditDialogOpen(true)
  }

  async function handleSaveKeterangan() {
    if (!selectedRow || isSaving) return
    setIsSaving(true)
    const result = await updateAttendanceKeterangan({
      id: selectedRow.id,
      keterangan: keteranganText,
    })
    setIsSaving(false)
    if (result.success) {
      setData(prev =>
        prev.map(r =>
          r.id === selectedRow.id ? { ...r, keterangan: keteranganText } : r
        )
      )
      setEditDialogOpen(false)
      showMessage('success', 'Keterangan berhasil disimpan!')
    } else {
      showMessage('error', result.error ?? 'Terjadi kesalahan')
    }
  }

  const getStatusBadge = (row: Attendance) => {
    if (row.status_kehadiran === 'Izin') return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Izin</Badge>
    if (row.status_kehadiran === 'Sakit') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Sakit</Badge>
    if (row.status_kehadiran === 'Alpha') return <Badge className="bg-red-100 text-red-700 border-red-200">Alpha</Badge>
    if (row.status_masuk === 'Terlambat') return <Badge className="bg-red-100 text-red-700 border-red-200">Terlambat</Badge>
    if (row.waktu_masuk) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Tepat Waktu</Badge>
    return <Badge variant="outline">-</Badge>
  }

  const getRowStatus = (row: Attendance): string => {
    if (row.status_kehadiran === 'Izin') return 'Izin'
    if (row.status_kehadiran === 'Sakit') return 'Sakit'
    if (row.status_kehadiran === 'Alpha') return 'Alpha'
    if (row.status_masuk === 'Terlambat') return 'Terlambat'
    if (row.waktu_masuk) return 'Tepat Waktu'
    return '-'
  }

  // Apply status filter to data
  const filteredData = selectedStatus === 'all' 
    ? data 
    : data.filter(row => getRowStatus(row) === selectedStatus)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Laporan & Export Data</h2>
        <p className="text-gray-500 text-sm mt-1">Filter dan unduh rekap absensi dalam format Excel atau PDF</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? '✓' : '⚠️'} {message.text}
        </div>
      )}

      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Dari Tanggal</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Sampai Tanggal</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Guru</Label>
            <Select value={selectedGuru} onValueChange={setSelectedGuru}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Guru" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Guru</SelectItem>
                {guruList.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="Tepat Waktu">Tepat Waktu</SelectItem>
                <SelectItem value="Terlambat">Terlambat</SelectItem>
                <SelectItem value="Izin">Izin</SelectItem>
                <SelectItem value="Sakit">Sakit</SelectItem>
                <SelectItem value="Alpha">Alpha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="w-full btn-emerald flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Tampilkan
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-600" />
              <h3 className="font-bold text-gray-900">Hasil ({filteredData.length} record)</h3>
            </div>
            {filteredData.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportPdf}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl"
                >
                  <FileText size={14} />
                  Export PDF
                </Button>
                <Button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-xl"
                >
                  <Download size={14} />
                  Export Excel
                </Button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Tanggal</th>
                  <th className="text-left px-5 py-3 font-semibold">Nama Guru</th>
                  <th className="text-left px-4 py-3 font-semibold">Masuk</th>
                  <th className="text-left px-4 py-3 font-semibold">Detail Masuk</th>
                  <th className="text-left px-4 py-3 font-semibold">Pulang</th>
                  <th className="text-left px-4 py-3 font-semibold">Detail Pulang</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((row) => {
                  const timeDetails = getAttendanceTimeDetails(row.tanggal, row.waktu_masuk, row.waktu_pulang, settings)
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-700 font-mono">{row.tanggal}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">{row.profiles?.nama ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">{row.waktu_masuk ? formatTime(row.waktu_masuk) : '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {timeDetails.detailMasuk === '-' ? (
                          <span className="text-gray-400 font-mono">—</span>
                        ) : timeDetails.masukStatus === 'late' ? (
                          <span className="font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md inline-block">
                            {timeDetails.detailMasuk}
                          </span>
                        ) : timeDetails.masukStatus === 'early' ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                            {timeDetails.detailMasuk}
                          </span>
                        ) : (
                          <span className="text-gray-600">{timeDetails.detailMasuk}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">{row.waktu_pulang ? formatTime(row.waktu_pulang) : '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {timeDetails.detailPulang === '-' ? (
                          <span className="text-gray-400 font-mono">—</span>
                        ) : timeDetails.pulangStatus === 'early' ? (
                          <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                            {timeDetails.detailPulang}
                          </span>
                        ) : timeDetails.pulangStatus === 'overtime' ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                            {timeDetails.detailPulang}
                          </span>
                        ) : (
                          <span className="text-gray-600">{timeDetails.detailPulang}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">{getStatusBadge(row)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 flex-1">{row.keterangan ?? '—'}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-gray-400 hover:text-emerald-600"
                            onClick={() => openEditKeterangan(row)}
                          >
                            <Pencil size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                      Tidak ada data untuk filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">Edit Keterangan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <strong>{selectedRow?.profiles?.nama}</strong> — {selectedRow?.tanggal}
            </p>
            <div className="space-y-1">
              <Label>Keterangan</Label>
              <Textarea
                value={keteranganText}
                onChange={e => setKeteranganText(e.target.value)}
                placeholder="Alasan izin, sakit, terlambat, dll..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button className="btn-emerald disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none" onClick={handleSaveKeterangan} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
