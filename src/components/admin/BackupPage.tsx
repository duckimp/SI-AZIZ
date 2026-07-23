'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { exportSystemData, importSystemData } from '@/app/actions/admin'
import { Download, Upload, Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  async function handleExport() {
    setIsExporting(true)
    setMessage(null)
    try {
      const result = await exportSystemData()
      if (result.success && result.data) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.data, null, 2))
        const downloadAnchor = document.createElement('a')
        const today = new Date().toISOString().split('T')[0]
        downloadAnchor.setAttribute("href", dataStr)
        downloadAnchor.setAttribute("download", `siaziz_backup_${today}.json`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
        showMessage('success', 'File backup data berhasil diexport dan diunduh!')
      } else {
        showMessage('error', result.error ?? 'Gagal membuat file backup.')
      }
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat backup.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      showMessage('error', 'Silakan pilih file backup (.json) terlebih dahulu.')
      return
    }

    if (!confirm('Apakah Anda yakin ingin melakukan restore? Data saat ini mungkin akan ditimpa atau digabungkan.')) {
      return
    }

    setIsImporting(true)
    setMessage(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string)
        const result = await importSystemData(payload)
        if (result.success) {
          showMessage('success', 'Data sistem berhasil direstore sepenuhnya!')
          if (fileInputRef.current) fileInputRef.current.value = ''
        } else {
          showMessage('error', result.error ?? 'Gagal memproses restore data.')
        }
      } catch {
        showMessage('error', 'Format file tidak valid atau rusak. Pastikan Anda mengunggah file JSON backup Si-Aziz yang benar.')
      } finally {
        setIsImporting(false)
      }
    }
    reader.onerror = () => {
      showMessage('error', 'Gagal membaca file.')
      setIsImporting(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Backup & Restore Data</h2>
        <p className="text-gray-500 text-sm mt-1">Ekspor seluruh data absensi dan pengaturan sekolah, atau impor dari file cadangan sebelumnya</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <Download size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Ekspor Data (Backup)</h3>
                <p className="text-xs text-gray-400">Download data cadangan aplikasi</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              Fitur ini akan mengunduh seluruh data penting di database Si-Aziz ke dalam satu file berkstensi <strong>.json</strong>. Data yang diekspor meliputi:
            </p>
            <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
              <li>Pengaturan Sekolah (Nama, GPS Koordinat, Radius, Jam Absensi)</li>
              <li>Profil Guru (Nama, NIP, ID Profil)</li>
              <li>Riwayat Absensi Lengkap (Waktu masuk & pulang, status keterlambatan, manual note)</li>
            </ul>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Gunakan fitur ini secara berkala (misal: setiap akhir semester atau sebulan sekali) untuk cadangan data sekolah Anda secara lokal.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <Button
              onClick={handleExport}
              disabled={isExporting || isImporting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl py-6"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Unduh File Backup (.json)
            </Button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <form onSubmit={handleImport} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Impor Data (Restore)</h3>
                  <p className="text-xs text-gray-400">Kembalikan data dari file cadangan</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                Unggah file backup <strong>.json</strong> yang telah Anda unduh sebelumnya untuk menimpa data pengaturan dan melengkapi riwayat absensi guru.
              </p>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Pilih File Backup</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">
                  <strong>PENTING:</strong> Restore akan menimpa pengaturan sekolah saat ini. Dan untuk guru, email mereka <strong>harus sudah terdaftar di Supabase Auth</strong> dengan ID yang sama agar profil mereka bisa terhubung kembali secara otomatis.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={isImporting || isExporting}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-6"
              >
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Restore & Terapkan Data
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
