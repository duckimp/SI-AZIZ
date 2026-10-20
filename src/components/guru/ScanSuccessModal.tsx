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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-5">
      <div className="w-full max-w-sm animate-bounce-in">
        <div className="bg-white rounded-3xl p-6 text-center shadow-2xl border border-gray-100">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            scanType === 'masuk' ? 'bg-emerald-50 ring-8 ring-emerald-50/60' : 'bg-blue-50 ring-8 ring-blue-50/60'
          }`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md ${
              scanType === 'masuk' ? 'bg-emerald-600 text-white shadow-emerald-600/25' : 'bg-blue-600 text-white shadow-blue-600/25'
            }`}>
              {scanType === 'masuk' ? (
                <CheckCircle2 size={32} className="text-white" />
              ) : (
                <ArrowRightFromLine size={32} className="text-white" />
              )}
            </div>
          </div>

          {/* Content */}
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${
            scanType === 'masuk' ? 'text-emerald-700' : 'text-blue-700'
          }`}>
            {scanType === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}
          </p>
          <h2 className="text-gray-900 font-black text-2xl mb-1">Berhasil!</h2>
          <p className="text-gray-600 text-sm mb-5 leading-relaxed">{message}</p>

          {/* Time */}
          <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 mb-5 border border-gray-200/80">
            <Clock size={16} className="text-gray-500" />
            <span className="text-gray-800 font-bold tabular-nums">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Tombol Tutup Solid & Kontras */}
          <button
            onClick={onClose}
            className={`w-full py-3.5 px-4 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] ${
              scanType === 'masuk'
                ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/25'
                : 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/25'
            }`}
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
