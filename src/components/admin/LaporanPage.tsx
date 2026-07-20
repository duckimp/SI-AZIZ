'use client'

import { useState } from 'react'
import { Profile } from '@/lib/types'
import { getAttendanceReport } from '@/app/actions/admin'
import { formatTime, getTodayDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, Search, Download, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Props {
  guruList: Profile[]
}

export default function LaporanPage({ guruList }: Props) {
  const today = getTodayDate()
  const firstOfMonth = today.slice(0, 8) + '01'

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [selectedGuru, setSelectedGuru] = useState('all')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    setIsLoading(true)
    const result = await getAttendanceReport(startDate, endDate, selectedGuru === 'all' ? undefined : selectedGuru)
    setData(result)
    setSearched(true)
    setIsLoading(false)
  }

  function handleExportExcel() {
    const excelData = data.map((row, i) => ({
      'No': i + 1,
      'Tanggal': row.tanggal,
      'Nama Guru': row.profiles?.nama ?? '-',
      'NIP': row.profiles?.nip ?? '-',
      'Masuk': row.waktu_masuk ? formatTime(row.waktu_masuk) : '-',
      'Pulang': row.waktu_pulang ? formatTime(row.waktu_pulang) : '-',
      'Status Masuk': row.status_masuk ?? '-',
      'Status Kehadiran': row.status_kehadiran ?? '-',
      'Keterangan': row.keterangan ?? '-',
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi')

    // Set column widths
    ws['!cols'] = [
      { wch: 4 }, { wch: 12 }, { wch: 28 }, { wch: 22 },
      { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 30 },
    ]

    XLSX.writeFile(wb, `Rekap_Absensi_${startDate}_${endDate}.xlsx`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatusBadge = (row: any) => {
    if (row.status_kehadiran === 'Izin') return <Badge className="bg-purple-100 text-purple-700">Izin</Badge>
    if (row.status_kehadiran === 'Sakit') return <Badge className="bg-blue-100 text-blue-700">Sakit</Badge>
    if (row.status_kehadiran === 'Alpha') return <Badge className="bg-red-100 text-red-700">Alpha</Badge>
    if (row.status_masuk === 'Terlambat') return <Badge className="bg-amber-100 text-amber-700">Terlambat</Badge>
    if (row.waktu_masuk) return <Badge className="bg-emerald-100 text-emerald-700">Tepat Waktu</Badge>
    return <Badge variant="outline">-</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Laporan & Export Data</h2>
        <p className="text-gray-500 text-sm mt-1">Filter dan unduh rekap absensi dalam format Excel</p>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <h3 className="font-bold text-gray-900">Hasil ({data.length} record)</h3>
            </div>
            {data.length > 0 && (
              <Button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-xl"
              >
                <Download size={14} />
                Export Excel
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Tanggal</th>
                  <th className="text-left px-6 py-3 font-semibold">Nama Guru</th>
                  <th className="text-left px-6 py-3 font-semibold">Masuk</th>
                  <th className="text-left px-6 py-3 font-semibold">Pulang</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-700 font-mono">{row.tanggal}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">{row.profiles?.nama ?? '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 font-mono">{row.waktu_masuk ? formatTime(row.waktu_masuk) : '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 font-mono">{row.waktu_pulang ? formatTime(row.waktu_pulang) : '—'}</td>
                    <td className="px-6 py-3">{getStatusBadge(row)}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{row.keterangan ?? '—'}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                      Tidak ada data untuk filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
