'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { TourState, TourSettings, Quest, QuestStatus, LocationType, TracePoint } from './types'

const STORAGE_KEY = 'omweg_tour'
const HISTORY_KEY = 'omweg_history'
const HISTORY_MAX = 25

interface TourContextValue {
  tour: TourState | null
  hydrated: boolean
  startTour: (settings: TourSettings, startCoord?: { lat: number; lng: number }) => void
  addQuest: (q: Omit<Quest, 'id' | 'createdAt' | 'status' | 'points'>) => Quest
  resolveQuest: (id: string, status: QuestStatus, points: number) => void
  recordTrace: (point: TracePoint) => void
  recordLocation: (type: LocationType, place?: string) => void
  pauseTour: () => void
  resumeTour: () => void
  endTour: () => void
  resetAll: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function getHistory(): TourState[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToHistory(tour: TourState) {
  try {
    const history = getHistory().filter(t => t.id !== tour.id)
    history.unshift(tour)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)))
  } catch {}
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [tour, setTour] = useState<TourState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: TourState = JSON.parse(saved)
        if (parsed.status !== 'completed') setTour(parsed)
      }
    } catch {}
    setHydrated(true)
  }, [])

  const save = (updated: TourState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
    return updated
  }

  const startTour = useCallback((settings: TourSettings, startCoord?: { lat: number; lng: number }) => {
    const fresh: TourState = {
      id: uuidv4(),
      settings,
      startedAt: Date.now(),
      status: 'active',
      quests: [],
      totalScore: 0,
      trace: startCoord ? [{ ...startCoord, t: Date.now() }] : [],
      startCoord,
      places: [],
      locationTypes: [],
    }
    setTour(fresh)
    save(fresh)
  }, [])

  const addQuest = useCallback((q: Omit<Quest, 'id' | 'createdAt' | 'status' | 'points'>): Quest => {
    const quest: Quest = { ...q, id: uuidv4(), createdAt: Date.now(), status: 'active', points: 0 }
    setTour(prev => prev ? save({ ...prev, quests: [...prev.quests, quest] }) : prev)
    return quest
  }, [])

  const resolveQuest = useCallback((id: string, status: QuestStatus, points: number) => {
    setTour(prev => {
      if (!prev) return prev
      const quests = prev.quests.map(q =>
        q.id === id ? { ...q, status, points, completedAt: Date.now() } : q
      )
      const totalScore = quests.reduce((s, q) => s + q.points, 0)
      return save({ ...prev, quests, totalScore })
    })
  }, [])

  const recordTrace = useCallback((point: TracePoint) => {
    setTour(prev => {
      if (!prev || prev.status !== 'active') return prev
      // Sla alleen op als ver genoeg van het vorige punt (ruwe ontdubbeling)
      const last = prev.trace[prev.trace.length - 1]
      if (last && Math.abs(last.lat - point.lat) < 0.0002 && Math.abs(last.lng - point.lng) < 0.0002) {
        return prev
      }
      const startCoord = prev.startCoord ?? { lat: point.lat, lng: point.lng }
      return save({ ...prev, trace: [...prev.trace, point], startCoord })
    })
  }, [])

  const recordLocation = useCallback((type: LocationType, place?: string) => {
    setTour(prev => {
      if (!prev) return prev
      const locationTypes = [...prev.locationTypes, type]
      const places = place && !prev.places.includes(place)
        ? [...prev.places, place]
        : prev.places
      return save({ ...prev, locationTypes, places })
    })
  }, [])

  const pauseTour = useCallback(() => {
    setTour(prev => prev ? save({ ...prev, status: 'paused' }) : prev)
  }, [])

  const resumeTour = useCallback(() => {
    setTour(prev => prev ? save({ ...prev, status: 'active' }) : prev)
  }, [])

  const endTour = useCallback(() => {
    setTour(prev => {
      if (!prev) return prev
      const updated: TourState = { ...prev, status: 'completed', endedAt: Date.now() }
      save(updated)
      saveToHistory(updated)
      return updated
    })
  }, [])

  const resetAll = useCallback(() => {
    setTour(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return (
    <TourContext.Provider value={{
      tour, hydrated, startTour, addQuest, resolveQuest,
      recordTrace, recordLocation,
      pauseTour, resumeTour, endTour, resetAll,
    }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used inside TourProvider')
  return ctx
}
