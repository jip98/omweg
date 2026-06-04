import { TourState, Achievement, TourMode } from './types'

// ─── LIFETIME / BADGE-BORD ───────────────────────────────────────────────────

export interface LifetimeStats {
  tours: number
  completedQuests: number
  totalKm: number
  places: number
  modes: Set<TourMode>
  snelweg: number
  landelijkDorp: number
  bestScore: number
  perfectTour: boolean   // ooit een rit zonder skips (≥5 voltooid)
  nightTour: boolean     // ooit 's nachts gereden
  longestKm: number
}

export interface AchievementDef {
  id: string
  icon: string
  title: string
  description: string
  check: (s: LifetimeStats) => boolean
}

/** Volledige badge-catalogus (vast). */
export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_tour',  icon: '🎉', title: 'Eerste rit',       description: 'Voltooi je eerste tour',          check: s => s.tours >= 1 },
  { id: 'five_tours',  icon: '🚗', title: 'Vaste rijder',     description: 'Voltooi 5 tours',                 check: s => s.tours >= 5 },
  { id: 'twenty',      icon: '🏆', title: 'Tourveteraan',     description: 'Voltooi 20 tours',                check: s => s.tours >= 20 },
  { id: 'all_modes',   icon: '🎭', title: 'Allesproever',     description: 'Speel alle 6 de modi',            check: s => s.modes.size >= 6 },
  { id: 'quests_50',   icon: '✅', title: 'Vijftig klaar',    description: '50 opdrachten voltooid',          check: s => s.completedQuests >= 50 },
  { id: 'quests_200',  icon: '💯', title: 'Onvermoeibaar',    description: '200 opdrachten voltooid',         check: s => s.completedQuests >= 200 },
  { id: 'km_50',       icon: '🛣️', title: 'Op dreef',         description: '50 km in totaal afgelegd',        check: s => s.totalKm >= 50 },
  { id: 'km_250',      icon: '🌍', title: 'Grootreiziger',    description: '250 km in totaal afgelegd',       check: s => s.totalKm >= 250 },
  { id: 'places_10',   icon: '🗺️', title: 'Verkenner',        description: '10 plaatsen bezocht',             check: s => s.places >= 10 },
  { id: 'places_50',   icon: '🧭', title: 'Ontdekkingsreiziger', description: '50 plaatsen bezocht',          check: s => s.places >= 50 },
  { id: 'highway',     icon: '👑', title: 'Snelwegkoning',    description: 'Veel snelweg gereden',            check: s => s.snelweg >= 15 },
  { id: 'rural',       icon: '🌾', title: 'Plattelandsheld',  description: 'Veel landweggetjes gereden',      check: s => s.landelijkDorp >= 20 },
  { id: 'night',       icon: '🦉', title: 'Nachtuil',         description: 'Rijd een keer \'s nachts',        check: s => s.nightTour },
  { id: 'perfect',     icon: '💎', title: 'Perfectionist',    description: 'Een rit zonder iets over te slaan', check: s => s.perfectTour },
  { id: 'highscore',   icon: '⭐', title: 'Topscore',         description: '25+ punten in één rit',           check: s => s.bestScore >= 25 },
  { id: 'longtrip',    icon: '🚀', title: 'Lange reis',       description: 'Eén rit van 25+ km',              check: s => s.longestKm >= 25 },
]

export function computeLifetimeStats(tours: TourState[]): LifetimeStats {
  const s: LifetimeStats = {
    tours: 0, completedQuests: 0, totalKm: 0, places: 0,
    modes: new Set(), snelweg: 0, landelijkDorp: 0,
    bestScore: 0, perfectTour: false, nightTour: false, longestKm: 0,
  }
  const placeSet = new Set<string>()

  for (const t of tours) {
    s.tours++
    s.modes.add(t.settings.mode)
    const completed = t.quests.filter(q => q.status === 'completed').length
    const skipped = t.quests.filter(q => q.status === 'skipped').length
    s.completedQuests += completed
    const km = traceDistanceKm(t.trace ?? [])
    s.totalKm += km
    s.longestKm = Math.max(s.longestKm, km)
    s.bestScore = Math.max(s.bestScore, t.totalScore)
    for (const p of t.places ?? []) placeSet.add(p)
    for (const lt of t.locationTypes ?? []) {
      if (lt === 'snelweg') s.snelweg++
      if (lt === 'landelijk' || lt === 'dorp') s.landelijkDorp++
    }
    if (completed >= 5 && skipped === 0) s.perfectTour = true
    const hour = new Date(t.startedAt).getHours()
    if (hour >= 22 || hour < 6) s.nightTour = true
  }

  s.places = placeSet.size
  s.totalKm = Math.round(s.totalKm)
  return s
}

// ─── PER-RIT BADGES (samenvattingsscherm) ────────────────────────────────────

/** Bereken behaalde badges op basis van de tour-data. */
export function computeAchievements(tour: TourState): Achievement[] {
  const earned: Achievement[] = []
  const completed = tour.quests.filter(q => q.status === 'completed')
  const skipped = tour.quests.filter(q => q.status === 'skipped')
  const types = tour.locationTypes ?? []
  const count = (t: string) => types.filter(x => x === t).length
  const places = tour.places ?? []

  // Aantal voltooid
  if (completed.length >= 1)
    earned.push({ id: 'first', icon: '🌟', title: 'Op weg', description: 'Eerste opdracht voltooid' })
  if (completed.length >= 10)
    earned.push({ id: 'ten', icon: '🔟', title: 'Doorzetter', description: '10 opdrachten voltooid' })
  if (completed.length >= 25)
    earned.push({ id: 'marathon', icon: '🏅', title: 'Marathonrijder', description: '25 opdrachten voltooid' })

  // Nooit overgeslagen
  if (completed.length >= 5 && skipped.length === 0)
    earned.push({ id: 'perfect', icon: '💯', title: 'Geen excuus', description: 'Niets overgeslagen' })

  // Plaatsen bezocht
  if (places.length >= 3)
    earned.push({ id: 'places3', icon: '🗺️', title: 'Verkenner', description: `${places.length} plaatsen aangedaan` })
  if (places.length >= 10)
    earned.push({ id: 'places10', icon: '🌍', title: 'Tien dorpen', description: '10+ plaatsen bezocht' })

  // Snelwegkoning
  if (count('snelweg') >= 5)
    earned.push({ id: 'highway', icon: '👑', title: 'Snelwegkoning', description: 'Veel snelweg gereden' })

  // Landweggetjes
  if (count('landelijk') + count('dorp') >= 5)
    earned.push({ id: 'rural', icon: '🌾', title: 'Plattelandsheld', description: 'Veel landweggetjes' })

  // Nooit verdwaald = tour helemaal uitgereden (status completed)
  if (tour.status === 'completed' && completed.length >= 3)
    earned.push({ id: 'finished', icon: '🏁', title: 'Nooit verdwaald', description: 'Tour helemaal afgemaakt' })

  // Afstand (ruwe schatting uit trace)
  const km = traceDistanceKm(tour.trace ?? [])
  if (km >= 25)
    earned.push({ id: 'far', icon: '🛣️', title: 'Verre reiziger', description: `±${Math.round(km)} km afgelegd` })

  return earned
}

/** Ruwe totale afstand van de GPS-trace in km (Haversine). */
export function traceDistanceKm(trace: { lat: number; lng: number }[]): number {
  if (trace.length < 2) return 0
  let total = 0
  for (let i = 1; i < trace.length; i++) {
    total += haversine(trace[i - 1], trace[i])
  }
  return total
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
