'use client'

import Link from 'next/link'
import { useTour } from '@/lib/tourStore'

export default function HomePage() {
  const { tour, resetAll } = useTour()
  const hasActiveTour = tour && tour.status !== 'completed'

  return (
    <div className="flex flex-col min-h-screen py-8 gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center pt-12 pb-4 gap-4">
        <div className="text-7xl animate-pulse-slow">🛣️</div>
        <h1 className="text-6xl font-black tracking-tight gradient-text">
          Omweg
        </h1>
        <p className="text-white/60 text-lg font-medium">
          Laat AI bepalen waar je uitkomt.
        </p>
      </div>

      {/* Active tour banner */}
      {hasActiveTour && (
        <div className="glass-card p-4 flex items-center justify-between gap-3 animate-fade-in">
          <div>
            <p className="text-sm font-bold text-amber-400">Tour actief!</p>
            <p className="text-xs text-white/50">
              {tour.quests.length} opdracht{tour.quests.length !== 1 ? 'en' : ''} •{' '}
              {tour.totalScore} punten
            </p>
          </div>
          <Link href="/tour" className="btn-primary text-sm px-5 py-3">
            Doorgaan →
          </Link>
        </div>
      )}

      {/* Main actions */}
      <div className="flex flex-col gap-3 mt-2">
        <Link
          href="/setup"
          onClick={() => hasActiveTour && resetAll()}
          className="btn-primary text-center text-xl py-5"
        >
          🚗 Start een tour
        </Link>

        <button className="btn-glass text-center py-4 opacity-60 cursor-not-allowed" disabled>
          👥 Speel met vrienden
          <span className="block text-xs text-white/30 mt-0.5">Binnenkort beschikbaar</span>
        </button>

        <button className="btn-glass text-center py-4 opacity-60 cursor-not-allowed" disabled>
          📖 Bekijk vorige ritten
          <span className="block text-xs text-white/30 mt-0.5">Binnenkort beschikbaar</span>
        </button>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {['AI-opdrachten', 'Zes modi', 'Timer-quests', 'Punten', 'Gratis'].map(f => (
          <span key={f} className="glass px-3 py-1.5 text-xs text-white/60 rounded-full">
            {f}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center text-xs text-white/25">
        Alleen geschikt voor passagiers. De bestuurder rijdt altijd veilig.
      </div>
    </div>
  )
}
