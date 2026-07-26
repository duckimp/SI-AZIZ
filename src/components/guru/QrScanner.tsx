'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'

interface Props {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isStoppedRef = useRef(false)
  const [isStarting, setIsStarting] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const divId = 'qr-reader-main'

  const stopScanner = useCallback(async () => {
    if (isStoppedRef.current) return
    if (!scannerRef.current) return
    try {
      const state = scannerRef.current.getState()
      // State 2 = SCANNING, State 3 = PAUSED
      if (state === 2 || state === 3) {
        isStoppedRef.current = true
        await scannerRef.current.stop()
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    isStoppedRef.current = false

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(divId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (!isMounted || isStoppedRef.current) return
            await stopScanner()
            onScan(decodedText)
          },
          undefined
        )
        if (isMounted) setIsStarting(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (isMounted) {
          setCameraError(err.message ?? 'Tidak dapat mengakses kamera.')
          setIsStarting(false)
        }
      }
    }

    startScanner()

    return () => {
      isMounted = false
      stopScanner()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-600/20 flex items-center justify-center border border-gold-500/30">
            <Camera size={20} className="text-gold-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Scanner Absensi</h3>
            <p className="text-white/60 text-xs">Arahkan kamera ke QR Code</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isStarting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
              <p className="text-white/70 font-medium">Menyiapkan kamera...</p>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black p-8 text-center">
            <div className="max-w-xs">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <X size={32} className="text-red-400" />
              </div>
              <p className="text-red-300 font-medium mb-2">{cameraError}</p>
              <p className="text-white/40 text-sm mb-6">Pastikan izin kamera sudah diberikan di pengaturan browser Anda.</p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        )}

        <div id={divId} className="w-full h-full [&>video]:object-cover" />

        {/* Scanning Frame Overlay */}
        {!cameraError && !isStarting && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Corner Borders */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold-500 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold-500 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold-500 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold-500 rounded-br-2xl" />
              
              {/* Scanning Line Animation */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-scan shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
            </div>
            <p className="mt-8 text-white/80 text-sm font-medium px-6 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              Posisikan QR Code di dalam kotak
            </p>
          </div>
        )}
      </div>

      {/* Footer Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-center">
        <p className="text-white/40 text-xs">
          Si-Aziz MI Nur Aziz • Sistem Absensi Digital
        </p>
      </div>
    </div>
  )
}
