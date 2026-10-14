"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { buildSearch, parseMode, parseNamesParam, sameList, type DisplayMode } from "@/lib/names"

export function useNamesUrlState() {
  const searchParams = useSearchParams()
  const [names, setNamesState] = useState<string[]>(() => parseNamesParam(searchParams.get("names")))
  const [mode, setModeState] = useState<DisplayMode>(() => parseMode(searchParams.get("mode")))

  // URL → état (précédent/suivant, lien collé)
  useEffect(() => {
    const urlNames = parseNamesParam(searchParams.get("names"))
    setNamesState((previous) => (sameList(previous, urlNames) ? previous : urlNames))
    setModeState(parseMode(searchParams.get("mode")))
  }, [searchParams])

  // État → URL, seulement si l'URL décrit autre chose (évite les boucles et
  // l'entrée d'historique en double au chargement d'un ancien lien)
  useEffect(() => {
    const current = new URLSearchParams(window.location.search)
    if (sameList(parseNamesParam(current.get("names")), names) && parseMode(current.get("mode")) === mode) return
    window.history.pushState(null, "", `${window.location.pathname}${buildSearch(names, mode)}`)
  }, [names, mode])

  const setNames = useCallback((next: string[]) => setNamesState(next), [])
  const setMode = useCallback((next: DisplayMode) => setModeState(next), [])

  return { names, mode, setNames, setMode }
}
