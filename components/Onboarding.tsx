'use client'

import { useState } from 'react'

const STORAGE_KEY = 'omweg_onboarded'

export function hasSeenOnboarding(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
}

interface Slide {
  icon: string
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    icon: '🛣️',
    title: 'Welkom bij Omweg',
    body: 'Maak van een gewone autorit een spontaan avontuur. Je krijgt onderweg korte, verrassende opdrachten — links, rechts, iets spotten of ergens stoppen. Laat het toeval bepalen waar je uitkomt!',
  },
  {
    icon: '🛡️',
    title: 'Veiligheid voorop',
    body: 'Omweg is een spel voor passagiers. De bestuurder blijft altijd zelf verantwoordelijk voor veilig rijden en de verkeersregels. Voer een opdracht alleen uit als het veilig en toegestaan is — anders sla je hem gewoon over.',
  },
  {
    icon: '🎛️',
    title: 'Kies je tour',
    body: 'Stel je speelduur, modus, moeilijkheid en stopvoorkeur in. Tijdens het rijden krijg je per opdracht punten. Sommige opdrachten hebben een timer die automatisch meeloopt zodra je rijdt en pauzeert als je stilstaat.',
  },
  {
    icon: '🤖',
    title: 'AI & spraak',
    body: 'Met de 🟢/⚪ knop zet je de slimme AI-opdrachten aan of uit — die passen zich aan op je locatie, snelheid en tijdstip. Met 🔊 laat je elke opdracht hardop voorlezen, handig zodat niemand op het scherm hoeft te kijken.',
  },
]

export default function Onboarding({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1
  const slide = SLIDES[index]

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong max-w-sm w-full p-7 flex flex-col gap-5 animate-slide-up">
        {/* Icon + content */}
        <div className="flex flex-col items-center text-center gap-4 min-h-[260px] justify-center">
          <div className="text-7xl animate-bounce-soft">{slide.icon}</div>
          <h2 className="text-2xl font-black gradient-text">{slide.title}</h2>
          <p className="text-white/70 text-base leading-relaxed">{slide.body}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-orange-400' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isLast && (
            <button onClick={finish} className="btn-glass flex-1 py-3 text-sm text-white/60">
              Overslaan
            </button>
          )}
          {isLast ? (
            <button onClick={finish} className="btn-primary flex-1 py-3">
              🚗 Aan de slag!
            </button>
          ) : (
            <button onClick={() => setIndex(i => i + 1)} className="btn-primary flex-1 py-3">
              Volgende →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
