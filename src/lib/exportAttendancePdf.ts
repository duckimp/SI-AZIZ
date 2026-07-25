import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Attendance } from '@/lib/types'
import { formatTime } from '@/lib/utils'

function getAttendanceStatusLabel(row: Attendance): string {
  if (row.status_kehadiran === 'Izin') return 'Izin'
  if (row.status_kehadiran === 'Sakit') return 'Sakit'
  if (row.status_kehadiran === 'Alpha') return 'Alpha'
  if (row.status_masuk === 'Terlambat') return 'Terlambat'
  if (row.waktu_masuk) return 'Tepat Waktu'
  return '-'
}

export function getReportPeriodLabel(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  const formatMonthYear = (date: Date) => ({
    month: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date).toUpperCase(),
    year: date.getFullYear(),
  })

  const startLabel = formatMonthYear(start)
  const endLabel = formatMonthYear(end)

  if (startLabel.month === endLabel.month && startLabel.year === endLabel.year) {
    return `BULAN ${startLabel.month} ${startLabel.year}`
  }

  if (startLabel.year === endLabel.year) {
    return `BULAN ${startLabel.month} - ${endLabel.month} ${startLabel.year}`
  }

  return `BULAN ${startLabel.month} ${startLabel.year} - ${endLabel.month} ${endLabel.year}`
}

export function exportAttendancePdf(
  data: Attendance[],
  startDate: string,
  endDate: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const periodLabel = getReportPeriodLabel(startDate, endDate)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('REKAP ABSENSI GURU MI NUR AZIZ', pageWidth / 2, 15, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(periodLabel, pageWidth / 2, 22, { align: 'center' })

  const body = data.map(row => [
    row.tanggal,
    row.profiles?.nama ?? '-',
    row.waktu_masuk ? formatTime(row.waktu_masuk) : '-',
    row.waktu_pulang ? formatTime(row.waktu_pulang) : '-',
    getAttendanceStatusLabel(row),
    row.keterangan ?? '-',
  ])

  autoTable(doc, {
    startY: 28,
    head: [['Tanggal', 'Nama Guru', 'Masuk', 'Pulang', 'Status', 'Keterangan']],
    body,
    styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 45 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 10, right: 10 },
  })

  doc.save(`Rekap_Absensi_${startDate}_${endDate}.pdf`)
}
