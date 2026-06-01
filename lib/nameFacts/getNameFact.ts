import { unstable_cache } from "next/cache"
import { fetchBehindTheName } from "./fetchBehindTheName"
import { fetchWikipedia } from "./fetchWikipedia"
import { fetchFrenchStats } from "./fetchFrenchStats"
import { fetchWikidata } from "./fetchWikidata"
import { fetchAgify, fetchGenderize, fetchNationalize } from "./fetchInternational"
import { computeNumerology } from "./computeNumerology"
import { getSaintData } from "./saintsCalendar"
import { buildCategorizedFacts } from "./buildFacts"
import { flattenFacts, pickWeightedFact } from "./getRandomFact"
import { capitalizeName } from "./normalize"
import type { CategorizedFacts, NameFactResult } from "./types"

const SEVEN_DAYS = 60 * 60 * 24 * 7

const buildFactsForName = unstable_cache(
  async (name: string): Promise<CategorizedFacts> => {
    const [
      btnResult,
      wikiResult,
      frenchResult,
      wikidataResult,
      agifyResult,
      nationalizeResult,
      genderizeResult,
    ] = await Promise.allSettled([
      fetchBehindTheName(name),
      fetchWikipedia(name),
      fetchFrenchStats(name),
      fetchWikidata(name),
      fetchAgify(name),
      fetchNationalize(name),
      fetchGenderize(name),
    ])

    const btn = btnResult.status === "fulfilled" ? btnResult.value : null
    const wiki = wikiResult.status === "fulfilled" ? wikiResult.value : null
    const french = frenchResult.status === "fulfilled" ? frenchResult.value : null
    const wikidata = wikidataResult.status === "fulfilled" ? wikidataResult.value : null
    const agify = agifyResult.status === "fulfilled" ? agifyResult.value : null
    const nationalize = nationalizeResult.status === "fulfilled" ? nationalizeResult.value : null
    const genderize = genderizeResult.status === "fulfilled" ? genderizeResult.value : null

    const numerology = computeNumerology(name)
    const saint = getSaintData(name)

    return buildCategorizedFacts({
      name,
      btn,
      wiki,
      french,
      wikidata,
      numerology,
      saint,
      agify,
      nationalize,
      genderize,
    })
  },
  ["name-facts-v2"],
  { revalidate: SEVEN_DAYS, tags: ["name-facts"] }
)

export async function getNameFact(name: string): Promise<NameFactResult> {
  const trimmed = name.trim()
  const display = capitalizeName(trimmed)

  if (!trimmed) {
    return { name: display, fact: "", totalFacts: 0 }
  }

  const cats = await buildFactsForName(trimmed)
  let fact = pickWeightedFact(cats)
  const total = flattenFacts(cats).length

  if (!fact) {
    fact = `${display} est un prénom plein d'histoire.`
  }

  return {
    name: display,
    fact,
    totalFacts: total,
  }
}
