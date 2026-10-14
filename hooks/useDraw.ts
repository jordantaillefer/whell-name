"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DisplayMode } from "@/lib/names"
import {
  JUMP_COUNT,
  REDUCED_SPIN_DURATION_MS,
  SPIN_DURATION_MS,
  jumpDelay,
  jumpSequence,
  normalizeAngle,
  targetRotation,
} from "@/lib/spin"

export type DrawController = {
  rotation: number
  animateRotation: boolean
  durationMs: number
  highlightIndex: number | null
  drawing: boolean
  start: (names: string[]) => void
  reset: () => void
}

type Options = {
  mode: DisplayMode
  reducedMotion: boolean
  onLanded: (index: number, names: string[]) => void
}

export function useDraw({ mode, reducedMotion, onLanded }: Options): DrawController {
  const [rotation, setRotation] = useState(0)
  const [animateRotation, setAnimateRotation] = useState(true)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [drawing, setDrawing] = useState(false)
  const rotationRef = useRef(0)
  const drawingRef = useRef(false)
  const timers = useRef<number[]>([])
  const onLandedRef = useRef(onLanded)

  useEffect(() => {
    onLandedRef.current = onLanded
  }, [onLanded])

  const durationMs = reducedMotion ? REDUCED_SPIN_DURATION_MS : SPIN_DURATION_MS

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const land = useCallback(
    (index: number, names: string[], wheel: boolean) => {
      drawingRef.current = false
      setDrawing(false)
      setHighlightIndex(null)
      if (wheel) {
        // On ramène l'angle dans [0, 360) sans transition pour ne pas accumuler les tours
        const normalized = normalizeAngle(rotationRef.current)
        rotationRef.current = normalized
        setAnimateRotation(false)
        setRotation(normalized)
        later(() => setAnimateRotation(true), 50)
      }
      onLandedRef.current(index, names)
    },
    [later],
  )

  const start = useCallback(
    (names: string[]) => {
      if (names.length < 2 || drawingRef.current) return
      drawingRef.current = true
      setDrawing(true)
      setHighlightIndex(null)
      const finalIndex = Math.floor(Math.random() * names.length)

      if (mode === "wheel") {
        const target = targetRotation(rotationRef.current, finalIndex, names.length)
        rotationRef.current = target
        setAnimateRotation(true)
        setRotation(target)
        later(() => land(finalIndex, names, true), durationMs + 50)
        return
      }

      const sequence = jumpSequence(names.length, finalIndex, reducedMotion ? 1 : JUMP_COUNT)
      let elapsed = 0
      sequence.forEach((index, step) => {
        elapsed += reducedMotion ? 0 : jumpDelay(step, sequence.length)
        later(() => setHighlightIndex(index), elapsed)
      })
      later(() => land(finalIndex, names, false), elapsed + 200)
    },
    [mode, reducedMotion, durationMs, later, land],
  )

  const reset = useCallback(() => {
    clearTimers()
    drawingRef.current = false
    setDrawing(false)
    setHighlightIndex(null)
    rotationRef.current = 0
    setAnimateRotation(false)
    setRotation(0)
    later(() => setAnimateRotation(true), 50)
  }, [clearTimers, later])

  return { rotation, animateRotation, durationMs, highlightIndex, drawing, start, reset }
}
