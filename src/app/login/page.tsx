import Image from 'next/image'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Login | Si-Aziz Absensi',
  description: 'Masuk ke Sistem Informasi Absensi Guru MI Nur Aziz',
}

export default async function LoginPage() {
  return (
    <main className="min-h-screen w-screen flex items-center justify-center gradient-header px-4 py-8 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gold-600/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          {/* Logo Sekolah */}
          <div className="relative w-24 h-24 mx-auto mb-3 drop-shadow-xl">
            <Image
              src="/icons/icon-512x512.png" // atau "/logo.webp" sesuai lokasi file di folder public/
              alt="Logo MI Nur Aziz"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">Si-Aziz</h1>
          <p className="text-emerald-200 mt-1 text-sm font-medium">Sistem Absensi Guru MI Nur Aziz</p>
        </div>

        {/* Login Card */}
        <div className="card-glass p-8 rounded-2xl border border-white/10">
          <LoginForm />
        </div>

        <p className="text-center text-emerald-300/60 text-xs mt-6">
          © {new Date().getFullYear()} MI Nur Aziz • Powered by Andi Mariono
        </p>
      </div>
    </main>
  )
}