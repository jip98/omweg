'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getHistory } from '@/lib/tourStore'
import { TourState, MODE_ICONS, MODE_LABELS } from '@/lib/types'
import { traceDistanceKm, computeAchievements } from '@/lib/achievements'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryPage() {
  const [history, setHistory] = useState<TourState[] | null>(null)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  return (
    <div className="flex flex-col gap-5 py-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="glass w-10 h-10 flex items-center justify-center rounded-2xl text-lg">←</Link>
        <h1 className="text-2xl font-black text-white">Vorige ritten</h1>
      </div>

      {history === null ? (
        <div className="text-center py-12 text-5xl animate-spin">🌀</div>
      ) : history.length === 0 ? (
        <div className="glass-card p-8 text-center flex flex-col gap-3">
          <div className="text-5xl">🗺️</div>
          <p className="text-white/60">Nog geen ritten gereden.</p>
          <Link href="/setup" className="btn-primary text-center py-3 mt-2">🚗 Start je eerste tour</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map(t => {
            const completed = t.quests.filter(q => q.status === 'completed').length
            const km = Math.round(traceDistanceKm(t.trace ?? []))
            const badges = computeAchievements(t)
            return (
              <div key={t.id} className="glass-card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{MODE_ICONS[t.settings.mode]}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{MODE_LABELS[t.settings.mode]}</p>
                      <p className="text-xs text-white/40">{formatDate(t.startedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black gradient-text">{t.totalScore}</p>
                    <p className="text-[10px] text-white/40">punten</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-white/50 border-t border-white/10 pt-2">
                  <span>✅ {completed}</span>
                  <span>🛣️ {km > 0 ? `${km} km` : '—'}</span>
                  <span>📋 {t.quests.length} opdrachten</span>
                  {t.places.length > 0 && <span className="truncate">📍 {t.places.slice(0, 2).join(', ')}</span>}
                </div>
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {badges.slice(0, 6).map(b => (
                      <span key={b.id} title={b.title} className="text-lg">{b.icon}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
