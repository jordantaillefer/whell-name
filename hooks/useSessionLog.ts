"use client"

import { useCallback, useState } from "react"
import type { PassEntry } from "@/lib/sessionLog"

export function useSessionLog() {
  const [entries, setEntries] = useState<PassEntry[]>([])
  const record = useCallback((name: string, durationMs: number) => {
    setEntries((previous) => [...previous, { name, durationMs }])
  }, [])
  const clear = useCallback(() => setEntries([]), [])
  return { entries, record, clear }
}
