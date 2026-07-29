import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()

    if (!date) {
      return NextResponse.json({ success: false, error: 'Tanggal diperlukan' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get all active teachers
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, nama, nip')
      .eq('role', 'guru')
      .order('nama')

    if (profilesError) {
      return NextResponse.json({ success: false, error: profilesError.message }, { status: 500 })
    }

    const guruProfiles = profiles ?? []

    // Get existing attendances for the given date
    const { data: attendances, error: attendancesError } = await admin
      .from('attendances')
      .select('user_id')
      .eq('tanggal', date)

    if (attendancesError) {
      return NextResponse.json({ success: false, error: attendancesError.message }, { status: 500 })
    }

    const attendanceRows = attendances ?? []
    const attendanceByUser = new Set(attendanceRows.map((a) => a.user_id))

    // Find teachers who don't have attendance record for this date
    const guruBelumAbsen = guruProfiles.filter((guru) => !attendanceByUser.has(guru.id))

    if (guruBelumAbsen.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua guru sudah absen',
        count: 0,
      })
    }

    // Insert Alpha records for teachers who haven't attended
    const alphaRecords = guruBelumAbsen.map((guru) => ({
      user_id: guru.id,
      tanggal: date,
      status_kehadiran: 'Alpha',
      status_masuk: 'Alpha',
      keterangan: 'Alpha otomatis (belum absen)',
    }))

    const { error: insertError } = await admin
      .from('attendances')
      .upsert(alphaRecords, { onConflict: 'user_id,tanggal' })

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Alpha berhasil digenerate',
      count: alphaRecords.length,
      guru: guruBelumAbsen.map((g) => g.nama),
    })
  } catch (error) {
    console.error('Generate alpha error:', error)
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}