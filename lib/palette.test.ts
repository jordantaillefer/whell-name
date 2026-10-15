import { describe, expect, it } from "vitest"
import { PASTELS, colorsFor, contrastRatio } from "./palette"

const POOL = [
  "Alice", "Bruno", "Chloé", "David", "Emma", "Farid", "Gaëlle", "Hugo", "Inès", "Jules",
  "Karim", "Léa", "Mona", "Nils", "Océane", "Paul", "Quentin", "Rose", "Sami", "Théo",
]

describe("contrastRatio", () => {
  it("donne 21:1 pour le noir sur blanc", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1)
  })
})

describe("PASTELS", () => {
  it("contient 12 teintes distinctes", () => {
    expect(PASTELS).toHaveLength(12)
    expect(new Set(PASTELS.map((s) => s.bg)).size).toBe(12)
  })

  it("reste pastel : à peine teinté par rapport au fond blanc", () => {
    for (const swatch of PASTELS) {
      const ratio = contrastRatio(swatch.bg, "#FFFFFF")
      expect(ratio).toBeGreaterThanOrEqual(1.05)
      expect(ratio).toBeLessThanOrEqual(1.3)
    }
  })

  it("garantit un contraste ≥ 7:1 entre le texte et le fond (RGAA ≥ 4,5:1, marge pour les parts estompées)", () => {
    for (const swatch of PASTELS) {
      expect(contrastRatio(swatch.bg, swatch.ink)).toBeGreaterThanOrEqual(7)
    }
  })
})

describe("colorsFor", () => {
  it("est déterministe", () => {
    expect(colorsFor(["Alice", "Bruno", "Chloé"])).toEqual(colorsFor(["Alice", "Bruno", "Chloé"]))
  })

  it("donne la même couleur quelle que soit la casse ou les accents", () => {
    expect(colorsFor(["élodie"])[0]).toEqual(colorsFor(["ELODIE"])[0])
  })

  it("ne met jamais deux voisins de la même couleur, y compris entre le dernier et le premier", () => {
    for (let n = 2; n <= POOL.length; n++) {
      const colors = colorsFor(POOL.slice(0, n))
      for (let i = 1; i < n; i++) expect(colors[i].id).not.toBe(colors[i - 1].id)
      if (n >= 3) expect(colors[n - 1].id).not.toBe(colors[0].id)
    }
  })

  it("donne une couleur différente à chacun tant que la palette suffit", () => {
    for (let n = 1; n <= PASTELS.length; n++) {
      const colors = colorsFor(POOL.slice(0, n))
      expect(new Set(colors.map((c) => c.id)).size).toBe(n)
    }
    const six = colorsFor(["Johan", "Benjamin", "Tristan", "Jordan", "Eloge", "Antoine"])
    expect(new Set(six.map((c) => c.id)).size).toBe(6)
  })

  it("renvoie une liste vide pour une roue vide", () => {
    expect(colorsFor([])).toEqual([])
  })
})
