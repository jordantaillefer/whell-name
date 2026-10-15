import { describe, expect, it } from "vitest"
import { EXTRAS_KEY, loadShowExtras, saveShowExtras } from "./preferences"

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

describe("anecdotes et horoscope", () => {
  it("sont affichés par défaut, y compris sans stockage", () => {
    expect(loadShowExtras(memoryStorage())).toBe(true)
    expect(loadShowExtras(null)).toBe(true)
  })

  it("restent masqués d'une session à l'autre une fois masqués", () => {
    const storage = memoryStorage()
    saveShowExtras(storage, false)
    expect(loadShowExtras(storage)).toBe(false)
    saveShowExtras(storage, true)
    expect(loadShowExtras(storage)).toBe(true)
  })

  it("ignorent une valeur inconnue", () => {
    expect(loadShowExtras(memoryStorage({ [EXTRAS_KEY]: "n'importe quoi" }))).toBe(true)
  })

  it("ne plantent pas si le stockage refuse l'écriture", () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError") } }
    expect(() => saveShowExtras(storage, false)).not.toThrow()
  })
})
