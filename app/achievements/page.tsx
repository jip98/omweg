'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getHistory } from '@/lib/tourStore'
import { ALL_ACHIEVEMENTS, computeLifetimeStats, LifetimeStats } from '@/lib/achievements'

export default function AchievementsPage() {
  const [stats, setStats] = useState<LifetimeStats | null>(null)

  useEffect(() => {
    setStats(computeLifetimeStats(getHistory()))
  }, [])

  const unlockedCount = stats
    ? ALL_ACHIEVEMENTS.filter(a => a.check(stats)).length
    : 0

  return (
    <div className="flex flex-col gap-5 py-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="glass w-10 h-10 flex items-center justify-center rounded-2xl text-lg">←</Link>
        <h1 className="text-2xl font-black text-white">Mijn badges</h1>
      </div>

      {stats === null ? (
        <div className="text-center py-12 text-5xl animate-spin">🌀</div>
      ) : (
        <>
          {/* Voortgang */}
          <div className="glass-card p-6 text-center">
            <p className="label-chip mb-2">Verzameld</p>
            <p className="text-5xl font-black gradient-text">
              {unlockedCount}<span className="text-2xl text-white/40">/{ALL_ACHIEVEMENTS.length}</span>
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all"
                style={{ width: `${(unlockedCount / ALL_ACHIEVEMENTS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Lifetime mini-stats */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Ritten" value={stats.tours} />
            <MiniStat label="Opdrachten" value={stats.completedQuests} />
            <MiniStat label="Km" value={stats.totalKm} />
          </div>

          {/* Badge-rooster */}
          <div className="grid grid-cols-2 gap-3">
            {ALL_ACHIEVEMENTS.map(a => {
              const earned = a.check(stats)
              return (
                <div
                  key={a.id}
                  className={`glass-card p-4 flex flex-col items-center text-center gap-1 transition-all ${
                    earned ? '' : 'opacity-40 grayscale'
                  }`}
                >
                  <span className="text-4xl">{earned ? a.icon : '🔒'}</span>
                  <p className="text-sm font-bold text-white mt-1">{a.title}</p>
                  <p className="text-[11px] text-white/40 leading-tight">{a.description}</p>
                </div>
              )
            })}
          </div>

          {stats.tours === 0 && (
            <Link href="/setup" className="btn-primary text-center py-4 mt-2">
              🚗 Rijd je eerste tour
            </Link>
          )}
        </>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card p-3 text-center">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
    </div>
  )
}
