import type { WikipediaData } from "./types"

const WIKI_URL = "https://fr.wikipedia.org/w/api.php"

interface WikiPage {
  pageid?: number
  title?: string
  extract?: string
  missing?: string
}

interface WikiResponse {
  query?: {
    pages?: Record<string, WikiPage>
  }
}

export async function fetchWikipedia(name: string): Promise<WikipediaData | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      prop: "extracts",
      exintro: "true",
      explaintext: "true",
      titles: `${name} (prénom)`,
      format: "json",
      origin: "*",
      redirects: "1",
    })

    let res = await fetch(`${WIKI_URL}?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    })
    let data = res.ok ? ((await res.json()) as WikiResponse) : null
    let extract = pickExtract(data)

    if (!extract) {
      const params2 = new URLSearchParams({
        action: "query",
        prop: "extracts",
        exintro: "true",
        explaintext: "true",
        titles: name,
        format: "json",
        origin: "*",
        redirects: "1",
      })
      res = await fetch(`${WIKI_URL}?${params2.toString()}`, {
        next: { revalidate: 60 * 60 * 24 * 7 },
      })
      data = res.ok ? ((await res.json()) as WikiResponse) : null
      extract = pickExtract(data)
    }

    if (!extract) return null
    return { extract: extract.trim() }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] Wikipedia fetch failed:", err)
    }
    return null
  }
}

function pickExtract(data: WikiResponse | null): string | undefined {
  if (!data?.query?.pages) return undefined
  for (const page of Object.values(data.query.pages)) {
    if (page.missing !== undefined) continue
    if (page.extract && page.extract.length > 20) return page.extract
  }
  return undefined
}
