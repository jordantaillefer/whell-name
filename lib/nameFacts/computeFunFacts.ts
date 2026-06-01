import { capitalizeName } from "./normalize"

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"])

const INITIAL_FLOWER: Record<string, string> = {
  a: "l'anémone",
  b: "le bleuet",
  c: "le coquelicot",
  d: "la dahlia",
  e: "l'edelweiss",
  f: "le freesia",
  g: "le géranium",
  h: "l'hortensia",
  i: "l'iris",
  j: "la jacinthe",
  k: "le kalanchoé",
  l: "le lys",
  m: "le muguet",
  n: "le narcisse",
  o: "l'œillet",
  p: "la pivoine",
  q: "la queue-de-renard",
  r: "la rose",
  s: "le souci",
  t: "la tulipe",
  u: "l'ursinia",
  v: "la violette",
  w: "le weigela",
  x: "le xéranthème",
  y: "l'ylang-ylang",
  z: "le zinnia",
}

const INITIAL_STONE: Record<string, string> = {
  a: "l'améthyste",
  b: "le béryl",
  c: "la cornaline",
  d: "le diamant",
  e: "l'émeraude",
  f: "la fluorite",
  g: "le grenat",
  h: "l'hématite",
  i: "l'iolite",
  j: "le jade",
  k: "la kunzite",
  l: "le lapis-lazuli",
  m: "la malachite",
  n: "le néphrite",
  o: "l'opale",
  p: "la perle",
  q: "le quartz",
  r: "le rubis",
  s: "le saphir",
  t: "la topaze",
  u: "l'unakite",
  v: "la vésuvianite",
  w: "la wulfénite",
  x: "le xénotime",
  y: "le yttrium",
  z: "le zircon",
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "")
}

export function computeFunFacts(name: string): string[] {
  const cleaned = normalize(name)
  if (cleaned.length === 0) return []

  const display = capitalizeName(name.trim())
  const facts: string[] = []

  facts.push(`${display} compte ${cleaned.length} lettres.`)

  const vowelCount = [...cleaned].filter((c) => VOWELS.has(c)).length
  const consonantCount = cleaned.length - vowelCount
  if (vowelCount > 0 && consonantCount > 0) {
    facts.push(
      `${display} est composé de ${vowelCount} voyelle${vowelCount > 1 ? "s" : ""} et ${consonantCount} consonne${consonantCount > 1 ? "s" : ""}.`
    )
  }

  const reversed = [...cleaned].reverse().join("")
  if (cleaned.length >= 3 && reversed === cleaned) {
    facts.push(`${display} est un palindrome : il se lit de la même façon dans les deux sens.`)
  }

  const uniqueLetters = new Set(cleaned).size
  if (uniqueLetters === cleaned.length && cleaned.length >= 4) {
    facts.push(`Aucune lettre n'est répétée dans ${display}, ce qui est plutôt rare.`)
  }

  const initial = cleaned[0]
  const flower = INITIAL_FLOWER[initial]
  if (flower) {
    facts.push(`La fleur associée à l'initiale de ${display} est ${flower}.`)
  }

  const stone = INITIAL_STONE[initial]
  if (stone) {
    facts.push(`La pierre associée à l'initiale de ${display} est ${stone}.`)
  }

  if (cleaned.length >= 7) {
    facts.push(`Avec ses ${cleaned.length} lettres, ${display} fait partie des prénoms plutôt longs.`)
  } else if (cleaned.length <= 3) {
    facts.push(`Avec seulement ${cleaned.length} lettres, ${display} est un prénom particulièrement court.`)
  }

  const doubleLetter = /(.)\1/.exec(cleaned)
  if (doubleLetter) {
    facts.push(`${display} contient une double lettre : « ${doubleLetter[0]} ».`)
  }

  return facts
}
