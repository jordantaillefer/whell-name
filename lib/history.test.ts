import { describe, expect, it } from "vitest"
import {
  HISTORY_LIMIT,
  emptyHistory,
  forget,
  formatSavedAt,
  loadHistory,
  persistHistory,
  recordAdded,
  saveLastList,
  suggestions,
} from "./history"
import { nameKey } from "./names"

const T0 = new Date(2026, 9, 14, 9, 32).getTime()

describe("recordAdded", () => {
  it("compte les ajouts sans tenir compte de la casse et garde la dernière graphie", () => {
    let state = recordAdded(emptyHistory(), ["Alice"], T0)
    state = recordAdded(state, ["alice"], T0 + 1000)
    expect(Object.values(state.names)).toEqual([{ label: "alice", count: 2, lastUsed: T0 + 1000 }])
  })

  it("ignore les libellés vides", () => {
    expect(recordAdded(emptyHistory(), ["  "], T0)).toEqual(emptyHistory())
  })

  it(`plafonne à ${HISTORY_LIMIT} noms sans évincer ceux qu'on vient d'ajouter`, () => {
    let state = emptyHistory()
    for (let i = 0; i < HISTORY_LIMIT; i++) {
      state = recordAdded(state, [`Nom ${i}`], T0 + i)
      state = recordAdded(state, [`Nom ${i}`], T0 + i)
    }
    state = recordAdded(state, ["Nouveau"], T0 + 100)
    expect(Object.keys(state.names)).toHaveLength(HISTORY_LIMIT)
    expect(state.names[nameKey("Nouveau")]).toBeDefined()
    expect(state.names[nameKey("Nom 0")]).toBeUndefined()
  })
})

describe("forget", () => {
  it("supprime un nom de l'historique", () => {
    const state = forget(recordAdded(emptyHistory(), ["Alice", "Bruno"], T0), "ALICE")
    expect(Object.values(state.names).map((e) => e.label)).toEqual(["Bruno"])
  })
})

describe("suggestions", () => {
  it("exclut les noms déjà dans la roue et trie par usage puis par récence", () => {
    let state = recordAdded(emptyHistory(), ["Alice", "Bruno", "Chloé"], T0)
    state = recordAdded(state, ["Bruno"], T0 + 10)
    state = recordAdded(state, ["Chloé"], T0 + 20)
    expect(suggestions(state, ["alice"]).map((e) => e.label)).toEqual(["Chloé", "Bruno"])
  })
})

describe("saveLastList", () => {
  it("ignore les listes de moins de 2 noms", () => {
    expect(saveLastList(emptyHistory(), ["Alice"], T0).lastList).toBeUndefined()
  })

  it("enregistre une nouvelle liste", () => {
    expect(saveLastList(emptyHistory(), ["A", "B"], T0).lastList).toEqual({ names: ["A", "B"], savedAt: T0 })
  })

  it("ignore une liste qui n'est qu'un sous-ensemble de la dernière (les retraits du tour de table)", () => {
    let state = saveLastList(emptyHistory(), ["A", "B", "C"], T0)
    state = saveLastList(state, ["A", "C"], T0 + 5)
    expect(state.lastList).toEqual({ names: ["A", "B", "C"], savedAt: T0 })
  })

  it("remplace la liste dès qu'un nouveau nom apparaît", () => {
    let state = saveLastList(emptyHistory(), ["A", "B"], T0)
    state = saveLastList(state, ["A", "D"], T0 + 5)
    expect(state.lastList).toEqual({ names: ["A", "D"], savedAt: T0 + 5 })
  })
})

describe("loadHistory / persistHistory", () => {
  it("fait l'aller-retour", () => {
    const state = saveLastList(recordAdded(emptyHistory(), ["Alice", "Bruno"], T0), ["Alice", "Bruno"], T0)
    let stored = ""
    expect(persistHistory({ setItem: (_k, v) => { stored = v } }, state)).toBe(true)
    expect(loadHistory({ getItem: () => stored })).toEqual(state)
  })

  it("revient à un historique vide si le JSON est corrompu", () => {
    expect(loadHistory({ getItem: () => "{oops" })).toEqual(emptyHistory())
  })

  it("ignore les entrées mal formées", () => {
    const raw = JSON.stringify({
      names: { a: { label: "A", count: 1, lastUsed: 1 }, b: { label: 3 } },
      lastList: { names: "x" },
    })
    expect(loadHistory({ getItem: () => raw })).toEqual({ names: { a: { label: "A", count: 1, lastUsed: 1 } } })
  })

  it("supporte l'absence de stockage ou une lecture qui échoue", () => {
    expect(loadHistory(null)).toEqual(emptyHistory())
    expect(loadHistory({ getItem: () => { throw new Error("SecurityError") } })).toEqual(emptyHistory())
  })

  it("renvoie false si l'écriture échoue (quota, navigation privée)", () => {
    expect(persistHistory({ setItem: () => { throw new Error("QuotaExceededError") } }, emptyHistory())).toBe(false)
    expect(persistHistory(null, emptyHistory())).toBe(false)
  })
})

describe("formatSavedAt", () => {
  const now = new Date(2026, 9, 14, 18, 0).getTime()

  it("formate aujourd'hui, hier, les derniers jours puis la date", () => {
    expect(formatSavedAt(new Date(2026, 9, 14, 9, 5).getTime(), now)).toBe("aujourd'hui, 9 h 05")
    expect(formatSavedAt(new Date(2026, 9, 13, 9, 32).getTime(), now)).toBe("hier, 9 h 32")
    expect(formatSavedAt(new Date(2026, 9, 11, 9, 32).getTime(), now)).toBe("il y a 3 jours")
    expect(formatSavedAt(new Date(2026, 9, 2, 9, 32).getTime(), now)).toBe("le 2 octobre")
  })
})
