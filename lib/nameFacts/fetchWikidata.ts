import type { WikidataData, WikidataCelebrity } from "./types"

const SPARQL_URL = "https://query.wikidata.org/sparql"

interface SparqlBinding {
  personLabel?: { value?: string }
  personDescription?: { value?: string }
}

interface SparqlResponse {
  results?: {
    bindings?: SparqlBinding[]
  }
}

export async function fetchWikidata(name: string): Promise<WikidataData | null> {
  try {
    const query = `
      SELECT ?person ?personLabel ?personDescription ?sitelinks WHERE {
        ?person wdt:P31 wd:Q5;
                wdt:P735 ?givenName.
        ?givenName rdfs:label "${name.replace(/"/g, "")}"@fr.
        ?person wikibase:sitelinks ?sitelinks.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
      }
      ORDER BY DESC(?sitelinks)
      LIMIT 12
    `

    const url = `${SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`
    const res = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "roue-noms/1.0 (https://github.com/jordantaillefer/roue-noms)",
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
    })

    if (!res.ok) return null
    const data = (await res.json()) as SparqlResponse
    const bindings = data.results?.bindings ?? []

    const celebrities: WikidataCelebrity[] = bindings
      .map((b) => ({
        label: b.personLabel?.value?.trim() ?? "",
        description: b.personDescription?.value?.trim(),
      }))
      .filter((c) => c.label.length > 0 && !/^Q\d+$/.test(c.label))

    if (celebrities.length === 0) return null
    return { celebrities }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] Wikidata fetch failed:", err)
    }
    return null
  }
}
