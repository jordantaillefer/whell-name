import { cleanName, nameKey } from "./names"

export type HistoryEntry = { label: string; count: number; lastUsed: number }
export type LastList = { names: string[]; savedAt: number }
export type HistoryState = { names: Record<string, HistoryEntry>; lastList?: LastList }

export const HISTORY_KEY = "roue-des-noms:history:v1"
export const HISTORY_LIMIT = 30

export function emptyHistory(): HistoryState {
  return { names: {} }
}

function byUsage(a: HistoryEntry, b: HistoryEntry): number {
  return b.count - a.count || b.lastUsed - a.lastUsed
}

function evict(names: Record<string, HistoryEntry>, protectedKeys: Set<string>): Record<string, HistoryEntry> {
  const keys = Object.keys(names)
  if (keys.length <= HISTORY_LIMIT) return names
  const candidates = keys.filter((k) => !protectedKeys.has(k)).sort((a, b) => byUsage(names[a], names[b]))
  const dropCount = keys.length - HISTORY_LIMIT
  const dropped = new Set(candidates.slice(candidates.length - dropCount))
  return Object.fromEntries(keys.filter((k) => !dropped.has(k)).map((k) => [k, names[k]]))
}

export function recordAdded(state: HistoryState, labels: readonly string[], now: number): HistoryState {
  const names = { ...state.names }
  const touched = new Set<string>()
  for (const raw of labels) {
    const label = cleanName(raw)
    if (!label) continue
    const key = nameKey(label)
    names[key] = { label, count: (names[key]?.count ?? 0) + 1, lastUsed: now }
    touched.add(key)
  }
  if (touched.size === 0) return state
  return { ...state, names: evict(names, touched) }
}

export function forget(state: HistoryState, label: string): HistoryState {
  const key = nameKey(label)
  if (!(key in state.names)) return state
  const names = { ...state.names }
  delete names[key]
  return { ...state, names }
}

/**
 * Mémorise la liste en cours pour « Reprendre la dernière liste ».
 * Une liste qui n'est qu'un sous-ensemble de la précédente (on retire les
 * personnes au fil du tour de table) ne la remplace pas.
 */
export function saveLastList(state: HistoryState, names: readonly string[], now: number): HistoryState {
  if (names.length < 2) return state
  const previous = new Set((state.lastList?.names ?? []).map(nameKey))
  if (state.lastList && names.every((n) => previous.has(nameKey(n)))) return state
  return { ...state, lastList: { names: [...names], savedAt: now } }
}

export function suggestions(state: HistoryState, exclude: readonly string[]): HistoryEntry[] {
  const excluded = new Set(exclude.map(nameKey))
  return Object.entries(state.names)
    .filter(([key]) => !excluded.has(key))
    .map(([, entry]) => entry)
    .sort(byUsage)
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return typeof v.label === "string" && typeof v.count === "number" && typeof v.lastUsed === "number"
}

function isLastList(value: unknown): value is LastList {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.names) && v.names.every((n) => typeof n === "string") && typeof v.savedAt === "number"
}

export function loadHistory(storage: Pick<Storage, "getItem"> | null): HistoryState {
  if (!storage) return emptyHistory()
  try {
    const raw = storage.getItem(HISTORY_KEY)
    if (!raw) return emptyHistory()
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return emptyHistory()
    const data = parsed as Record<string, unknown>
    const names: Record<string, HistoryEntry> = {}
    if (data.names && typeof data.names === "object") {
      for (const [key, entry] of Object.entries(data.names as Record<string, unknown>)) {
        if (isEntry(entry)) names[key] = { label: entry.label, count: entry.count, lastUsed: entry.lastUsed }
      }
    }
    const state: HistoryState = { names }
    if (isLastList(data.lastList)) state.lastList = { names: [...data.lastList.names], savedAt: data.lastList.savedAt }
    return state
  } catch {
    return emptyHistory()
  }
}

export function persistHistory(storage: Pick<Storage, "setItem"> | null, state: HistoryState): boolean {
  if (!storage) return false
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function formatSavedAt(savedAt: number, now: number): string {
  const date = new Date(savedAt)
  const time = `${date.getHours()} h ${String(date.getMinutes()).padStart(2, "0")}`
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(new Date(now)) - startOfDay(date)) / 86_400_000)
  if (days <= 0) return `aujourd'hui, ${time}`
  if (days === 1) return `hier, ${time}`
  if (days < 7) return `il y a ${days} jours`
  return `le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
}
