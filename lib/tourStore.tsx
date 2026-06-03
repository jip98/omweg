'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { TourState, TourSettings, Quest, QuestStatus } from './types'

const STORAGE_KEY = 'omweg_tour'

interface TourContextValue {
  tour: TourState | null
  hydrated: boolean
  startTour: (settings: TourSettings) => void
  addQuest: (q: Omit<Quest, 'id' | 'createdAt' | 'status' | 'points'>) => Quest
  resolveQuest: (id: string, status: QuestStatus, points: number) => void
  pauseTour: () => void
  resumeTour: () => void
  endTour: () => void
  resetAll: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

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

  const persist = useCallback((t: TourState) => {
    setTour(t)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)) } catch {}
  }, [])

  // Fix: settings direct meegeven zodat er geen stale-closure race is
  const startTour = useCallback((settings: TourSettings) => {
    const fresh: TourState = {
      id: uuidv4(),
      settings,
      startedAt: Date.now(),
      status: 'active',
      quests: [],
      totalScore: 0,
    }
    persist(fresh)
  }, [persist])

  const addQuest = useCallback((q: Omit<Quest, 'id' | 'createdAt' | 'status' | 'points'>): Quest => {
    const quest: Quest = { ...q, id: uuidv4(), createdAt: Date.now(), status: 'active', points: 0 }
    setTour(prev => {
      if (!prev) return prev
      const updated = { ...prev, quests: [...prev.quests, quest] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
    return quest
  }, [])

  const resolveQuest = useCallback((id: string, status: QuestStatus, points: number) => {
    setTour(prev => {
      if (!prev) return prev
      const quests = prev.quests.map(q =>
        q.id === id ? { ...q, status, points, completedAt: Date.now() } : q
      )
      const totalScore = quests.reduce((s, q) => s + q.points, 0)
      const updated = { ...prev, quests, totalScore }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const pauseTour = useCallback(() => {
    setTour(prev => {
      if (!prev) return prev
      const updated = { ...prev, status: 'paused' as const }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const resumeTour = useCallback(() => {
    setTour(prev => {
      if (!prev) return prev
      const updated = { ...prev, status: 'active' as const }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const endTour = useCallback(() => {
    setTour(prev => {
      if (!prev) return prev
      const updated = { ...prev, status: 'completed' as const, endedAt: Date.now() }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
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
