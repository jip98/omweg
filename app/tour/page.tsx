'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTour } from '@/lib/tourStore'
import QuestCard from '@/components/QuestCard'
import { Quest, MODE_ICONS, MODE_LABELS } from '@/lib/types'
import { useLocation } from '@/lib/useLocation'
import Link from 'next/link'

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? ''

export default function TourPage() {
  const router = useRouter()
  const { tour, hydrated, addQuest, resolveQuest, pauseTour, resumeTour, endTour } = useTour()
  const location = useLocation()

  const [currentQuest, setCurrentQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
  const loadedRef = useRef(false)

  const durationSeconds = (tour?.settings.duration ?? 30) * 60

  useEffect(() => {
    if (!hydrated) return
    if (!tour) { router.push('/'); return }
    if (tour.status === 'completed') { router.push('/summary'); return }
  }, [tour, hydrated, router])

  // Elapsed tour timer
  useEffect(() => {
    if (!tour || paused) return
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - tour.startedAt) / 1000)
      setElapsedSeconds(elapsed)
      if (elapsed >= durationSeconds) {
        clearInterval(id)
        endTour()
        router.push('/summary')
      }
    }, 1000)
    return () => clearInterval(id)
  }, [tour, paused, durationSeconds, endTour, router])

  const fetchQuest = useCallback(async () => {
    if (!tour) return
    setLoading(true)
    setTimerRunning(false)

    const previousTitles = tour.quests.map(q => q.title)
    const timeLeftMinutes = Math.max(1, Math.floor((durationSeconds - elapsedSeconds) / 60))
    // Max timer: 15min→120s (2min), 30min→240s (4min), 60min→480s (8min), 90min+→600s
    const maxTimerSecs = Math.min(Math.max(timeLeftMinutes * 8, 60), 600)

    const applyQuest = (data: {
      title?: string; instruction?: string; type?: string;
      durationSeconds?: number | null; completionCondition?: string
    }) => {
      let dur = data.durationSeconds ?? null
      if (dur && dur > maxTimerSecs) dur = maxTimerSecs

      const quest = addQuest({
        title: data.title ?? 'Nieuwe opdracht',
        instruction: data.instruction ?? '...',
        type: (data.type ?? 'random') as Quest['type'],
        durationSeconds: dur,
        completionCondition: data.completionCondition ?? '',
        safetyNote: 'Veiligheid en verkeersregels gaan altijd voor.',
      })
      setCurrentQuest(quest)
      if (quest.type === 'timer' && quest.durationSeconds) {
        setTimeout(() => setTimerRunning(true), 50)
      }
    }

    try {
      const endpoint = AI_WORKER_URL || '/api/quest'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: tour.settings.mode,
          difficulty: tour.settings.difficulty,
          timeLeftMinutes,
          allowStops: tour.settings.stopPreference,
          previousTitles,
          location: {
            type: location.type,
            description: location.description,
            city: location.city,
            village: location.village,
            speedKmh: location.speedKmh,
          },
        }),
      })
      if (!res.ok) throw new Error('api error')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      applyQuest(data)
    } catch {
      const { getRandomMockQuest } = await import('@/lib/mockQuests')
      const template = getRandomMockQuest(
        tour.settings.mode,
        tour.settings.stopPreference,
        previousTitles,
        timeLeftMinutes,
        location.type
      )
      applyQuest(template)
    } finally {
      setLoading(false)
    }
  }, [tour, elapsedSeconds, durationSeconds, addQuest])

  useEffect(() => {
    if (tour && !loadedRef.current) {
      loadedRef.current = true
      const active = tour.quests.find(q => q.status === 'active')
      if (active) {
        setCurrentQuest(active)
        if (active.type === 'timer') setTimerRunning(true)
      } else {
        fetchQuest()
      }
    }
  }, [tour, fetchQuest])

  function handleComplete() {
    if (!currentQuest) return
    resolveQuest(currentQuest.id, 'completed', 1)
    setCurrentQuest(null)
    fetchQuest()
  }

  function handleSkip() {
    if (!currentQuest) return
    resolveQuest(currentQuest.id, 'skipped', 0)
    setCurrentQuest(null)
    fetchQuest()
  }

  function handleNew() {
    if (currentQuest) resolveQuest(currentQuest.id, 'skipped', 0)
    setCurrentQuest(null)
    fetchQuest()
  }

  function handlePause() {
    setPaused(p => !p)
    if (paused) resumeTour(); else pauseTour()
    setTimerRunning(running => !running)
  }

  function handleEndTour() {
    endTour()
    router.push('/summary')
  }

  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)
  const remainingMin = Math.floor(remainingSeconds / 60)
  const remainingSec = remainingSeconds % 60
  const tourPct = (elapsedSeconds / durationSeconds) * 100

  const completed = tour?.quests.filter(q => q.status === 'completed').length ?? 0

  if (!hydrated) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-5xl animate-spin">🌀</div>
    </div>
  )
  if (!tour) return null

  return (
    <div className="flex flex-col gap-4 py-4 pb-10">
      {/* Top bar */}
      <div className="glass-card p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{MODE_ICONS[tour.settings.mode]}</span>
          <div>
            <p className="text-xs text-white/40 label-chip">{MODE_LABELS[tour.settings.mode]}</p>
            <p className="text-sm font-bold text-white">
              {paused ? '⏸ Gepauzeerd' : `${completed} voltooid · ${tour.totalScore} punten`}
            </p>
            {location.available && (
              <p className="text-xs text-white/30 mt-0.5">📍 {location.description}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 label-chip">Resterende tijd</p>
          <p className={`text-xl font-black tabular-nums ${
            remainingSeconds < 120 ? 'text-rose-400' : 'gradient-text'
          }`}>
            {String(remainingMin).padStart(2, '0')}:{String(remainingSec).padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* Tour progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 rounded-full"
          style={{ width: `${tourPct}%` }}
        />
      </div>

      {/* Quest area */}
      {loading && !currentQuest ? (
        <div className="glass-card p-10 flex flex-col items-center gap-4 animate-pulse">
          <div className="text-5xl animate-spin">🌀</div>
          <p className="text-white/60 font-medium">AI bedenkt je volgende opdracht…</p>
        </div>
      ) : currentQuest ? (
        <QuestCard
          quest={currentQuest}
          timerRunning={timerRunning && !paused}
          onTimerComplete={handleComplete}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onNew={handleNew}
          onPause={handlePause}
          loading={loading}
        />
      ) : null}

      {/* Paused overlay info */}
      {paused && (
        <div className="glass-card p-4 text-center animate-fade-in">
          <p className="text-white/60 text-sm">Tour gepauzeerd. Klik op ⏸️ in de opdracht om te hervatten.</p>
        </div>
      )}

      {/* End tour */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleEndTour}
          className="flex-1 glass py-3 text-sm text-white/40 font-medium rounded-2xl active:scale-[0.97] transition-all"
        >
          🏁 Tour beëindigen
        </button>
      </div>
    </div>
  )
}
