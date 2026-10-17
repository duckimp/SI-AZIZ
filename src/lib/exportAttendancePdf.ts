import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Attendance, SchoolSettings } from '@/lib/types'
import { formatTime, getAttendanceTimeDetails } from '@/lib/utils'

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
  endDate: string,
  statusFilter: string = 'all',
  settings?: SchoolSettings | null
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const periodLabel = getReportPeriodLabel(startDate, endDate)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('REKAP ABSENSI GURU MI NUR AZIZ', pageWidth / 2, 15, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  
  // Add status filter to subtitle if not "all"
  let subtitle = periodLabel
  if (statusFilter !== 'all') {
    const statusLabels: Record<string, string> = {
      'Tepat Waktu': 'TEPAT WAKTU',
      'Terlambat': 'TERLAMBAT',
      'Izin': 'IZIN',
      'Sakit': 'SAKIT',
      'Alpha': 'ALPHA',
    }
    const statusLabel = statusLabels[statusFilter] || statusFilter
    subtitle = `${periodLabel} — ${statusLabel}`
  }
  
  doc.text(subtitle, pageWidth / 2, 22, { align: 'center' })

  const body = data.map(row => {
    const timeDetails = getAttendanceTimeDetails(row.tanggal, row.waktu_masuk, row.waktu_pulang, settings)
    return [
      row.tanggal,
      row.profiles?.nama ?? '-',
      row.waktu_masuk ? formatTime(row.waktu_masuk) : '-',
      timeDetails.detailMasuk,
      row.waktu_pulang ? formatTime(row.waktu_pulang) : '-',
      timeDetails.detailPulang,
      getAttendanceStatusLabel(row),
      row.keterangan ?? '-',
    ]
  })

  autoTable(doc, {
    startY: 28,
    head: [['Tanggal', 'Nama Guru', 'Masuk', 'Detail Masuk', 'Pulang', 'Detail Pulang', 'Status', 'Keterangan']],
    body,
    styles: { fontSize: 8.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' }, // Tanggal
      1: { cellWidth: 44 },                   // Nama Guru
      2: { cellWidth: 16, halign: 'center' }, // Masuk
      3: { cellWidth: 34, halign: 'center' }, // Detail Masuk
      4: { cellWidth: 16, halign: 'center' }, // Pulang
      5: { cellWidth: 38, halign: 'center' }, // Detail Pulang
      6: { cellWidth: 26, halign: 'center' }, // Status
      7: { cellWidth: 'auto' },               // Keterangan
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 10, right: 10 },
    didParseCell: (dataCell) => {
      if (dataCell.section === 'body') {
        // Style Detail Masuk (kolom index 3)
        if (dataCell.column.index === 3) {
          const val = String(dataCell.cell.raw || '')
          if (val.includes('Terlambat')) {
            dataCell.cell.styles.textColor = [220, 38, 38]
            dataCell.cell.styles.fontStyle = 'bold'
          } else if (val.includes('lebih awal')) {
            dataCell.cell.styles.textColor = [5, 150, 105]
          }
        }

        // Style Detail Pulang (kolom index 5)
        if (dataCell.column.index === 5) {
          const val = String(dataCell.cell.raw || '')
          if (val.includes('lebih awal')) {
            dataCell.cell.styles.textColor = [217, 119, 6]
            dataCell.cell.styles.fontStyle = 'bold'
          } else if (val.includes('dari jadwal')) {
            dataCell.cell.styles.textColor = [5, 150, 105]
          }
        }

        // Style Status (kolom index 6)
        if (dataCell.column.index === 6) {
          const statusVal = String(dataCell.cell.raw || '')
          if (statusVal === 'Terlambat') {
            dataCell.cell.styles.textColor = [220, 38, 38]
            dataCell.cell.styles.fillColor = [254, 226, 226]
            dataCell.cell.styles.fontStyle = 'bold'
          } else if (statusVal === 'Izin') {
            dataCell.cell.styles.textColor = [126, 34, 206]
            dataCell.cell.styles.fillColor = [243, 232, 255]
            dataCell.cell.styles.fontStyle = 'bold'
          } else if (statusVal === 'Sakit') {
            dataCell.cell.styles.textColor = [29, 78, 216]
            dataCell.cell.styles.fillColor = [219, 234, 254]
            dataCell.cell.styles.fontStyle = 'bold'
          } else if (statusVal === 'Alpha') {
            dataCell.cell.styles.textColor = [185, 28, 28]
            dataCell.cell.styles.fillColor = [254, 202, 202]
            dataCell.cell.styles.fontStyle = 'bold'
          }
        }
      }
    },
  })

  doc.save(`Rekap_Absensi_${startDate}_${endDate}.pdf`)
}
