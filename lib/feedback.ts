import { Quest } from './types'

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? ''

/**
 * Verwijder plaatsnamen uit de tekst zodat de feedback generiek wordt.
 * (We willen weten welk SOORT opdracht goed valt, niet wáár.)
 */
function stripPlaces(text: string, places: string[]): string {
  let cleaned = text
  for (const p of places) {
    if (!p) continue
    const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    cleaned = cleaned.replace(re, 'deze plek')
  }
  return cleaned
}

/**
 * Stuur like/dislike naar de Worker (D1). Stilletjes falen is prima —
 * feedback is bonus, nooit blokkerend.
 */
export async function sendFeedback(
  quest: Quest,
  vote: 1 | -1,
  mode: string,
  places: string[] = []
): Promise<void> {
  if (!AI_WORKER_URL) return
  // Alleen de hoofdtekst, plaatsnamen eruit
  const main = quest.instruction.split('\n\n')[0]
  const generic = stripPlaces(main, places)

  try {
    await fetch(`${AI_WORKER_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        vote,
        type: quest.type,
        title: quest.title,
        instruction: generic,
        mode,
        locationType: quest.locationType ?? 'onbekend',
      }),
    })
  } catch {
    // negeren
  }
}
