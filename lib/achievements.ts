import { TourState, Achievement } from './types'

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
