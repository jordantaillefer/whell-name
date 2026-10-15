"use client"

import { useCallback, useEffect, useState } from "react"
import { loadShowExtras, saveShowExtras } from "@/lib/preferences"

function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Afficher ou masquer « Le saviez-vous ? » et l'horoscope (affichés par défaut). */
export function useShowExtras(): [boolean, (show: boolean) => void] {
  const [show, setShowState] = useState(true)

  useEffect(() => {
    setShowState(loadShowExtras(getStorage()))
  }, [])

  const setShow = useCallback((next: boolean) => {
    setShowState(next)
    saveShowExtras(getStorage(), next)
  }, [])

  return [show, setShow]
}
