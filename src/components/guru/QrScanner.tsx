'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'

interface Props {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isStarting, setIsStarting] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const divId = 'qr-reader-main'

  useEffect(() => {
    let isMounted = true

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(divId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (!isMounted) return
            await scanner.stop()
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
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [onScan])

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-gold-400" />
          <span className="text-white font-semibold text-sm">Arahkan ke QR Code</span>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      {/* Scanner Viewport */}
      <div className="relative">
        {isStarting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-b-2xl" style={{ minHeight: 300 }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm">Membuka kamera...</p>
            </div>
          </div>
        )}
        {cameraError && (
          <div className="p-6 text-center">
            <p className="text-red-300 text-sm">{cameraError}</p>
            <p className="text-white/50 text-xs mt-2">Pastikan izin kamera sudah diberikan.</p>
          </div>
        )}
        <div id={divId} className="w-full" style={{ minHeight: cameraError ? 0 : 300 }} />
      </div>

      {/* Hint */}
      {!cameraError && (
        <p className="text-center text-white/50 text-xs py-3 px-4">
          Pastikan QR Code terlihat jelas di dalam kotak
        </p>
      )}
    </div>
  )
}
