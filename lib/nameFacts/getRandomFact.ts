import type { CategorizedFacts, FactCategory } from "./types"

const WEIGHTS: Record<FactCategory, number> = {
  etymology: 10,
  wikipedia: 8,
  celebrities: 10,
  numerology: 7,
  saint: 7,
  international: 7,
  variants: 6,
  popularity: 8,
  cultural: 5,
  fun: 6,
  yearly: 3,
}

export function pickWeightedFact(cats: CategorizedFacts): string {
  const entries = (Object.keys(cats) as FactCategory[])
    .filter((key) => cats[key].length > 0)
    .map((key) => ({ key, weight: WEIGHTS[key] }))

  if (entries.length === 0) return ""

  const total = entries.reduce((acc, e) => acc + e.weight, 0)
  let r = Math.random() * total

  let chosen: FactCategory = entries[0].key
  for (const entry of entries) {
    if (r < entry.weight) {
      chosen = entry.key
      break
    }
    r -= entry.weight
  }

  const pool = cats[chosen]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function flattenFacts(cats: CategorizedFacts): string[] {
  return (Object.keys(cats) as FactCategory[]).flatMap((k) => cats[k])
}

export function getRandomFact(facts: string[]): string {
  if (facts.length === 0) return ""
  return facts[Math.floor(Math.random() * facts.length)]
}
