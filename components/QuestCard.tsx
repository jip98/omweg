'use client'

import { Quest, QuestType } from '@/lib/types'
import TimerDisplay from './TimerDisplay'
import SafetyBanner from './SafetyBanner'

const TYPE_CONFIG: Record<QuestType, { icon: string; label: string; color: string }> = {
  direction: { icon: '🧭', label: 'Richting',  color: 'from-blue-500/30 to-indigo-500/20' },
  timer:     { icon: '⏱️', label: 'Timer',     color: 'from-amber-500/30 to-orange-500/20' },
  spotting:  { icon: '👀', label: 'Spotten',   color: 'from-emerald-500/30 to-teal-500/20' },
  stop:      { icon: '📍', label: 'Stop',      color: 'from-pink-500/30 to-rose-500/20' },
  choice:    { icon: '🎲', label: 'Keuze',     color: 'from-purple-500/30 to-violet-500/20' },
  random:    { icon: '⚡', label: 'Wild',      color: 'from-yellow-500/30 to-amber-500/20' },
}

// Verwerk **vet** tekst en splits op \n\n voor richting-sectie
function renderInstruction(raw: string) {
  const [mainPart, directionPart] = raw.split('\n\n')

  function renderLine(text: string, key: string | number) {
    const parts = text.split(/\*\*(.+?)\*\*/)
    return (
      <span key={key}>
        {parts.map((p, i) =>
          i % 2 === 1
            ? <strong key={i} className="text-white font-bold">{p}</strong>
            : <span key={i}>{p}</span>
        )}
      </span>
    )
  }

  return (
    <>
      <p className="text-white/80 text-base leading-relaxed">
        {renderLine(mainPart, 'main')}
      </p>
      {directionPart && (
        <div className="mt-4 flex items-start gap-2 bg-white/[0.06] rounded-2xl px-4 py-3">
          <span className="text-lg mt-0.5 shrink-0">🧭</span>
          <p className="text-white/90 text-sm font-medium leading-snug">
            {renderLine(directionPart, 'dir')}
          </p>
        </div>
      )}
    </>
  )
}

interface QuestCardProps {
  quest: Quest
  timerRunning: boolean
  onTimerComplete?: () => void
  onComplete: () => void
  onSkip: () => void
  onNew: () => void
  onPause: () => void
  loading?: boolean
}

export default function QuestCard({
  quest, timerRunning, onTimerComplete,
  onComplete, onSkip, onNew, onPause, loading,
}: QuestCardProps) {
  const config = TYPE_CONFIG[quest.type]

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{config.icon}</span>
        <span className="label-chip">{config.label}</span>
      </div>

      {/* Main card */}
      <div className={`glass-card p-6 bg-gradient-to-br ${config.color} flex flex-col gap-4`}>
        <h2 className="text-2xl font-bold text-white">{quest.title}</h2>

        {renderInstruction(quest.instruction)}

        {quest.type === 'timer' && quest.durationSeconds && (
          <TimerDisplay
            totalSeconds={quest.durationSeconds}
            running={timerRunning}
            onComplete={onTimerComplete}
          />
        )}

        {quest.completionCondition && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-white/40">
              <span className="font-semibold text-white/60">Voltooid als: </span>
              {quest.completionCondition}
            </p>
          </div>
        )}
      </div>

      {/* Safety */}
      <SafetyBanner />

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onComplete} className="btn-success col-span-2">
          ✅ Voltooid
        </button>
        <button onClick={onSkip} className="btn-glass text-sm py-3">
          ⏭️ Overslaan
        </button>
        <button onClick={onNew} disabled={loading} className="btn-glass text-sm py-3">
          {loading ? '⏳ Laden...' : '🔀 Nieuwe opdracht'}
        </button>
      </div>

      <button onClick={onPause} className="btn-glass text-sm py-3 text-white/60">
        ⏸️ Pauze
      </button>
    </div>
  )
}
