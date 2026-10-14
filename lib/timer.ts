export const SPEAKING_LIMIT_MS = 120_000

export type TimerTone = "ok" | "warn" | "danger"

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function formatCountdown(elapsedMs: number, limitMs = SPEAKING_LIMIT_MS): string {
  if (elapsedMs <= limitMs) return formatDuration(Math.ceil((limitMs - elapsedMs) / 1000) * 1000)
  return `+${formatDuration(elapsedMs - limitMs)}`
}

export function timerTone(elapsedMs: number): TimerTone {
  if (elapsedMs < 60_000) return "ok"
  if (elapsedMs < 90_000) return "warn"
  return "danger"
}

export function timerProgress(elapsedMs: number, limitMs = SPEAKING_LIMIT_MS): number {
  return Math.max(0, 1 - elapsedMs / limitMs)
}
