"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SpeakingTimer = {
  elapsedMs: number
  running: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  /** Temps écoulé exact, sans attendre le prochain rafraîchissement. */
  read: () => number
}

export function useSpeakingTimer(): SpeakingTimer {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)
  const startedAt = useRef<number | null>(null)
  const accumulated = useRef(0)

  const read = useCallback(
    () => accumulated.current + (startedAt.current === null ? 0 : performance.now() - startedAt.current),
    [],
  )

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setElapsedMs(read()), 250)
    return () => window.clearInterval(id)
  }, [running, read])

  const start = useCallback(() => {
    accumulated.current = 0
    startedAt.current = performance.now()
    setElapsedMs(0)
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (startedAt.current === null) return
    accumulated.current = read()
    startedAt.current = null
    setElapsedMs(accumulated.current)
    setRunning(false)
  }, [read])

  const resume = useCallback(() => {
    if (startedAt.current !== null) return
    startedAt.current = performance.now()
    setRunning(true)
  }, [])

  const reset = useCallback(() => {
    accumulated.current = 0
    startedAt.current = null
    setElapsedMs(0)
    setRunning(false)
  }, [])

  return { elapsedMs, running, start, pause, resume, reset, read }
}
