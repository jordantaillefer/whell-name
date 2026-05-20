import type { BehindTheNameData } from "./types"

const BTN_URL = "https://www.behindthename.com/api/lookup.json"

interface BTNResponseEntry {
  name?: string
  gender?: string
  usages?: Array<{ usage_code?: string; usage_full?: string; usage_gender?: string }>
  meaning?: string
  meaning_summary?: string
  origin?: string
  related_names?: string[]
  diminutive_names?: string[]
  feminine_forms?: string[]
  masculine_forms?: string[]
}

export async function fetchBehindTheName(name: string): Promise<BehindTheNameData | null> {
  const apiKey = process.env.BTN_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] BTN_API_KEY not set, skipping Behind the Name")
    }
    return null
  }

  try {
    const url = `${BTN_URL}?name=${encodeURIComponent(name)}&key=${encodeURIComponent(apiKey)}`
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } })
    if (!res.ok) return null
    const data: unknown = await res.json()

    if (!Array.isArray(data) || data.length === 0) return null
    const entry = data[0] as BTNResponseEntry

    return {
      origin: entry.origin,
      meaning: entry.meaning_summary ?? entry.meaning,
      usages: entry.usages?.map((u) => u.usage_full).filter((u): u is string => Boolean(u)),
      variants: entry.related_names,
      diminutives: entry.diminutive_names,
      feminineForms: entry.feminine_forms,
      masculineForms: entry.masculine_forms,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] Behind the Name fetch failed:", err)
    }
    return null
  }
}
