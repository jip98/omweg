'use client'

import { useState, useEffect, useRef } from 'react'

export type LocationType = 'snelweg' | 'stad' | 'dorp' | 'landelijk' | 'onbekend'

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

function detectType(addr: Record<string, string>, speedKmh?: number): LocationType {
  const road = addr.road?.toLowerCase() ?? ''
  const isHighwayRoad = road.includes('motorway') || road.includes('autosnelweg') || road.includes('snelweg')

  if (speedKmh && speedKmh > 85) return 'snelweg'
  if (isHighwayRoad) return 'snelweg'
  if (addr.city || addr.town) return 'stad'
  if (addr.village || addr.hamlet || addr.suburb) return 'dorp'
  if (addr.county || addr.municipality) return 'landelijk'
  return 'onbekend'
}

function buildDescription(type: LocationType, addr: Record<string, string>, speedKmh?: number): string {
  const place = addr.city || addr.town || addr.village || addr.hamlet
  const speed = speedKmh ? ` (~${speedKmh} km/u)` : ''
  switch (type) {
    case 'snelweg': return `Op de snelweg${speed}`
    case 'stad':    return `In de stad${place ? ` ${place}` : ''}${speed}`
    case 'dorp':    return `In het dorp${place ? ` ${place}` : ''}${speed}`
    case 'landelijk': return `Op het platteland${speed}`
    default:        return 'Onderweg'
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

        // Snelheid-detectie werkt ook zonder geocoding
        if (speedKmh && speedKmh > 85) {
          setCtx(prev => ({
            ...prev,
            type: 'snelweg',
            speedKmh,
            description: `Op de snelweg (~${speedKmh} km/u)`,
            available: true,
          }))
        }

        // Geocode max 1× per 30 seconden om rate limit te vermijden
        const now = Date.now()
        if (now - lastGeocode.current < 30_000) return
        lastGeocode.current = now

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=nl`,
            { headers: { 'User-Agent': 'Omweg-RoadtripGame/1.0 (contact@jipdegroot.nl)' } }
          )
          const data = await res.json()
          const addr: Record<string, string> = data.address || {}

          const type = detectType(addr, speedKmh)
          const description = buildDescription(type, addr, speedKmh)

          setCtx({
            type,
            city: addr.city || addr.town,
            village: addr.village || addr.hamlet,
            road: addr.road,
            speedKmh,
            description,
            available: true,
          })
        } catch {
          // Geocode mislukt — behoud snelheidsdetectie
          setCtx(prev => ({
            ...prev,
            speedKmh,
            available: true,
          }))
        }
      },
      () => { /* GPS geweigerd of niet beschikbaar */ },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return ctx
}
