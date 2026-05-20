import { unstable_cache } from "next/cache"
import { fetchBehindTheName } from "./fetchBehindTheName"
import { fetchWikipedia } from "./fetchWikipedia"
import { fetchFrenchStats } from "./fetchFrenchStats"
import { buildFacts } from "./buildFacts"
import { getRandomFact } from "./getRandomFact"
import { capitalizeName } from "./normalize"
import type { NameFactResult } from "./types"

const SEVEN_DAYS = 60 * 60 * 24 * 7

const buildFactsForName = unstable_cache(
  async (name: string): Promise<string[]> => {
    const [btnResult, wikiResult, frenchResult] = await Promise.allSettled([
      fetchBehindTheName(name),
      fetchWikipedia(name),
      fetchFrenchStats(name),
    ])

    const btn = btnResult.status === "fulfilled" ? btnResult.value : null
    const wiki = wikiResult.status === "fulfilled" ? wikiResult.value : null
    const french = frenchResult.status === "fulfilled" ? frenchResult.value : null

    return buildFacts({ name, btn, wiki, french })
  },
  ["name-facts"],
  { revalidate: SEVEN_DAYS, tags: ["name-facts"] }
)

export async function getNameFact(name: string): Promise<NameFactResult> {
  const trimmed = name.trim()
  const display = capitalizeName(trimmed)

  if (!trimmed) {
    return { name: display, fact: "", totalFacts: 0 }
  }

  const facts = await buildFactsForName(trimmed)
  const fact = getRandomFact(facts)

  return {
    name: display,
    fact,
    totalFacts: facts.length,
  }
}
