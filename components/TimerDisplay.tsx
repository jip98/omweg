'use client'

import { useEffect, useState, useRef } from 'react'

interface TimerDisplayProps {
  totalSeconds: number
  onComplete?: () => void
  running: boolean
}

export default function TimerDisplay({ totalSeconds, onComplete, running }: TimerDisplayProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const onCompleteRef = useRef(onComplete)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  // Fix: geen 'remaining' in deps — die veroorzaakte de reset-loop
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

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running]) // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0

  const colorClass =
    remaining > totalSeconds * 0.5 ? 'text-emerald-400' :
    remaining > totalSeconds * 0.2 ? 'text-amber-400' : 'text-rose-400 animate-pulse'

  const barColor =
    remaining > totalSeconds * 0.5 ? 'bg-emerald-400' :
    remaining > totalSeconds * 0.2 ? 'bg-amber-400' : 'bg-rose-400'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`text-5xl font-bold tabular-nums ${colorClass}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ${barColor}`}
          style={{ width: `${Math.max(0, 100 - pct)}%` }}
        />
      </div>
      {remaining === 0 && (
        <p className="text-amber-400 font-bold text-sm animate-bounce-soft">⏰ Tijd is om!</p>
      )}
    </div>
  )
}
