'use client'

import Link from 'next/link'

import { logout } from '@/app/actions/auth'
import { Profile } from '@/lib/types'
import {
  LayoutDashboard, Users, BarChart3, QrCode,
  LogOut, Menu, X, ChevronRight, Database
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import NextImage from 'next/image'

interface Props {
  profile: Profile
  activeMenu: string
  children: React.ReactNode
}

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { key: 'guru', label: 'Manajemen Guru', href: '/admin/guru', icon: Users },
  { key: 'laporan', label: 'Laporan & Export', href: '/admin/laporan', icon: BarChart3 },
  { key: 'qr', label: 'Kelola QR Code', href: '/admin/qr', icon: QrCode },
  { key: 'backup', label: 'Backup & Restore', href: '/admin/backup', icon: Database },
]

export default function AdminLayout({ profile, activeMenu, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
        style={{ background: 'linear-gradient(180deg, #022c22 0%, #064e3b 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div className="relative w-10 h-10 shrink-0 drop-shadow">
            <NextImage
              src="/logo.png"
              alt="Logo MI Nur Aziz"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-white font-black text-base leading-tight">Si-Aziz</p>
            <p className="text-emerald-300 text-xs">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.key
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-gold-600 text-white shadow-lg shadow-gold-600/30'
                    : 'text-emerald-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={18} className="shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-4 py-3 rounded-xl bg-white/5 mb-2">
            <p className="text-white font-semibold text-sm truncate">{profile.nama}</p>
            <p className="text-emerald-400 text-xs">Administrator</p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-gray-900 font-bold text-lg">
                {menuItems.find(m => m.key === activeMenu)?.label ?? 'Dashboard'}
              </h1>
              <p className="text-gray-500 text-xs hidden sm:block">MI Nur Aziz • Sistem Informasi Absensi</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-bold text-xs">
                {profile.nama.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="hidden sm:block font-medium">{profile.nama}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
