'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (result?.redirectTo) {
      router.push(result.redirectTo)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
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
          placeholder="guru@minuraziz.sch.id"
          required
          className="h-12 border-emerald-200 focus:border-emerald-600 focus:ring-emerald-600/20 rounded-xl"
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
            className="h-12 border-emerald-200 focus:border-emerald-600 focus:ring-emerald-600/20 rounded-xl pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-700 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 btn-emerald text-base rounded-xl flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Masuk...
          </>
        ) : (
          <>
            <LogIn size={20} />
            Masuk
          </>
        )}
      </Button>
    </form>
  )
}
