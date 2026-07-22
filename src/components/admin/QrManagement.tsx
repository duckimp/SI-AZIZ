'use client'

import { useState } from 'react'
import { SchoolSettings, JadwalHari } from '@/lib/types'
import { resetQrToken, updateJadwalHarian } from '@/app/actions/admin'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Printer, ShieldCheck, AlertTriangle, Loader2, Copy, Check, Clock, Save, Info } from 'lucide-react'

interface Props {
  settings: SchoolSettings | null
}

const HARI = [
  { key: '1', label: 'Senin' },
  { key: '2', label: 'Selasa' },
  { key: '3', label: 'Rabu' },
  { key: '4', label: 'Kamis' },
  { key: '5', label: 'Jumat' },
  { key: '6', label: 'Sabtu' },
  { key: '0', label: 'Minggu' },
]

const DEFAULT_JADWAL: Record<string, JadwalHari> = {
  '1': { masuk: '07:00', pulang: '13:30', libur: false },
  '2': { masuk: '07:00', pulang: '13:30', libur: false },
  '3': { masuk: '07:00', pulang: '13:30', libur: false },
  '4': { masuk: '07:00', pulang: '13:30', libur: false },
  '5': { masuk: '07:00', pulang: '10:30', libur: false },
  '6': { masuk: '07:00', pulang: '11:20', libur: false },
  '0': { masuk: '07:00', pulang: '13:30', libur: true },
}

