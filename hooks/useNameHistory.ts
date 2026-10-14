"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  emptyHistory,
  forget as forgetEntry,
  loadHistory,
  persistHistory,
  recordAdded as recordEntries,
  saveLastList,
  suggestions as suggestionsFor,
  type HistoryEntry,
  type HistoryState,
  type LastList,
} from "@/lib/history"

export type NameHistory = {
  available: boolean
  size: number
  suggestions: HistoryEntry[]
  lastList: LastList | null
  recordAdded: (labels: string[]) => void
  forget: (label: string) => void
  clear: () => void
}

function getStorage(): Storage | null {
  try {
    const storage = window.localStorage
    const probe = "roue-des-noms:probe"
    storage.setItem(probe, "1")
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

export function useNameHistory(currentNames: string[]): NameHistory {
  const [storage, setStorage] = useState<Storage | null>(null)
  const [state, setState] = useState<HistoryState>(emptyHistory)

  useEffect(() => {
    const found = getStorage()
    setStorage(found)
    setState(loadHistory(found))
  }, [])

  const update = useCallback(
    (change: (previous: HistoryState) => HistoryState) => {
      setState((previous) => {
        const next = change(previous)
        if (next !== previous) persistHistory(storage, next)
        return next
      })
    },
    [storage],
  )

  useEffect(() => {
    if (!storage || currentNames.length < 2) return
    const id = window.setTimeout(() => update((s) => saveLastList(s, currentNames, Date.now())), 2000)
    return () => window.clearTimeout(id)
  }, [storage, currentNames, update])

  const suggestions = useMemo(() => suggestionsFor(state, currentNames), [state, currentNames])
  const recordAdded = useCallback((labels: string[]) => update((s) => recordEntries(s, labels, Date.now())), [update])
  const forget = useCallback((label: string) => update((s) => forgetEntry(s, label)), [update])
  const clear = useCallback(() => update(() => emptyHistory()), [update])

  return {
    available: storage !== null,
    size: Object.keys(state.names).length,
    suggestions,
    lastList: state.lastList ?? null,
    recordAdded,
    forget,
    clear,
  }
}
