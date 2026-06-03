'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTour } from '@/lib/tourStore'
import {
  TourMode, Difficulty, RoadPreference, StopPreference, TourSettings,
  MODE_LABELS, MODE_ICONS, DIFFICULTY_LABELS, ROAD_LABELS, STOP_LABELS,
} from '@/lib/types'

import Link from 'next/link'

const DURATIONS = [15, 30, 60, 90, 120]
const MODES: TourMode[] = ['casual', 'date', 'kids', 'challenge', 'mystery', 'cabrio']
const DIFFICULTIES: Difficulty[] = ['rustig', 'normaal', 'chaotisch']
const ROADS: RoadPreference[] = ['alles', 'geen-snelweg', 'rustig', 'landelijk', 'stad']
const STOPS: StopPreference[] = ['geen', 'kort', 'koffie', 'mooi']

const MODE_DESCRIPTIONS: Record<TourMode, string> = {
  casual: 'Relaxte ritjes zonder stress',
  date: 'Romantisch en verrassend',
  kids: 'Leuk voor de kleintjes',
  challenge: 'Zo uitdagend mogelijk',
  mystery: 'Volledig in het onbekende',
  cabrio: 'Vol plezier, raak en snel',
}

export default function SetupPage() {
  const router = useRouter()
  const { startTour } = useTour()

  const [duration, setDuration] = useState<number>(30)
  const [mode, setMode] = useState<TourMode>('casual')
  const [difficulty, setDifficulty] = useState<Difficulty>('normaal')
  const [road, setRoad] = useState<RoadPreference>('alles')
  const [stops, setStops] = useState<StopPreference>('kort')

  function handleStart() {
    const settings: TourSettings = {
      mode, duration, difficulty,
      roadPreference: road, stopPreference: stops,
    }
    // Fix: settings direct meegeven — geen async state race meer
    startTour(settings)
    router.push('/tour')
  }

  return (
    <div className="flex flex-col gap-6 py-6 pb-12 no-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="glass w-10 h-10 flex items-center justify-center rounded-2xl text-lg">
          ←
        </Link>
        <h1 className="text-2xl font-black text-white">Tour instellen</h1>
      </div>

      {/* Speelduur */}
      <Section title="Speelduur" icon="⏰">
        <div className="flex gap-2 flex-wrap">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                duration === d
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-900/30'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </Section>

      {/* Modus */}
      <Section title="Modus" icon="🎭">
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`p-3 rounded-2xl text-left transition-all ${
                mode === m
                  ? 'bg-gradient-to-r from-orange-500/40 to-amber-400/30 border border-orange-400/40 text-white'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              <div className="text-xl mb-1">{MODE_ICONS[m]}</div>
              <div className="font-bold text-sm">{MODE_LABELS[m]}</div>
              <div className="text-xs text-white/40 mt-0.5 leading-tight">{MODE_DESCRIPTIONS[m]}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Moeilijkheid */}
      <Section title="Moeilijkheid" icon="🔥">
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${
                difficulty === d
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white'
                  : 'glass text-white/70'
              }`}
            >
              {d === 'rustig' ? '😌' : d === 'normaal' ? '😎' : '🤯'}<br />
              <span className="text-xs mt-0.5 block">{DIFFICULTY_LABELS[d]}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Wegtype */}
      <Section title="Wegtype" icon="🛣️">
        <div className="flex flex-col gap-2">
          {ROADS.map(r => (
            <button
              key={r}
              onClick={() => setRoad(r)}
              className={`px-4 py-3 rounded-2xl font-semibold text-sm text-left transition-all ${
                road === r
                  ? 'bg-gradient-to-r from-orange-500/40 to-amber-400/30 border border-orange-400/40 text-white'
                  : 'glass text-white/70'
              }`}
            >
              {ROAD_LABELS[r]}
            </button>
          ))}
        </div>
      </Section>

      {/* Stops */}
      <Section title="Stopmomenten" icon="📍">
        <div className="flex flex-col gap-2">
          {STOPS.map(s => (
            <button
              key={s}
              onClick={() => setStops(s)}
              className={`px-4 py-3 rounded-2xl font-semibold text-sm text-left transition-all ${
                stops === s
                  ? 'bg-gradient-to-r from-orange-500/40 to-amber-400/30 border border-orange-400/40 text-white'
                  : 'glass text-white/70'
              }`}
            >
              {STOP_LABELS[s]}
            </button>
          ))}
        </div>
      </Section>

      {/* Start button */}
      <button onClick={handleStart} className="btn-primary text-xl py-5 mt-2">
        🚗 Start de tour!
      </button>

      <p className="text-center text-xs text-white/25">
        De bestuurder bepaalt altijd zelf wat veilig is.
      </p>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}
