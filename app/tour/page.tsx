'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTour } from '@/lib/tourStore'
import QuestCard from '@/components/QuestCard'
import { Quest, MODE_ICONS, MODE_LABELS } from '@/lib/types'
import { useLocation } from '@/lib/useLocation'
import { freshSuffix } from '@/lib/mockQuests'
import Link from 'next/link'

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? ''

export default function TourPage() {
  const router = useRouter()
  const { tour, hydrated, addQuest, resolveQuest, pauseTour, resumeTour, endTour } = useTour()
  const location = useLocation()

  const [currentQuest, setCurrentQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)   // gebruiker/GPS heeft timer gestart
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    if (!AI_WORKER_URL) return false
    try { return localStorage.getItem('omweg_ai_enabled') !== 'false' } catch { return true }
  })
  const [aiStatus, setAiStatus] = useState<'online' | 'offline' | 'unknown'>(
    AI_WORKER_URL ? 'unknown' : 'offline'
  )

  function toggleAi() {
    if (!AI_WORKER_URL) return
    const next = !aiEnabled
    setAiEnabled(next)
    setAiStatus(next ? 'unknown' : 'offline')
    try { localStorage.setItem('omweg_ai_enabled', String(next)) } catch {}
  }
  const loadedRef = useRef(false)

  const durationSeconds = (tour?.settings.duration ?? 30) * 60

  // Bewegingsstatus op basis van GPS
  const isMoving = location.available
    ? (location.speedKmh !== undefined && location.speedKmh > 3)
    : true  // geen GPS → neem aan dat je rijdt

  // Timer loopt als: gestart, niet handmatig gepauzeerd, én je rijdt
  const timerRunning = timerStarted && !paused && isMoving
  // Auto-pauze indicator voor in de UI
  const timerAutoPaused = timerStarted && !paused && !isMoving

  // Auto-start timer zodra je rijdt (als er een actieve timer-quest is)
  useEffect(() => {
    if (!timerStarted && isMoving && currentQuest?.type === 'timer' && currentQuest.durationSeconds) {
      setTimerStarted(true)
    }
  }, [isMoving, timerStarted, currentQuest])

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
    setTimerStarted(false)

    const previousTitles = tour.quests.map(q => q.title)
    const timeLeftMinutes = Math.max(1, Math.floor((durationSeconds - elapsedSeconds) / 60))
    // Max timer: 15min→120s (2min), 30min→240s (4min), 60min→480s (8min), 90min+→600s
    const maxTimerSecs = Math.min(Math.max(timeLeftMinutes * 8, 60), 600)

    const applyQuest = (data: {
      title?: string; instruction?: string; type?: string;
      durationSeconds?: number | string | null; completionCondition?: string
    }) => {
      const questType = (data.type ?? 'random') as Quest['type']

      // Robuust parsen — AI kan string of null teruggeven
      let dur: number | null = null
      if (data.durationSeconds != null && data.durationSeconds !== '') {
        const parsed = Number(data.durationSeconds)
        if (!isNaN(parsed) && parsed > 0) dur = parsed
      }
      // Timer-quest zonder duur krijgt een sensible default
      if (questType === 'timer' && !dur) dur = 180
      if (dur && dur > maxTimerSecs) dur = maxTimerSecs

      // Strip de AI-richting (na \n\n) en vervang met willekeurige uit de pool
      // — voorkomt dat de AI altijd dezelfde richting kiest (bijv. "rechts")
      const rawInstruction = data.instruction ?? '...'
      const mainPart = rawInstruction.split('\n\n')[0]
      const instruction = `${mainPart}\n\n${freshSuffix(questType)}`

      const quest = addQuest({
        title: data.title ?? 'Nieuwe opdracht',
        instruction,
        type: questType,
        durationSeconds: dur,
        completionCondition: data.completionCondition ?? '',
        safetyNote: 'Veiligheid en verkeersregels gaan altijd voor.',
      })
      setCurrentQuest(quest)
      // Timer start NIET automatisch — gebruiker tikt op "Start" in de QuestCard
      setTimerStarted(false)
    }

    // Mix: ~30% kans op offline quest, ook als AI aan is — voor afwisseling
    const forceOffline = !AI_WORKER_URL || !aiEnabled || Math.random() < 0.3

    try {
      if (forceOffline) throw new Error('offline quest turn')
      const res = await fetch(AI_WORKER_URL, {
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
      setAiStatus('online')
      applyQuest(data)
    } catch {
      if (!forceOffline) setAiStatus('offline')
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
  }, [tour, elapsedSeconds, durationSeconds, addQuest, aiEnabled, location.type]) // eslint-disable-line

  useEffect(() => {
    if (tour && !loadedRef.current) {
      loadedRef.current = true
      const active = tour.quests.find(q => q.status === 'active')
      if (active) {
        setCurrentQuest(active)
        if (active.type === 'timer') setTimerStarted(true)
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
    setTimerStarted(s => !s)
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
        <div className="text-right flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <AiDot status={aiEnabled ? aiStatus : 'disabled'} onToggle={AI_WORKER_URL ? toggleAi : undefined} />
            <p className="text-xs text-white/40 label-chip">Resterende tijd</p>
          </div>
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
          timerRunning={timerRunning}
          timerAutoPaused={timerAutoPaused}
          timerStarted={timerStarted}
          onTimerComplete={handleComplete}
          onStartTimer={() => setTimerStarted(true)}
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

function AiDot({ status, onToggle }: {
  status: 'online' | 'offline' | 'unknown' | 'disabled'
  onToggle?: () => void
}) {
  const cfg = {
    online:   { color: 'bg-emerald-400', pulse: true,  label: 'AI actief' },
    offline:  { color: 'bg-rose-500',    pulse: false, label: 'AI fout' },
    unknown:  { color: 'bg-amber-400',   pulse: false, label: 'AI laden…' },
    disabled: { color: 'bg-white/20',    pulse: false, label: 'AI uit' },
  }[status]

  const el = (
    <div className="flex items-center gap-1">
      <div className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.color}`} />
      </div>
      <span className="text-[10px] text-white/30">{cfg.label}</span>
    </div>
  )

  if (!onToggle) return el

  return (
    <button
      onClick={onToggle}
      title={status === 'disabled' ? 'AI inschakelen' : 'AI uitschakelen'}
      className="flex items-center gap-1 active:scale-90 transition-transform"
    >
      {el}
    </button>
  )
}
