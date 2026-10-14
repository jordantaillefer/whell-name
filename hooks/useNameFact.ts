"use client"

import { useEffect, useState } from "react"

export type NameFactState = { fact: string | null; total: number; loading: boolean }

const IDLE: NameFactState = { fact: null, total: 0, loading: false }

export function useNameFact(name: string | null): NameFactState {
  const [state, setState] = useState<NameFactState>(IDLE)

  useEffect(() => {
    if (!name) {
      setState(IDLE)
      return
    }
    const controller = new AbortController()
    setState({ fact: null, total: 0, loading: true })
    fetch(`/api/name-fact?name=${encodeURIComponent(name)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { fact?: string; totalFacts?: number } | null) => {
        setState({ fact: data?.fact || null, total: data?.totalFacts ?? 0, loading: false })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setState(IDLE)
      })
    return () => controller.abort()
  }, [name])

  return state
}
