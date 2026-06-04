'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useSpeech() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('omweg_speech') === 'true' } catch { return false }
  })
  const [supported, setSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    try { localStorage.setItem('omweg_speech', String(next)) } catch {}
    if (!next) window.speechSynthesis?.cancel()
  }

  const speak = useCallback((text: string) => {
    if (!enabled || !supported) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'nl-NL'
    utterance.rate = 0.95
    utterance.pitch = 1
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [enabled, supported])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  return { enabled, supported, toggle, speak, stop }
}
