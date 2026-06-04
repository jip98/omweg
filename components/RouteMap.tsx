'use client'

import { useEffect, useRef } from 'react'
import type { TracePoint } from '@/lib/types'

interface RouteMapProps {
  trace: TracePoint[]
}

export default function RouteMap({ trace }: RouteMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!ref.current || trace.length < 2) return
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      // Leaflet CSS injecteren (één keer)
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (cancelled || !ref.current) return

      const latlngs = trace.map(p => [p.lat, p.lng]) as [number, number][]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (L as any).map(ref.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      })
      mapRef.current = map

      ;(L as any).tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map)

      const line = (L as any).polyline(latlngs, { color: '#fb923c', weight: 4, opacity: 0.9 }).addTo(map)

      // Start- en eindmarker
      ;(L as any).circleMarker(latlngs[0], { radius: 6, color: '#34d399', fillColor: '#34d399', fillOpacity: 1 }).addTo(map)
      ;(L as any).circleMarker(latlngs[latlngs.length - 1], { radius: 6, color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 1 }).addTo(map)

      map.fitBounds(line.getBounds(), { padding: [24, 24] })
    })()

    return () => {
      cancelled = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (mapRef.current) { (mapRef.current as any).remove(); mapRef.current = null }
    }
  }, [trace])

  if (trace.length < 2) {
    return (
      <div className="glass-card p-6 text-center text-white/40 text-sm">
        🛰️ Geen route opgenomen — zet GPS aan tijdens het rijden om je route te zien.
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="w-full h-56 rounded-3xl overflow-hidden border border-white/10"
      style={{ background: '#1a1a2e' }}
    />
  )
}
