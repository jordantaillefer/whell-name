import type {
  AgifyData,
  BehindTheNameData,
  CategorizedFacts,
  FrenchStatsData,
  GenderizeData,
  NationalizeData,
  NumerologyData,
  SaintData,
  WikidataData,
  WikipediaData,
} from "./types"
import { capitalizeName, formatNumber } from "./normalize"
import { computeFunFacts } from "./computeFunFacts"
import { countryName } from "./countries"

interface BuildFactsInput {
  name: string
  btn: BehindTheNameData | null
  wiki: WikipediaData | null
  french: FrenchStatsData | null
  wikidata: WikidataData | null
  numerology: NumerologyData | null
  saint: SaintData | null
  agify: AgifyData | null
  nationalize: NationalizeData | null
  genderize: GenderizeData | null
}

function emptyCategorized(): CategorizedFacts {
  return {
    etymology: [],
    variants: [],
    popularity: [],
    yearly: [],
    wikipedia: [],
    cultural: [],
    celebrities: [],
    numerology: [],
    saint: [],
    international: [],
    fun: [],
  }
}

export function buildCategorizedFacts(input: BuildFactsInput): CategorizedFacts {
  const { name, btn, wiki, french, wikidata, numerology, saint, agify, nationalize, genderize } = input
  const display = capitalizeName(name)
  const cats = emptyCategorized()

  // Wikipedia
  if (wiki?.extract) {
    const firstSentence = extractFirstSentences(wiki.extract, 2)
    if (firstSentence) cats.wikipedia.push(firstSentence)
  }

  // Etymology
  if (btn?.origin) {
    cats.etymology.push(`${display} vient de ${btn.origin}.`)
    cats.etymology.push(`Le prénom ${display} est d'origine ${btn.origin.toLowerCase()}.`)
  }
  if (btn?.meaning) {
    cats.etymology.push(`${display} signifie « ${btn.meaning.trim() } ».`)
  }

  // Variants
  if (btn?.variants?.length) {
    for (const variant of btn.variants.slice(0, 8)) {
      cats.variants.push(`${variant} est une variante du prénom ${display}.`)
    }
  }
  if (btn?.diminutives?.length) {
    for (const dim of btn.diminutives.slice(0, 6)) {
      cats.variants.push(`${dim} est un diminutif courant de ${display}.`)
    }
  }
  if (btn?.feminineForms?.length) {
    for (const fem of btn.feminineForms.slice(0, 4)) {
      cats.variants.push(`La forme féminine de ${display} est ${fem}.`)
    }
  }
  if (btn?.masculineForms?.length) {
    for (const masc of btn.masculineForms.slice(0, 4)) {
      cats.variants.push(`La forme masculine de ${display} est ${masc}.`)
    }
  }

  // Cultural
  if (btn?.usages?.length) {
    const usages = btn.usages.slice(0, 5).join(", ")
    cats.cultural.push(`${display} est utilisé dans plusieurs cultures : ${usages}.`)
  }
  if (btn?.usages?.some((u) => /french|français/i.test(u))) {
    cats.cultural.push(`${display} est couramment utilisé en France, en Belgique et en Suisse.`)
  }

  // Popularity (agrégats)
  if (french) {
    if (french.total40Years > 0) {
      cats.popularity.push(
        `Au cours des 40 dernières années, ${formatNumber(french.total40Years)} enfants ont reçu le prénom ${display} en France.`
      )
    }
    if (french.total10Years > 0) {
      cats.popularity.push(
        `Au cours des 10 dernières années, ${formatNumber(french.total10Years)} enfants ont été prénommés ${display}.`
      )
    }
    if (french.averagePerYear > 0) {
      cats.popularity.push(
        `En moyenne, ${formatNumber(french.averagePerYear)} enfants par an reçoivent le prénom ${display}.`
      )
    }
    if (french.peakYear && french.peakCount > 0) {
      cats.popularity.push(`L'année la plus populaire pour ${display} fut ${french.peakYear}.`)
      cats.popularity.push(
        `En ${french.peakYear}, ${formatNumber(french.peakCount)} bébés ont été appelés ${display} en France.`
      )
    }
    if (french.firstYear) {
      cats.popularity.push(
        `Le prénom ${display} est présent dans les statistiques françaises depuis ${french.firstYear}.`
      )
    }
    if (french.trend === "up") {
      cats.popularity.push(`Le prénom ${display} est en hausse sur les dernières années.`)
    } else if (french.trend === "down") {
      cats.popularity.push(`Le prénom ${display} est en baisse sur les dernières années.`)
    } else if (french.trend === "stable") {
      cats.popularity.push(`Le prénom ${display} reste stable ces dernières années.`)
    }

    // Yearly (catégorie séparée pour limiter le poids)
    for (const { year, count } of french.yearly) {
      if (count <= 0) continue
      cats.yearly.push(`En ${year}, ${formatNumber(count)} enfants ont été appelés ${display} en France.`)
    }
  }

  // Celebrities (Wikidata)
  if (wikidata?.celebrities?.length) {
    const top = wikidata.celebrities.slice(0, 8)
    const names = top.map((c) => c.label)
    if (names.length >= 3) {
      cats.celebrities.push(
        `Parmi les personnalités prénommées ${display} : ${names.slice(0, 3).join(", ")}.`
      )
    }
    if (names.length >= 6) {
      cats.celebrities.push(
        `On compte aussi ${names.slice(3, 6).join(", ")} parmi les ${display} célèbres.`
      )
    }
    for (const c of top.slice(0, 5)) {
      if (c.description) {
        cats.celebrities.push(`${c.label} (${c.description}) porte également le prénom ${display}.`)
      }
    }
  }

  // Numérologie
  if (numerology) {
    cats.numerology.push(
      `En numérologie, ${display} correspond au chiffre ${numerology.number} : ${numerology.meaning}`
    )
  }

  // Saint
  if (saint) {
    cats.saint.push(`La fête du prénom ${display} est célébrée le ${saint.date}.`)
    cats.saint.push(`Chaque année, les ${display} sont à l'honneur le ${saint.date}.`)
  }

  // International (agify, nationalize, genderize)
  if (agify && agify.age > 0) {
    cats.international.push(
      `À travers le monde, l'âge moyen estimé des personnes prénommées ${display} est de ${agify.age} ans.`
    )
  }
  if (nationalize?.countries?.length) {
    const top3 = nationalize.countries.slice(0, 3)
    const names = top3.map((c) => countryName(c.country_id))
    if (names.length >= 1) {
      const first = top3[0]
      const pct = Math.round(first.probability * 100)
      cats.international.push(
        `${display} est particulièrement répandu en ${countryName(first.country_id)} (environ ${pct}% des porteurs).`
      )
    }
    if (names.length >= 2) {
      cats.international.push(
        `Les trois pays où ${display} est le plus présent sont : ${names.join(", ")}.`
      )
    }
  }
  if (genderize && genderize.probability >= 0.85) {
    const label = genderize.gender === "female" ? "féminin" : "masculin"
    const pct = Math.round(genderize.probability * 100)
    cats.international.push(
      `${display} est statistiquement un prénom ${label} dans ${pct}% des cas à l'international.`
    )
  }

  // Fun facts (locaux)
  cats.fun.push(...computeFunFacts(name))

  // Nettoyage + dédoublonnage par catégorie
  for (const key of Object.keys(cats) as (keyof CategorizedFacts)[]) {
    cats[key] = Array.from(
      new Set(
        cats[key]
          .map((f) => f.replace(/\s+/g, " ").trim())
          .filter((f) => f.length >= 15)
      )
    )
  }

  return cats
}

function extractFirstSentences(text: string, count: number): string | null {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (!cleaned) return null
  const parts = cleaned.split(/(?<=[.!?])\s+/)
  const picked = parts.slice(0, count).join(" ").trim()
  return picked.length >= 20 ? picked : cleaned.slice(0, 300)
}
