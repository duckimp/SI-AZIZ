'use client'

import { useState, useEffect } from 'react'

const splashStyles = `
  /* CONTAINER ANIMASI VECTOR */
  .animation-container {
    position: relative;
    width: 240px;
    height: 240px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle, rgba(5, 150, 105, 0.08) 0%, transparent 70%);
    border-radius: 50%;
  }

  .svg-canvas {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* BUBBLE CHAT ATAS HP */
  .speech-bubble {
    position: absolute;
    top: -12px;
    background: #064e3b;
    color: #ffffff;
    padding: 8px 14px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(6, 78, 59, 0.15);
    opacity: 0;
    transform: scale(0.8) translateY(10px);
    animation: popBubble 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.27) 1.2s forwards;
    z-index: 10;
  }

  /* Ekor Bubble Chat */
  .speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0;
    border-style: solid;
    border-color: #064e3b transparent;
    display: block;
    width: 0;
  }

  /* EFEK KETIK TEKS */
  .typing-text {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    border-right: 2px solid #34d399;
    width: 0;
    animation: 
      typing 1.5s steps(28, end) 1.4s forwards,
      blinkCursor 0.75s step-end infinite;
  }

  /* 1. Sinar Laser Scan Naik-Turun */
  .laser-line {
    animation: scanLaser 1.6s ease-in-out infinite alternate;
  }

  /* 2. Laser Glow Area */
  .laser-glow {
    animation: scanGlow 1.6s ease-in-out infinite alternate;
  }

  /* 3. Efek Frame QR Berkedip / Terdeteksi */
  .qr-frame {
    animation: pulseFrame 1.6s ease-in-out infinite alternate;
  }

  /* 4. Centang Sukses Pop-Up */
  .success-badge {
    transform-origin: center;
    opacity: 0;
    transform: scale(0);
    animation: popSuccess 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.27) 1.8s forwards;
  }

  /* BRANDING TEKS */
  .app-branding {
    margin-top: 10px;
    text-align: center;
    animation: fadeInText 0.8s ease-out forwards;
  }

  .app-title {
    font-size: 28px;
    font-weight: 800;
    color: #064e3b;
    letter-spacing: 0.5px;
  }

  .app-subtitle {
    font-size: 13px;
    color: #059669;
    margin-top: 4px;
    font-weight: 600;
  }

  /* FOOTER */
  .app-footer {
    text-align: center;
    animation: fadeInText 1s ease-out forwards;
  }

  .footer-tagline {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #94a3b8;
    margin-bottom: 2px;
    font-weight: 600;
  }

  .footer-institution {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 1px;
  }

  /* KEYFRAMES ANIMASI */
  @keyframes scanLaser {
    0% { transform: translateY(0px); }
    100% { transform: translateY(52px); }
  }

  @keyframes scanGlow {
    0% { transform: translateY(0px); opacity: 0.3; }
    100% { transform: translateY(52px); opacity: 0.7; }
  }

  @keyframes pulseFrame {
    0% { stroke: #10b981; }
    100% { stroke: #34d399; }
  }

  @keyframes popSuccess {
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes popBubble {
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes typing {
    to { width: 100%; }
  }

  @keyframes blinkCursor {
    from, to { border-color: transparent; }
    50% { border-color: #34d399; }
  }

  @keyframes fadeInText {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

export default function SplashScreen() {
  const [isHiding, setIsHiding] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    try {
      // Jika sudah pernah muncul di sesi ini, langsung lewati tanpa delay
      if (sessionStorage.getItem('siaziz_splash_shown')) {
        setIsVisible(false)
        return
      }
      sessionStorage.setItem('siaziz_splash_shown', 'true')
    } catch {
      // Abaikan jika browser memblokir storage
    }

    // Animasi tampil ringkas 1.4 detik (turun dari 3.4 detik)
    const hideTimer = setTimeout(() => {
      setIsHiding(true)
    }, 1400)

    // Unmount komponen setelah transisi fade out selesai (total 1.8s)
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
    }, 1800)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('siaziz_splash_shown', 'true')
    } catch {
      // ignore
    }
    setIsHiding(true)
    setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      id="splashScreen"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-white px-5 py-6 select-none transition-all duration-500 ease-out cursor-pointer ${
        isHiding ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
      }`}
      aria-label="Splash Screen SI-AZIZ"
      title="Ketuk layar untuk melewati animasi"
    >
      <style dangerouslySetInnerHTML={{ __html: splashStyles }} />

      {/* Indikator Tombol Lewati di Pojok Kanan Atas */}
      <div className="w-full flex justify-end pt-1 pr-1">
        <div className="flex items-center gap-1 px-3 py-1 bg-gray-100/90 text-gray-500 rounded-full text-[11px] font-semibold border border-gray-200/80 shadow-xs">
          <span>Lewati</span>
          <span className="text-[10px]">✕</span>
        </div>
      </div>

      {/* Bagian Tengah */}
      <div className="flex flex-col items-center justify-center flex-grow -mt-4">
        <div className="animation-container">
          {/* Bubble Chat Mengetik */}
          <div className="speech-bubble">
            <span className="typing-text">Absen dulu biar nggak ghoib!</span>
          </div>

          {/* Vector HP & Scanner QR Code */}
          <svg className="svg-canvas" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bayangan HP */}
            <ellipse cx="100" cy="178" rx="42" ry="6" fill="#cbd5e1" />

            {/* Badan HP */}
            <rect x="58" y="30" width="84" height="140" rx="16" fill="#1e293b" />
            {/* Layar HP */}
            <rect x="62" y="36" width="76" height="128" rx="11" fill="#f8fafc" />
            {/* Camera Notch / Speaker */}
            <rect x="88" y="41" width="24" height="4" rx="2" fill="#94a3b8" />

            {/* Konten Layar HP: Area Scanner QR Code */}
            <g transform="translate(0, 5)">
              {/* Background Frame QR Scanner */}
              <rect x="70" y="55" width="60" height="60" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />

              {/* Vector QR Code Minimalis */}
              <g fill="#0f172a">
                {/* Top Left Finder */}
                <rect x="75" y="60" width="14" height="14" rx="2" />
                <rect x="77" y="62" width="10" height="10" rx="1" fill="#ffffff" />
                <rect x="79" y="64" width="6" height="6" rx="0.5" />

                {/* Top Right Finder */}
                <rect x="111" y="60" width="14" height="14" rx="2" />
                <rect x="113" y="62" width="10" height="10" rx="1" fill="#ffffff" />
                <rect x="115" y="64" width="6" height="6" rx="0.5" />

                {/* Bottom Left Finder */}
                <rect x="75" y="96" width="14" height="14" rx="2" />
                <rect x="77" y="98" width="10" height="10" rx="1" fill="#ffffff" />
                <rect x="79" y="100" width="6" height="6" rx="0.5" />

                {/* Pattern QR Data Dots */}
                <rect x="92" y="60" width="4" height="4" rx="1" />
                <rect x="98" y="60" width="4" height="4" rx="1" />
                <rect x="92" y="68" width="4" height="4" rx="1" />
                <rect x="104" y="68" width="4" height="4" rx="1" />
                <rect x="75" y="78" width="4" height="4" rx="1" />
                <rect x="83" y="78" width="4" height="4" rx="1" />
                <rect x="95" y="78" width="8" height="4" rx="1" />
                <rect x="107" y="78" width="4" height="8" rx="1" />
                <rect x="88" y="86" width="4" height="4" rx="1" />
                <rect x="98" y="86" width="6" height="4" rx="1" />
                <rect x="115" y="88" width="4" height="4" rx="1" />
                <rect x="92" y="96" width="4" height="8" rx="1" />
                <rect x="100" y="100" width="8" height="4" rx="1" />
                <rect x="111" y="98" width="8" height="8" rx="1" />
              </g>

              {/* Siku Sudut Target Scanner */}
              <path className="qr-frame" d="M72 63 V57 H78 M122 57 H128 V63 M128 107 V113 H122 M78 113 H72 V107" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Sinar Laser Hijau Scanning */}
              <g>
                <rect className="laser-glow" x="72" y="58" width="56" height="8" fill="url(#laser-gradient)" opacity="0.5" />
                <line className="laser-line" x1="70" y1="58" x2="130" y2="58" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* Badge Centang Sukses (Pop Up) */}
              <g className="success-badge" transform="translate(100, 85)">
                <circle cx="0" cy="0" r="16" fill="#10b981" />
                <path d="M-6 0 L-2 4 L6 -4" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>

            {/* Gradient Definition Laser Glow */}
            <defs>
              <linearGradient id="laser-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Judul Aplikasi */}
        <div className="app-branding">
          <div className="app-title font-black">SI-AZIZ</div>
          <div className="app-subtitle">Presensi Guru & Pegawai Digital</div>
        </div>

        {/* Teks Petunjuk untuk Orang Awam */}
        <div className="mt-6 flex items-center gap-2 bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs animate-pulse">
          <span className="text-sm">👆</span>
          <span>Ketuk layar untuk lewati animasi</span>
        </div>
      </div>

      {/* Footer */}
      <div className="app-footer pb-2">
        <div className="footer-tagline">Absensi Digital SI-AZIZ</div>
        <div className="footer-institution">By Andi Mariono</div>
      </div>
    </div>
  )
}
