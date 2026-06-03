'use client'

import { useState, useEffect, useRef } from 'react'

// snelweg    = >100 km/u
// 80weg      = 80–100 km/u  (provinciale/80km wegen)
// binnendoor = 50–80 km/u   (doorgaande wegen, buiten bebouwde kom)
// stad       = grote stad/town (geocode: addr.city / addr.town)
// dorp       = 1–50 km/u of klein dorp (addr.village / addr.hamlet)
// stilstand  = 0 km/u → niet meetellen
export type LocationType = 'snelweg' | '80weg' | 'binnendoor' | 'stad' | 'dorp' | 'landelijk' | 'onbekend'

export interface LocationContext {
  type: LocationType
  city?: string
  village?: string
  road?: string
  speedKmh?: number
  description: string
  available: boolean
}

const DEFAULT: LocationContext = {
  type: 'onbekend',
  description: 'Locatie onbekend',
  available: false,
}

function typeFromSpeed(kmh: number): LocationType | null {
  if (kmh === 0) return null      // stilstaan — niet meetellen
  if (kmh > 100) return 'snelweg'
  if (kmh > 80)  return '80weg'
  if (kmh > 50)  return 'binnendoor'
  return 'dorp'
}

function typeFromGeocode(addr: Record<string, string>): LocationType {
  const road = addr.road?.toLowerCase() ?? ''
  if (road.includes('motorway') || road.includes('autosnelweg')) return 'snelweg'
  if (addr.city)                                   return 'stad'      // grote stad
  if (addr.town)                                   return 'stad'      // grotere kern
  if (addr.village || addr.hamlet || addr.suburb)  return 'dorp'      // klein dorp
  if (addr.county || addr.municipality)            return 'landelijk'
  return 'onbekend'
}

function buildDescription(
  type: LocationType,
  addr: Record<string, string>,
  speedKmh?: number
): string {
  const place = addr.city || addr.town || addr.village || addr.hamlet
  const spd   = speedKmh ? ` (~${speedKmh} km/u)` : ''
  switch (type) {
    case 'snelweg':     return `Op de snelweg${spd}`
    case '80weg':       return `Op een 80 km/u-weg${spd}`
    case 'binnendoor':  return `Binnendoor${spd}`
    case 'stad':        return place ? `In de stad ${place}${spd}` : `In de stad${spd}`
    case 'dorp':        return place ? `In het dorp ${place}${spd}` : `In een dorp${spd}`
    case 'landelijk':   return `Op het platteland${spd}`
    default:            return 'Onderweg'
  }
}

export function useLocation(): LocationContext {
  const [ctx, setCtx] = useState<LocationContext>(DEFAULT)
  const lastGeocode = useRef<number>(0)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords
        const speedKmh = speed != null ? Math.round(speed * 3.6) : undefined

        // Snelheidsdetectie — werkt zonder geocoding, maar sla stilstand over
        if (speedKmh != null) {
          const speedType = typeFromSpeed(speedKmh)
          if (speedType !== null) {
            setCtx(prev => ({
              ...prev,
              type: speedType,
              speedKmh,
              description: buildDescription(speedType, {}, speedKmh),
              available: true,
            }))
          }
          // Bij stilstand (0 km/u): type NIET updaten, alleen speedKmh bijwerken
          if (speedKmh === 0) {
            setCtx(prev => ({ ...prev, speedKmh: 0, available: true }))
          }
        }

        // Geocode max 1× per 30 seconden
        const now = Date.now()
        if (now - lastGeocode.current < 30_000) return
        lastGeocode.current = now

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=nl`,
            { headers: { 'User-Agent': 'Omweg-RoadtripGame/1.0' } }
          )
          const data = await res.json()
          const addr: Record<string, string> = data.address || {}

          // Snelheid heeft voorrang; geocoding vult aan als snelheid onbekend is
          const finalType = (speedKmh != null && speedKmh > 0)
            ? (typeFromSpeed(speedKmh) ?? typeFromGeocode(addr))
            : typeFromGeocode(addr)

          setCtx({
            type: finalType,
            city: addr.city || addr.town,
            village: addr.village || addr.hamlet,
            road: addr.road,
            speedKmh,
            description: buildDescription(finalType, addr, speedKmh ?? undefined),
            available: true,
          })
        } catch {
          setCtx(prev => ({ ...prev, speedKmh, available: true }))
        }
      },
      () => { /* GPS geweigerd */ },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return ctx
}
