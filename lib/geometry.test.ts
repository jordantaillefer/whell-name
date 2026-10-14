import { describe, expect, it } from "vitest"
import { labelFontSize, polar, starPoints, wedgePath } from "./geometry"

describe("polar", () => {
  it("convertit un angle en coordonnées", () => {
    const p = polar(10, 90)
    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(10)
  })
})

describe("wedgePath", () => {
  it("trace une part de roue centrée en 0,0", () => {
    expect(wedgePath(17, -112.5, -67.5)).toBe("M0 0L-6.506 -15.706A17 17 0 0 1 6.506 -15.706Z")
  })

  it("utilise le grand arc au-delà de 180°", () => {
    expect(wedgePath(10, 0, 270)).toContain("A10 10 0 1 1")
  })
})

describe("starPoints", () => {
  it("place la première pointe en haut et alterne pointes et creux", () => {
    const points = starPoints(100, 100, 5, 90, 36)
    expect(points).toHaveLength(10)
    expect(points[0].x).toBeCloseTo(100)
    expect(points[0].y).toBeCloseTo(10)
    expect(Math.hypot(points[1].x - 100, points[1].y - 100)).toBeCloseTo(36)
  })
})

describe("labelFontSize", () => {
  it("réduit la police quand la roue se remplit", () => {
    expect(labelFontSize(2)).toBe(18)
    expect(labelFontSize(8)).toBe(18)
    expect(labelFontSize(12)).toBe(15)
    expect(labelFontSize(20)).toBe(13)
  })
})