export default function QrManagement({ settings: initialSettings }: Props) {
  const [settings, setSettings] = useState<SchoolSettings | null>(initialSettings)
  const [isResetting, setIsResetting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [jadwal, setJadwal] = useState<Record<string, JadwalHari>>(
    initialSettings?.jadwal_harian ?? DEFAULT_JADWAL
  )

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  function updateJadwalField(key: string, field: keyof JadwalHari, value: string | boolean) {
    setJadwal(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }))
  }

  async function handleSaveJadwal() {
    setIsSaving(true)
    const result = await updateJadwalHarian(jadwal)
    if (result.success && settings) {
      setSettings({ ...settings, jadwal_harian: jadwal })
      showMessage('success', 'Jadwal jam berhasil disimpan!')
    } else {
      showMessage('error', result.error ?? 'Gagal menyimpan jadwal.')
    }
    setIsSaving(false)
  }

  async function handleResetToken() {
    if (!confirm('Yakin ingin reset token QR? QR Code lama akan TIDAK VALID.')) return
    setIsResetting(true)
    const newToken = `SIAZIZ-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const result = await resetQrToken(newToken)
    if (result.success && settings) {
      setSettings({ ...settings, qr_secret_token: newToken })
      showMessage('success', 'Token QR berhasil di-reset! Cetak dan tempel QR baru.')
    } else {
      showMessage('error', result.error ?? 'Gagal mereset token.')
    }
    setIsResetting(false)
  }

  function handlePrint() {
    if (!settings) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Render QR as SVG string
    const svgEl = document.querySelector('#qr-preview-svg svg') as SVGElement
    const svgString = svgEl ? svgEl.outerHTML : ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Absensi - MI Nur Aziz</title>
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; font-family: sans-serif; }
          .frame { border: 8px solid #064E3B; border-radius: 24px; padding: 40px; max-width: 500px; width: 100%; box-shadow: 0 0 0 4px #D97706; }
          .header { background: linear-gradient(135deg, #022c22, #064e3b); border-radius: 16px; padding: 16px 24px; margin-bottom: 16px; text-align: center; }
          .school-name { color: #D97706; font-weight: 900; font-size: 28px; margin: 0; letter-spacing: 2px; }
          .school-sub { color: #a7f3d0; font-size: 12px; margin: 4px 0 0; letter-spacing: 1px; }
          .qr-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
          .qr-outer { background: #064E3B; border-radius: 20px; padding: 20px; }
          .qr-inner { background: #fff; border-radius: 12px; padding: 12px; }
          .footer { background: #f0fdf4; border-radius: 12px; padding: 12px 20px; border: 1px solid #bbf7d0; text-align: center; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="frame">
          <div class="header">
            <p class="school-name">MI NUR AZIZ</p>
            <p class="school-sub">ABSENSI DIGITAL SI-AZIZ</p>
          </div>
          <p style="text-align:center; color:#064E3B; font-size:14px; font-weight:700; margin:0 0 4px">Scan QR Code untuk Absensi</p>
          <p style="text-align:center; color:#6b7280; font-size:11px; margin:0 0 20px">Pastikan GPS aktif & dalam radius ${settings.max_radius_meters ?? 50}m</p>
          <div class="qr-wrap">
            <div class="qr-outer">
              <div class="qr-inner">${svgString}</div>
            </div>
          </div>
          <div class="footer">
            <p style="color:#064E3B; font-size:13px; font-weight:700; margin:0">Jam Masuk: ${jadwal['1']?.masuk ?? '07:00'} WIB</p>
            <p style="color:#6b7280; font-size:11px; margin:4px 0 0">Terlambat jika scan setelah jam masuk yang telah ditentukan</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 300);
          };
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  function handleCopyToken() {
    if (settings) {
      navigator.clipboard.writeText(settings.qr_secret_token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!settings) {
    return (
      <div className="text-center py-16 text-gray-400">
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
        <p>Pengaturan sekolah belum dikonfigurasi.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Kelola QR Code Absensi</h2>
          <p className="text-gray-500 text-sm mt-1">Generate QR Code dan atur jadwal jam per hari</p>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? '✓' : '⚠️'} {message.text}
          </div>
        )}

        {/* QR + Token */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="font-bold text-gray-900 mb-4">Preview QR Code</h3>
            <div id="qr-preview-svg" className="bg-emerald-950 p-6 rounded-2xl shadow-inner mb-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={settings.qr_secret_token} size={220} level="H" includeMargin={false} fgColor="#064E3B" />
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">Scan QR ini untuk absen masuk & pulang</p>
            <div className="flex gap-3 w-full">
              <Button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl">
                <Printer size={16} /> Cetak QR
              </Button>
              <Button onClick={handleResetToken} disabled={isResetting} variant="outline" className="flex-1 flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl">
                {isResetting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Reset Token
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="font-bold text-gray-900">Informasi Token</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Token Aktif</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-gray-800 break-all flex-1">{settings.qr_secret_token}</p>
                <button onClick={handleCopyToken} className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nama Sekolah', value: settings.nama_sekolah },
                { label: 'Radius Max GPS', value: `${settings.max_radius_meters} meter` },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">Jaga kerahasiaan token ini. Jika QR Code bocor, segera klik <strong>Reset Token</strong>.</p>
            </div>
          </div>
        </div>

        {/* Jadwal Per Hari */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-emerald-600" />
              <div>
                <h3 className="font-bold text-gray-900">Jadwal Jam Per Hari</h3>
                <p className="text-xs text-gray-400 mt-0.5">Atur jam masuk & pulang untuk setiap hari. Centang Libur jika tidak ada absensi.</p>
              </div>
            </div>
            <Button onClick={handleSaveJadwal} disabled={isSaving} className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl px-4 h-10 text-sm">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>

          {/* Tabel */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-xs text-gray-400 font-semibold uppercase tracking-wider w-28">Pengaturan</td>
                  {HARI.map(h => (
                    <td key={h.key} className="py-2 px-2 text-center">
                      <span className={`text-xs font-bold ${jadwal[h.key]?.libur ? 'text-gray-300' : 'text-gray-700'}`}>
                        {h.label}
                      </span>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* Row Libur */}
                <tr>
                  <td className="py-3 pr-4 text-xs font-semibold text-gray-500">Libur</td>
                  {HARI.map(h => (
                    <td key={h.key} className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={jadwal[h.key]?.libur ?? false}
                        onChange={e => updateJadwalField(h.key, 'libur', e.target.checked)}
                        className="w-4 h-4 accent-red-500 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
                {/* Row Jam Masuk */}
                <tr>
                  <td className="py-3 pr-4 text-xs font-semibold text-gray-500">Jam Masuk</td>
                  {HARI.map(h => (
                    <td key={h.key} className="py-3 px-2">
                      <input
                        type="time"
                        value={jadwal[h.key]?.masuk ?? '07:00'}
                        disabled={jadwal[h.key]?.libur}
                        onChange={e => updateJadwalField(h.key, 'masuk', e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center disabled:opacity-30 disabled:bg-gray-50 focus:outline-none focus:border-emerald-400"
                      />
                    </td>
                  ))}
                </tr>
                {/* Row Jam Pulang */}
                <tr>
                  <td className="py-3 pr-4 text-xs font-semibold text-gray-500">Jam Pulang</td>
                  {HARI.map(h => (
                    <td key={h.key} className="py-3 px-2">
                      <input
                        type="time"
                        value={jadwal[h.key]?.pulang ?? '13:30'}
                        disabled={jadwal[h.key]?.libur}
                        onChange={e => updateJadwalField(h.key, 'pulang', e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center disabled:opacity-30 disabled:bg-gray-50 focus:outline-none focus:border-emerald-400"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"><Info size={12} /> Hari yang dicentang Libur tidak bisa diabsen oleh guru.</p>
        </div>
      </div>

    </>
  )
}
