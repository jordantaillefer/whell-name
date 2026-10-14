export type PassEntry = { name: string; durationMs: number }

export function sessionStats(entries: readonly PassEntry[]): { count: number; totalMs: number; averageMs: number } {
  const totalMs = entries.reduce((sum, e) => sum + e.durationMs, 0)
  return { count: entries.length, totalMs, averageMs: entries.length ? Math.round(totalMs / entries.length) : 0 }
}
