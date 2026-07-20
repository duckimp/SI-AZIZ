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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="mx-5 w-full max-w-sm animate-bounce-in">
        <div className={`rounded-3xl p-8 text-center shadow-2xl ${
          scanType === 'masuk'
            ? 'bg-gradient-to-b from-emerald-700 to-emerald-900 border border-emerald-500/40'
            : 'bg-gradient-to-b from-blue-700 to-blue-900 border border-blue-500/40'
        }`}>
          {/* Icon */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${
            scanType === 'masuk' ? 'bg-emerald-500/30' : 'bg-blue-500/30'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              scanType === 'masuk' ? 'bg-emerald-400' : 'bg-blue-400'
            }`}>
              {scanType === 'masuk' ? (
                <CheckCircle2 size={36} className="text-white" />
              ) : (
                <ArrowRightFromLine size={36} className="text-white" />
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-2">
            {scanType === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}
          </p>
          <h2 className="text-white font-black text-2xl mb-2">Berhasil!</h2>
          <p className="text-white/80 text-sm mb-6">{message}</p>

          {/* Time */}
          <div className="flex items-center justify-center gap-2 bg-white/10 rounded-xl px-4 py-3 mb-6">
            <Clock size={16} className="text-white/70" />
            <span className="text-white font-bold tabular-nums">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 text-sm hover:text-white transition-colors"
          >
            Tutup →
          </button>
        </div>
      </div>
    </div>
  )
}
