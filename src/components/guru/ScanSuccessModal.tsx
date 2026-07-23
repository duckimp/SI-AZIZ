'use client'

import { useEffect } from 'react'
import { CheckCircle2, ArrowRightFromLine, Clock } from 'lucide-react'

interface Props {
  message: string
  scanType: 'masuk' | 'pulang'
  onClose: () => void
}

export default function ScanSuccessModal({ message, scanType, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in px-5">
      <div className="w-full max-w-sm animate-bounce-in">
        <div className={`rounded-3xl p-6 text-center shadow-2xl ${
          scanType === 'masuk'
            ? 'bg-gradient-to-b from-emerald-700 to-emerald-900 border border-emerald-500/40'
            : 'bg-gradient-to-b from-blue-700 to-blue-900 border border-blue-500/40'
        }`}>
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            scanType === 'masuk' ? 'bg-emerald-500/30' : 'bg-blue-500/30'
          }`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              scanType === 'masuk' ? 'bg-emerald-400' : 'bg-blue-400'
            }`}>
              {scanType === 'masuk' ? (
                <CheckCircle2 size={32} className="text-white" />
              ) : (
                <ArrowRightFromLine size={32} className="text-white" />
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
            {scanType === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}
          </p>
          <h2 className="text-white font-black text-2xl mb-1">Berhasil!</h2>
          <p className="text-white/90 text-sm mb-5 leading-relaxed">{message}</p>

          {/* Time */}
          <div className="flex items-center justify-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 mb-5 border border-white/10">
            <Clock size={16} className="text-white/80" />
            <span className="text-white font-bold tabular-nums">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Tombol Tutup Solid & Kontras */}
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 bg-gold-600 hover:bg-gold-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-gold-600/30 active:scale-[0.98]"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  )
}