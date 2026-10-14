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
  it("contient 8 teintes", () => {
    expect(PASTELS).toHaveLength(8)
  })

  it("garantit un contraste RGAA ≥ 4,5:1 entre le texte et le fond", () => {
    for (const swatch of PASTELS) {
      expect(contrastRatio(swatch.bg, swatch.ink)).toBeGreaterThanOrEqual(4.5)
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

  it("renvoie une liste vide pour une roue vide", () => {
    expect(colorsFor([])).toEqual([])
  })
})
