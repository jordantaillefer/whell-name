import { describe, expect, it } from "vitest"
import { formatCountdown, formatDuration, timerProgress, timerTone } from "./timer"

describe("formatDuration", () => {
  it("affiche m:ss", () => {
    expect(formatDuration(0)).toBe("0:00")
    expect(formatDuration(65_000)).toBe("1:05")
    expect(formatDuration(-5)).toBe("0:00")
  })
})

describe("formatCountdown", () => {
  it("affiche le temps restant puis le dépassement", () => {
    expect(formatCountdown(0)).toBe("2:00")
    expect(formatCountdown(500)).toBe("2:00")
    expect(formatCountdown(1_000)).toBe("1:59")
    expect(formatCountdown(120_000)).toBe("0:00")
    expect(formatCountdown(132_000)).toBe("+0:12")
  })
})

describe("timerTone", () => {
  it("passe d'ok à avertissement à 60 s puis à danger à 90 s", () => {
    expect(timerTone(59_999)).toBe("ok")
    expect(timerTone(60_000)).toBe("warn")
    expect(timerTone(90_000)).toBe("danger")
  })
})

describe("timerProgress", () => {
  it("renvoie la fraction restante, bornée à 0", () => {
    expect(timerProgress(0)).toBe(1)
    expect(timerProgress(60_000)).toBe(0.5)
    expect(timerProgress(200_000)).toBe(0)
  })
})
