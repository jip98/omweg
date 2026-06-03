'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTour } from '@/lib/tourStore'
import { END_TITLES, MODE_ICONS, MODE_LABELS, QuestType } from '@/lib/types'
import Link from 'next/link'

const TYPE_ICONS: Record<QuestType, string> = {
  direction: '🧭', timer: '⏱️', spotting: '👀', stop: '📍', choice: '🎲', random: '⚡',
}

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}m ${s}s`
}

export default function SummaryPage() {
  const router = useRouter()
  const { tour, hydrated, resetAll } = useTour()
  const [endTitle, setEndTitle] = useState('')
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!tour) { router.push('/'); return }
    const idx = Math.floor(Math.random() * END_TITLES.length)
    setEndTitle(END_TITLES[idx])
    setTimeout(() => setRevealed(true), 300)
  }, [tour, hydrated, router])

  if (!hydrated) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-5xl animate-spin">🌀</div>
    </div>
  )
  if (!tour) return null

  const completed = tour.quests.filter(q => q.status === 'completed')
  const skipped = tour.quests.filter(q => q.status === 'skipped')
  const duration = tour.endedAt ? tour.endedAt - tour.startedAt : 0

  const funniest = completed.length > 0
    ? completed[Math.floor(Math.random() * completed.length)]
    : null

  function handleNewTour() {
    resetAll()
    router.push('/')
  }

  return (
    <div className={`flex flex-col gap-5 py-6 pb-12 transition-all duration-500 ${revealed ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="text-center flex flex-col gap-3 pt-4">
        <div className="text-7xl">🏁</div>
        <h1 className="text-3xl font-black text-white leading-tight">{endTitle}</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">{MODE_ICONS[tour.settings.mode]}</span>
          <span className="text-white/50">{MODE_LABELS[tour.settings.mode]}</span>
        </div>
      </div>

      {/* Score big */}
      <div className="glass-card p-8 text-center">
        <p className="label-chip mb-2">Totaalscore</p>
        <p className="text-7xl font-black gradient-text">{tour.totalScore}</p>
        <p className="text-white/40 text-sm mt-1">punten</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="✅" label="Voltooid" value={String(completed.length)} />
        <StatCard icon="⏭️" label="Overgeslagen" value={String(skipped.length)} />
        <StatCard icon="📋" label="Totaal opdrachten" value={String(tour.quests.length)} />
        <StatCard icon="⏱️" label="Speeltijd" value={duration > 0 ? formatDuration(duration) : `${tour.settings.duration}m`} />
      </div>

      {/* Funniest quest */}
      {funniest && (
        <div className="glass-card p-5">
          <p className="label-chip mb-2">Grappigste opdracht</p>
          <p className="text-white font-bold text-lg">{funniest.title}</p>
          <p className="text-white/60 text-sm mt-1">{funniest.instruction}</p>
        </div>
      )}

      {/* Quest list */}
      {tour.quests.length > 0 && (
        <div className="glass-card p-5">
          <p className="label-chip mb-3">Alle opdrachten</p>
          <div className="flex flex-col gap-2">
            {tour.quests.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{TYPE_ICONS[q.type]}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    q.status === 'completed' ? 'text-emerald-400' :
                    q.status === 'skipped' ? 'text-white/30' : 'text-white'
                  }`}>
                    {q.title}
                  </p>
                </div>
                <span className="text-base">
                  {q.status === 'completed' ? '✅' : q.status === 'skipped' ? '⏭️' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <button onClick={handleNewTour} className="btn-primary text-xl py-5">
        🚗 Nieuwe tour
      </button>

      <Link href="/" className="btn-glass text-center py-4 text-white/60">
        ← Terug naar home
      </Link>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
  )
}
