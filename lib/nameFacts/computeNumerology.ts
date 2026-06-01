import type { NumerologyData } from "./types"

const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
}

const MEANINGS: Record<number, string> = {
  1: "leadership, indépendance et créativité — un esprit pionnier qui aime ouvrir la voie.",
  2: "diplomatie, sensibilité et coopération — un cœur conciliant qui sait écouter et apaiser.",
  3: "expression, joie et communication — une âme rayonnante faite pour partager et créer.",
  4: "stabilité, rigueur et travail — un caractère structuré qui bâtit sur des fondations solides.",
  5: "liberté, voyage et changement — un esprit curieux qui ne tient pas en place.",
  6: "harmonie, famille et responsabilité — un naturel protecteur et profondément humain.",
  7: "introspection, sagesse et spiritualité — une nature analytique attirée par les mystères.",
  8: "ambition, pouvoir et réussite matérielle — un tempérament conquérant et déterminé.",
  9: "humanisme, altruisme et générosité — une âme tournée vers les autres et les grandes causes.",
}

export function computeNumerology(name: string): NumerologyData | null {
  const cleaned = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "")

  if (cleaned.length === 0) return null

  let sum = 0
  for (const ch of cleaned) {
    sum += LETTER_VALUES[ch] ?? 0
  }

  while (sum > 9) {
    sum = sum
      .toString()
      .split("")
      .reduce((acc, d) => acc + Number(d), 0)
  }

  const meaning = MEANINGS[sum]
  if (!meaning) return null

  return { number: sum, meaning }
}
