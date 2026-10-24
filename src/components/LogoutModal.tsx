'use client'

import { useState } from 'react'
import { logout } from '@/app/actions/auth'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleLogout = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await logout()
    } catch {
      // In Next.js Server Actions, redirect throws an error internally.
      // We keep isLoading true as the page navigates to /login.
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!isLoading) onClose()
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-red-50 ring-8 ring-red-50/60 flex items-center justify-center text-red-600 mx-auto mb-4 shadow-sm">
          <LogOut size={28} className="text-red-600" />
        </div>

        {/* Text */}
        <h3 className="text-xl font-black text-gray-900 mb-1.5">
          Konfirmasi Keluar
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Apakah Anda yakin ingin keluar dari aplikasi <span className="font-semibold text-gray-800">SI-AZIZ</span>? Anda perlu login kembali untuk mengakses akun.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Keluar...</span>
              </>
            ) : (
              <span>Ya, Keluar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
