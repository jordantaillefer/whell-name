import type { BehindTheNameData, FrenchStatsData, WikipediaData } from "./types"
import { capitalizeName, formatNumber } from "./normalize"

interface BuildFactsInput {
  name: string
  btn: BehindTheNameData | null
  wiki: WikipediaData | null
  french: FrenchStatsData | null
}

export function buildFacts({ name, btn, wiki, french }: BuildFactsInput): string[] {
  const display = capitalizeName(name)
  const facts: string[] = []

  if (wiki?.extract) {
    const firstSentence = extractFirstSentences(wiki.extract, 2)
    if (firstSentence) facts.push(firstSentence)
  }

  if (btn?.origin) {
    facts.push(`${display} vient de ${btn.origin}.`)
    facts.push(`Le prénom ${display} est d'origine ${btn.origin.toLowerCase()}.`)
  }

  if (btn?.meaning) {
    const meaning = btn.meaning.trim()
    facts.push(`${display} signifie « ${meaning} ».`)
  }

  if (btn?.variants?.length) {
    for (const variant of btn.variants.slice(0, 8)) {
      facts.push(`${variant} est une variante du prénom ${display}.`)
    }
  }

  if (btn?.diminutives?.length) {
    for (const dim of btn.diminutives.slice(0, 6)) {
      facts.push(`${dim} est un diminutif courant de ${display}.`)
    }
  }

  if (btn?.feminineForms?.length) {
    for (const fem of btn.feminineForms.slice(0, 4)) {
      facts.push(`La forme féminine de ${display} est ${fem}.`)
    }
  }

  if (btn?.masculineForms?.length) {
    for (const masc of btn.masculineForms.slice(0, 4)) {
      facts.push(`La forme masculine de ${display} est ${masc}.`)
    }
  }

  if (btn?.usages?.length) {
    const usages = btn.usages.slice(0, 5).join(", ")
    facts.push(`${display} est utilisé dans plusieurs cultures : ${usages}.`)
  }

  if (french) {
    if (french.total40Years > 0) {
      facts.push(
        `Au cours des 40 dernières années, ${formatNumber(french.total40Years)} enfants ont reçu le prénom ${display} en France.`
      )
    }
    if (french.total10Years > 0) {
      facts.push(
        `Au cours des 10 dernières années, ${formatNumber(french.total10Years)} enfants ont été prénommés ${display}.`
      )
    }
    if (french.averagePerYear > 0) {
      facts.push(
        `En moyenne, ${formatNumber(french.averagePerYear)} enfants par an reçoivent le prénom ${display}.`
      )
    }
    if (french.peakYear && french.peakCount > 0) {
      facts.push(`L'année la plus populaire pour ${display} fut ${french.peakYear}.`)
      facts.push(
        `En ${french.peakYear}, ${formatNumber(french.peakCount)} bébés ont été appelés ${display} en France.`
      )
    }
    if (french.firstYear) {
      facts.push(
        `Le prénom ${display} est présent dans les statistiques françaises depuis ${french.firstYear}.`
      )
    }
    if (french.trend === "up") {
      facts.push(`Le prénom ${display} est en hausse sur les dernières années.`)
    } else if (french.trend === "down") {
      facts.push(`Le prénom ${display} est en baisse sur les dernières années.`)
    } else if (french.trend === "stable") {
      facts.push(`Le prénom ${display} reste stable ces dernières années.`)
    }

    for (const { year, count } of french.yearly) {
      if (count <= 0) continue
      facts.push(`En ${year}, ${formatNumber(count)} enfants ont été appelés ${display} en France.`)
    }
  }

  if (btn?.usages?.some((u) => /french|français/i.test(u))) {
    facts.push(`${display} est couramment utilisé en France, en Belgique et en Suisse.`)
  }

  const cleaned = facts
    .map((f) => f.replace(/\s+/g, " ").trim())
    .filter((f) => f.length >= 15)

  const unique = Array.from(new Set(cleaned))

  if (unique.length === 0) {
    unique.push(`${display} est un prénom plein d'histoire.`)
  }

  return unique
}

function extractFirstSentences(text: string, count: number): string | null {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (!cleaned) return null
  const parts = cleaned.split(/(?<=[.!?])\s+/)
  const picked = parts.slice(0, count).join(" ").trim()
  return picked.length >= 20 ? picked : cleaned.slice(0, 300)
}
