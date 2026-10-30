'use client'

import { memo, useEffect, useState, useRef } from 'react'

interface Props {
  onDayChange?: () => void
}

function DigitalClockComponent({ onDayChange }: Props) {
  const [time, setTime] = useState('')
  const [dateStr, setDateStr] = useState('')
  const currentDateRef = useRef('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )

      const formattedDate = now.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      setDateStr(formattedDate)

      // Cek pergantian hari (tengah malam waktu Jakarta)
      const currentJakartaDate = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Jakarta',
      }).format(now)

      if (currentDateRef.current && currentDateRef.current !== currentJakartaDate) {
        onDayChange?.()
      }
      currentDateRef.current = currentJakartaDate
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [onDayChange])

  return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-200/80">
      <p className="text-5xl sm:text-6xl font-black text-gray-900 tabular-nums tracking-tight font-mono">
        {time || '--:--:--'}
      </p>
      <p className="text-emerald-800 text-sm font-bold mt-2 capitalize flex items-center justify-center gap-1.5">
        <span>📅</span>
        {dateStr || '...'}
      </p>
    </div>
  )
}

export const DigitalClock = memo(DigitalClockComponent)
export default DigitalClock
