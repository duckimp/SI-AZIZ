'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result?.redirectTo) {
        // Menggunakan window.location.href agar sesi auth termuat penuh dan tombol tetap loading sampai halaman tujuan terbuka
        window.location.href = result.redirectTo
      } else {
        setIsLoading(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk. Silakan coba lagi.'
      setError(msg)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-emerald-900 mb-1">Selamat Datang</h2>
        <p className="text-sm text-gray-500">Masuk dengan akun yang diberikan oleh Admin.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-emerald-900 font-semibold text-sm">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="contoh@gmail.com"
          required
          disabled={isLoading}
          className="h-12 border-emerald-200 focus:border-emerald-600 focus:ring-emerald-600/20 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-emerald-900 font-semibold text-sm">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            disabled={isLoading}
            className="h-12 border-emerald-200 focus:border-emerald-600 focus:ring-emerald-600/20 rounded-xl pr-12 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-700 transition-colors disabled:opacity-50"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 btn-emerald text-base rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Memproses Masuk...</span>
          </>
        ) : (
          <>
            <LogIn size={20} />
            <span>Masuk</span>
          </>
        )}
      </Button>
    </form>
  )
}
