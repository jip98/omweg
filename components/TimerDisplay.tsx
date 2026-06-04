'use client'

import { useEffect, useState, useRef } from 'react'

interface TimerDisplayProps {
  totalSeconds: number
  onComplete?: () => void
  running: boolean
  autoPaused?: boolean  // stilstand via GPS
}

export default function TimerDisplay({ totalSeconds, onComplete, running, autoPaused }: TimerDisplayProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const onCompleteRef = useRef(onComplete)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { setRemaining(totalSeconds) }, [totalSeconds])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!running) return

    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onCompleteRef.current?.()
          return 0
        }
        return r - 1
      })
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running]) // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0

  // Fix: absolute grens van 20s voor rood — geen percentage-overlap meer
  const isUrgent = remaining <= 20 && remaining > 0
  const isHalf   = remaining > totalSeconds * 0.5

  const colorClass = isUrgent ? 'text-rose-500'
    : isHalf ? 'text-emerald-400'
    : 'text-amber-400'

  const barColor = isUrgent ? 'bg-rose-500'
    : isHalf ? 'bg-emerald-400'
    : 'bg-amber-400'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Tijdweergave */}
      <div className="relative">
        <div
          key={`${isUrgent}`}   // herstart animatie precies bij de grens
          className={`text-5xl font-bold tabular-nums transition-colors duration-200 ${colorClass} ${isUrgent ? 'animate-pulse' : ''}`}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Voortgangsbalk */}
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 transition-colors duration-200 ${barColor}`}
          style={{ width: `${Math.max(0, 100 - pct)}%` }}
        />
      </div>

      {/* Status labels */}
      {remaining === 0 && (
        <p className="text-rose-400 font-bold text-sm animate-bounce-soft">⏰ Tijd is om!</p>
      )}
      {autoPaused && remaining > 0 && (
        <p className="text-white/40 text-xs">⏸ Gepauzeerd — rijd verder om door te gaan</p>
      )}
    </div>
  )
}
