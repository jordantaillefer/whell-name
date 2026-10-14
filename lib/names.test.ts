import { describe, expect, it } from "vitest"
import {
  buildSearch,
  mergeNames,
  nameKey,
  parseMode,
  parseNamesParam,
  removeName,
  sameList,
  splitInput,
  truncateLabel,
} from "./names"

describe("nameKey", () => {
  it("ignore la casse, les accents et les espaces superflus", () => {
    expect(nameKey("  Élodie  ")).toBe("elodie")
    expect(nameKey("Jean   Marc")).toBe("jean marc")
  })
})

describe("splitInput", () => {
  it("découpe sur les virgules et retire les entrées vides", () => {
    expect(splitInput("Alice, Bruno ,, Chloé")).toEqual(["Alice", "Bruno", "Chloé"])
  })
})

describe("mergeNames", () => {
  it("ajoute les nouveaux noms et signale les doublons", () => {
    expect(mergeNames(["Alice"], ["alice", "Bruno", " ", "BRUNO"])).toEqual({
      names: ["Alice", "Bruno"],
      added: ["Bruno"],
      duplicates: ["alice", "BRUNO"],
    })
  })

  it("normalise les espaces du libellé", () => {
    expect(mergeNames([], ["  Jean   Marc "]).names).toEqual(["Jean Marc"])
  })
})

describe("removeName", () => {
  it("retire sans tenir compte de la casse ni des accents", () => {
    expect(removeName(["Élodie", "Bruno"], "elodie")).toEqual(["Bruno"])
  })
})

describe("sameList", () => {
  it("compare l'ordre et le contenu", () => {
    expect(sameList(["a", "b"], ["a", "b"])).toBe(true)
    expect(sameList(["a", "b"], ["b", "a"])).toBe(false)
    expect(sameList(["a"], ["a", "b"])).toBe(false)
  })
})

describe("parseNamesParam", () => {
  it("accepte les anciens liens avec des virgules non encodées", () => {
    expect(parseNamesParam("Alice,Bruno")).toEqual(["Alice", "Bruno"])
  })

  it("ignore les entrées vides et les doublons", () => {
    expect(parseNamesParam("Alice,,alice, Bruno ")).toEqual(["Alice", "Bruno"])
  })

  it("renvoie une liste vide sans paramètre", () => {
    expect(parseNamesParam(null)).toEqual([])
    expect(parseNamesParam("")).toEqual([])
  })
})

describe("parseMode", () => {
  it("reconnaît les modes et retombe sur la roue", () => {
    expect(parseMode("grid")).toBe("grid")
    expect(parseMode("star")).toBe("star")
    expect(parseMode("wheel")).toBe("wheel")
    expect(parseMode("bogus")).toBe("wheel")
    expect(parseMode(null)).toBe("wheel")
  })
})

describe("buildSearch", () => {
  it("fait l'aller-retour avec URLSearchParams", () => {
    const search = buildSearch(["Élodie", "Jean Marc"], "star")
    const params = new URLSearchParams(search)
    expect(parseNamesParam(params.get("names"))).toEqual(["Élodie", "Jean Marc"])
    expect(parseMode(params.get("mode"))).toBe("star")
  })

  it("omet les valeurs par défaut", () => {
    expect(buildSearch([], "wheel")).toBe("")
    expect(buildSearch(["A", "B"], "wheel")).toBe("?names=A%2CB")
  })
})

describe("truncateLabel", () => {
  it("laisse les noms courts intacts", () => {
    expect(truncateLabel("Alice")).toBe("Alice")
  })

  it("tronque au-delà de 16 caractères avec une ellipse", () => {
    expect(truncateLabel("Marie-Bénédicte-Alexandrine")).toBe("Marie-Bénédicte…")
    expect(truncateLabel("Marie-Bénédicte-Alexandrine")).toHaveLength(16)
  })

  it("accepte une longueur maximale personnalisée", () => {
    expect(truncateLabel("Alexandrine", 6)).toBe("Alexa…")
  })
})
