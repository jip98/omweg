'use client'

import { forwardRef } from 'react'
import { TourState, MODE_LABELS } from '@/lib/types'
import { traceDistanceKm } from '@/lib/achievements'

function RouteSvg({ trace }: { trace: { lat: number; lng: number }[] }) {
  if (trace.length < 2) return null
  const lats = trace.map(p => p.lat)
  const lngs = trace.map(p => p.lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const W = 320, H = 150, pad = 16
  const spanLat = maxLat - minLat || 1
  const spanLng = maxLng - minLng || 1
  const pts = trace.map(p => {
    const x = pad + ((p.lng - minLng) / spanLng) * (W - 2 * pad)
    const y = pad + (1 - (p.lat - minLat) / spanLat) * (H - 2 * pad)  // y omgekeerd
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const first = pts[0].split(',').map(Number)
  const last = pts[pts.length - 1].split(',').map(Number)
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polyline
        points={pts.join(' ')}
        fill="none" stroke="#fb923c" strokeWidth={3}
        strokeLinejoin="round" strokeLinecap="round"
      />
      <circle cx={first[0]} cy={first[1]} r={5} fill="#34d399" />
      <circle cx={last[0]} cy={last[1]} r={5} fill="#f43f5e" />
    </svg>
  )
}

interface ShareCardProps {
  tour: TourState
  endTitle: string
  funniest?: string
}

/** Vaste-grootte kaart die als afbeelding wordt geëxporteerd. */
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ tour, endTitle, funniest }, ref) => {
  const completed = tour.quests.filter(q => q.status === 'completed').length
  const km = Math.round(traceDistanceKm(tour.trace ?? []))

  return (
    <div
      ref={ref}
      style={{
        width: 400,
        padding: 28,
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #7c2d12 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, letterSpacing: 3, opacity: 0.6, textTransform: 'uppercase' }}>Omweg</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{endTitle}</div>
        <div style={{ fontSize: 14, opacity: 0.6, marginTop: 2 }}>{MODE_LABELS[tour.settings.mode]}</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 12 }}>
        <RouteSvg trace={tour.trace ?? []} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fbbf24' }}>{tour.totalScore}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>punten</div>
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{completed}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>voltooid</div>
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{km}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>km</div>
        </div>
      </div>

      {funniest && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, opacity: 0.5, textTransform: 'uppercase' }}>Hoogtepunt</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{funniest}</div>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 11, opacity: 0.4 }}>
        Laat AI bepalen waar je uitkomt 🛣️
      </div>
    </div>
  )
})
ShareCard.displayName = 'ShareCard'
export default ShareCard
