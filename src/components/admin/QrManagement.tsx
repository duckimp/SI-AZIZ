'use client'

import { useState } from 'react'
import { SchoolSettings } from '@/lib/types'
import { resetQrToken, updateJamSettings } from '@/app/actions/admin'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, Printer, ShieldCheck, AlertTriangle, Loader2, Copy, Check, Clock } from 'lucide-react'

interface Props {
  settings: SchoolSettings | null
}

export default function QrManagement({ settings: initialSettings }: Props) {
  const [settings, setSettings] = useState<SchoolSettings | null>(initialSettings)
  const [isResetting, setIsResetting] = useState(false)
  const [isSavingJam, setIsSavingJam] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [jamMasuk, setJamMasuk] = useState(initialSettings?.jam_masuk?.slice(0, 5) ?? '07:00')
  const [jamPulang, setJamPulang] = useState(initialSettings?.jam_pulang?.slice(0, 5) ?? '14:00')


  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleSaveJam() {
    setIsSavingJam(true)
    const result = await updateJamSettings(jamMasuk + ':00', jamPulang + ':00')
    if (result.success && settings) {
      setSettings({ ...settings, jam_masuk: jamMasuk + ':00', jam_pulang: jamPulang + ':00' })
      showMessage('success', 'Jam masuk & pulang berhasil diperbarui!')
    } else {
      showMessage('error', result.error ?? 'Gagal menyimpan pengaturan jam.')
    }
    setIsSavingJam(false)
  }

  async function handleResetToken() {
    if (!confirm('Yakin ingin reset token QR? QR Code lama akan TIDAK VALID. Anda perlu mencetak dan menempel QR baru.')) return
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

  function handleCopyToken() {
    if (settings) {
      navigator.clipboard.writeText(settings.qr_secret_token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (!settings) {
    return (
      <div className="text-center py-16 text-gray-400">
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
        <p>Pengaturan sekolah belum dikonfigurasi. Jalankan SQL schema terlebih dahulu.</p>
      </div>
    )
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #qr-print-area { display: block !important; }
          #qr-print-area { position: fixed; top: 0; left: 0; width: 100%; height: 100%; }
        }
      `}</style>

      <div className="space-y-6 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Kelola QR Code Absensi</h2>
          <p className="text-gray-500 text-sm mt-1">Generate dan cetak QR Code yang ditempel di kantor sekolah</p>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? '✓' : '⚠️'} {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Preview Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="font-bold text-gray-900 mb-4">Preview QR Code</h3>
            <div className="bg-emerald-950 p-6 rounded-2xl shadow-inner mb-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={settings.qr_secret_token}
                  size={220}
                  level="H"
                  includeMargin={false}
                  fgColor="#064E3B"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">Scan QR ini untuk absen masuk & pulang</p>
            <div className="flex gap-3 w-full">
              <Button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl"
              >
                <Printer size={16} />
                Cetak QR
              </Button>
              <Button
                onClick={handleResetToken}
                disabled={isResetting}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
              >
                {isResetting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Reset Token
              </Button>
            </div>
          </div>

          {/* Token Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="font-bold text-gray-900">Informasi Token</h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Token Aktif</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-gray-800 break-all flex-1">{settings.qr_secret_token}</p>
                <button
                  onClick={handleCopyToken}
                  className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nama Sekolah', value: settings.nama_sekolah },
                { label: 'Radius Max GPS', value: `${settings.max_radius_meters} meter` },
                { label: 'Jam Masuk', value: settings.jam_masuk?.slice(0, 5) },
                { label: 'Jam Pulang', value: settings.jam_pulang?.slice(0, 5) },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Jaga kerahasiaan token ini. Jika QR Code bocor atau hilang, segera klik <strong>Reset Token</strong> dan cetak QR baru.
              </p>
            </div>
          </div>
        </div>

        {/* Jam Settings Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-emerald-600" />
            <h3 className="font-bold text-gray-900">Atur Jam Masuk & Pulang</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="jam-masuk" className="text-sm font-semibold text-gray-700">Jam Masuk</Label>
              <Input
                id="jam-masuk"
                type="time"
                value={jamMasuk}
                onChange={e => setJamMasuk(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
              <p className="text-xs text-gray-400">Guru terlambat jika scan setelah jam ini</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jam-pulang" className="text-sm font-semibold text-gray-700">Jam Pulang</Label>
              <Input
                id="jam-pulang"
                type="time"
                value={jamPulang}
                onChange={e => setJamPulang(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
              <p className="text-xs text-gray-400">Referensi jam pulang guru</p>
            </div>
          </div>
          <Button
            onClick={handleSaveJam}
            disabled={isSavingJam}
            className="w-full flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl h-11"
          >
            {isSavingJam ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
            {isSavingJam ? 'Menyimpan...' : 'Simpan Pengaturan Jam'}
          </Button>
        </div>
      </div>

      {/* Print Area (A4 Layout) */}
      <div id="qr-print-area" className="hidden print:block">
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
          {/* Border Frame */}
          <div style={{
            border: '8px solid #064E3B',
            borderRadius: 24,
            padding: 40,
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 0 0 4px #D97706',
          }}>
            {/* Header */}
            <div className="text-center mb-8">
              <div style={{
                background: 'linear-gradient(135deg, #022c22, #064e3b)',
                borderRadius: 16,
                padding: '16px 24px',
                marginBottom: 16
              }}>
                <p style={{ color: '#D97706', fontWeight: 900, fontSize: 28, margin: 0, letterSpacing: 2 }}>
                  MI NUR AZIZ
                </p>
                <p style={{ color: '#a7f3d0', fontSize: 12, margin: '4px 0 0', letterSpacing: 1 }}>
                  ABSENSI DIGITAL SI-AZIZ
                </p>
              </div>
              <p style={{ color: '#064E3B', fontSize: 14, fontWeight: 700, margin: 0 }}>
                Scan QR Code untuk Absensi
              </p>
              <p style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
                Pastikan GPS aktif & dalam radius {settings?.max_radius_meters ?? 50}m
              </p>
            </div>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{
                background: '#064E3B',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 8px 32px rgba(6,78,59,0.3)'
              }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
                  <QRCodeSVG
                    value={settings?.qr_secret_token ?? ''}
                    size={240}
                    level="H"
                    includeMargin={false}
                    fgColor="#064E3B"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              background: '#f0fdf4',
              borderRadius: 12,
              padding: '12px 20px',
              border: '1px solid #bbf7d0',
              textAlign: 'center'
            }}>
              <p style={{ color: '#064E3B', fontSize: 13, fontWeight: 700, margin: 0 }}>
                Jam Masuk: {settings?.jam_masuk?.slice(0, 5) ?? '07:00'} WIB
              </p>
              <p style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
                Terlambat jika scan setelah jam {settings?.jam_masuk?.slice(0, 5) ?? '07:00'} WIB
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
