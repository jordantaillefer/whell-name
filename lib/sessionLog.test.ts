import { describe, expect, it } from "vitest"
import { sessionStats } from "./sessionLog"

describe("sessionStats", () => {
  it("calcule le nombre, le total et la moyenne", () => {
    expect(sessionStats([{ name: "A", durationMs: 60_000 }, { name: "B", durationMs: 120_000 }])).toEqual({
      count: 2,
      totalMs: 180_000,
      averageMs: 90_000,
    })
  })

  it("gère un journal vide", () => {
    expect(sessionStats([])).toEqual({ count: 0, totalMs: 0, averageMs: 0 })
  })
})
