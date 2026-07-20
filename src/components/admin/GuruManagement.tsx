'use client'

import { useState } from 'react'
import { Profile } from '@/lib/types'
import { createGuru, updateGuru, deleteGuru, inputManualAttendance } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, Pencil, Trash2, CalendarPlus, Users, Loader2 } from 'lucide-react'
import { getTodayDate } from '@/lib/utils'

interface Props {
  guruList: Profile[]
}

export default function GuruManagement({ guruList: initialList }: Props) {
  const guruList = initialList
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGuru, setSelectedGuru] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Add Guru
  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await createGuru({
      nama: fd.get('nama') as string,
      nip: fd.get('nip') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
    })
    setIsLoading(false)
    if (result.success) {
      showMessage('success', 'Guru berhasil ditambahkan!')
      setAddDialogOpen(false)
    } else {
      showMessage('error', result.error ?? 'Terjadi kesalahan')
    }
  }

  // Edit Guru
  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedGuru) return
    setIsLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await updateGuru(selectedGuru.id, {
      nama: fd.get('nama') as string,
      nip: fd.get('nip') as string,
    })
    setIsLoading(false)
    if (result.success) {
      showMessage('success', 'Data guru berhasil diperbarui!')
      setEditDialogOpen(false)
    } else {
      showMessage('error', result.error ?? 'Terjadi kesalahan')
    }
  }

  // Delete Guru
  async function handleDelete() {
    if (!selectedGuru) return
    setIsLoading(true)
    const result = await deleteGuru(selectedGuru.id)
    setIsLoading(false)
    if (result.success) {
      showMessage('success', 'Guru berhasil dihapus.')
      setDeleteDialogOpen(false)
    } else {
      showMessage('error', result.error ?? 'Terjadi kesalahan')
    }
  }

  // Manual Attendance
  async function handleManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedGuru) return
    setIsLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await inputManualAttendance({
      userId: selectedGuru.id,
      tanggal: fd.get('tanggal') as string,
      statusKehadiran: fd.get('status') as 'Izin' | 'Sakit' | 'Alpha',
      keterangan: fd.get('keterangan') as string,
    })
    setIsLoading(false)
    if (result.success) {
      showMessage('success', 'Keterangan berhasil disimpan!')
      setManualDialogOpen(false)
    } else {
      showMessage('error', result.error ?? 'Terjadi kesalahan')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Manajemen Guru</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola data dan akun guru MI Nur Aziz</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="btn-emerald flex items-center gap-2"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Tambah Guru</span>
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? '✓' : '⚠️'} {message.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users size={18} className="text-emerald-600" />
          <h3 className="font-bold text-gray-900">Daftar Guru ({guruList.length} orang)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-semibold">No</th>
                <th className="text-left px-6 py-3 font-semibold">Nama Guru</th>
                <th className="text-left px-6 py-3 font-semibold">NIP / NIK</th>
                <th className="text-left px-6 py-3 font-semibold">Role</th>
                <th className="text-right px-6 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {guruList.map((guru, i) => (
                <tr key={guru.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 text-gray-400 text-sm">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-emerald-700 font-bold text-sm">{guru.nama.charAt(0)}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{guru.nama}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm font-mono">{guru.nip ?? '—'}</td>
                  <td className="px-6 py-4">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Guru</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedGuru(guru); setManualDialogOpen(true) }}
                        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                        title="Input Manual"
                      >
                        <CalendarPlus size={15} />
                      </button>
                      <button
                        onClick={() => { setSelectedGuru(guru); setEditDialogOpen(true) }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => { setSelectedGuru(guru); setDeleteDialogOpen(true) }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guruList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada data guru. Klik &quot;Tambah Guru&quot; untuk memulai.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guru Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">Tambah Guru Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <Label>Nama Lengkap</Label>
              <Input name="nama" placeholder="Ahmad Guru, S.Pd" required />
            </div>
            <div className="space-y-1">
              <Label>NIP / NIK</Label>
              <Input name="nip" placeholder="197001012000011001" />
            </div>
            <div className="space-y-1">
              <Label>Email (untuk login)</Label>
              <Input name="email" type="email" placeholder="guru@minuraziz.sch.id" required />
            </div>
            <div className="space-y-1">
              <Label>Password Default</Label>
              <Input name="password" type="password" placeholder="Minimal 6 karakter" minLength={6} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="btn-emerald" disabled={isLoading}>
                {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Guru Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">Edit Data Guru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nama Lengkap</Label>
              <Input name="nama" defaultValue={selectedGuru?.nama} required />
            </div>
            <div className="space-y-1">
              <Label>NIP / NIK</Label>
              <Input name="nip" defaultValue={selectedGuru?.nip ?? ''} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="btn-emerald" disabled={isLoading}>
                {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Perbarui
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Attendance Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">Input Manual Kehadiran</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManual} className="space-y-4">
            <p className="text-sm text-gray-600">Guru: <strong>{selectedGuru?.nama}</strong></p>
            <div className="space-y-1">
              <Label>Tanggal</Label>
              <Input name="tanggal" type="date" defaultValue={getTodayDate()} required />
            </div>
            <div className="space-y-1">
              <Label>Status Kehadiran</Label>
              <Select name="status" defaultValue="Izin">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Izin">Izin</SelectItem>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                  <SelectItem value="Alpha">Alpha (Tanpa Keterangan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Keterangan</Label>
              <Textarea name="keterangan" placeholder="Izin keperluan keluarga..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManualDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="btn-emerald" disabled={isLoading}>
                {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-700">Hapus Guru</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menghapus <strong>{selectedGuru?.nama}</strong>?
            Semua data absensi guru ini akan ikut terhapus.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
