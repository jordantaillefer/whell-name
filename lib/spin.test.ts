import { describe, expect, it } from "vitest"
import {
  jumpDelay,
  jumpSequence,
  labelNeedsFlip,
  landedIndex,
  normalizeAngle,
  segmentCenter,
  targetRotation,
} from "./spin"

function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe("normalizeAngle", () => {
  it("ramène dans [0, 360)", () => {
    expect(normalizeAngle(-30)).toBe(330)
    expect(normalizeAngle(725)).toBe(5)
    expect(normalizeAngle(360)).toBe(0)
  })
})

describe("segmentCenter", () => {
  it("place la part 0 sous le pointeur", () => {
    expect(segmentCenter(0, 6)).toBe(-90)
    expect(segmentCenter(1, 4)).toBe(0)
  })
})

describe("landedIndex", () => {
  it("désigne la part 0 au repos", () => {
    expect(landedIndex(0, 6)).toBe(0)
  })

  it("désigne la part 1 après un recul d'une part", () => {
    expect(landedIndex(-60, 6)).toBe(1)
  })
})

describe("targetRotation", () => {
  it("amène toujours la part visée sous le pointeur", () => {
    const rng = seeded(42)
    for (let count = 2; count <= 24; count++) {
      for (let index = 0; index < count; index++) {
        const current = rng() * 720
        expect(landedIndex(targetRotation(current, index, count, rng), count)).toBe(index)
      }
    }
  })

  it("fait entre 5 et 8 tours complets", () => {
    const rng = seeded(7)
    for (let k = 0; k < 200; k++) {
      const current = rng() * 360
      const delta = targetRotation(current, 3, 8, rng) - current
      expect(delta).toBeGreaterThanOrEqual(5 * 360)
      expect(delta).toBeLessThan(8 * 360)
    }
  })
})

describe("labelNeedsFlip", () => {
  it("retourne les libellés de la moitié gauche", () => {
    expect(labelNeedsFlip(0, 4, 0)).toBe(false)
    expect(labelNeedsFlip(1, 4, 0)).toBe(false)
    expect(labelNeedsFlip(2, 4, 0)).toBe(false)
    expect(labelNeedsFlip(3, 4, 0)).toBe(true)
    expect(labelNeedsFlip(1, 4, 180)).toBe(true)
  })
})

describe("jumpSequence", () => {
  it("se termine sur l'index final", () => {
    const sequence = jumpSequence(6, 4, 33, seeded(1))
    expect(sequence).toHaveLength(33)
    expect(sequence[sequence.length - 1]).toBe(4)
  })

  it("ne montre jamais deux fois de suite la même case (≥ 3 noms)", () => {
    const rng = seeded(3)
    for (let count = 3; count <= 12; count++) {
      const sequence = jumpSequence(count, count - 1, 33, rng)
      for (let i = 1; i < sequence.length; i++) expect(sequence[i]).not.toBe(sequence[i - 1])
    }
  })

  it("se réduit à l'index final pour un seul saut", () => {
    expect(jumpSequence(5, 2, 1)).toEqual([2])
  })
})

describe("jumpDelay", () => {
  it("ralentit progressivement de 70 à 260 ms", () => {
    expect(jumpDelay(0, 33)).toBe(70)
    expect(jumpDelay(32, 33)).toBe(260)
    expect(jumpDelay(10, 33)).toBeLessThan(jumpDelay(20, 33))
  })
})
