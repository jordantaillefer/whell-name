import type { AgifyData, GenderizeData, NationalizeData } from "./types"

const REVALIDATE = 60 * 60 * 24 * 30

export async function fetchAgify(name: string): Promise<AgifyData | null> {
  try {
    const res = await fetch(`https://api.agify.io/?name=${encodeURIComponent(name)}`, {
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { age?: number | null; count?: number }
    if (data.age == null || !data.count || data.count < 50) return null
    return { age: data.age, count: data.count }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] Agify fetch failed:", err)
    }
    return null
  }
}

export async function fetchNationalize(name: string): Promise<NationalizeData | null> {
  try {
    const res = await fetch(`https://api.nationalize.io/?name=${encodeURIComponent(name)}`, {
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      country?: Array<{ country_id?: string; probability?: number }>
    }
    const countries = (data.country ?? [])
      .filter((c): c is { country_id: string; probability: number } =>
        typeof c.country_id === "string" && typeof c.probability === "number"
      )
      .map((c) => ({ country_id: c.country_id, probability: c.probability }))
    if (countries.length === 0) return null
    return { countries }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] Nationalize fetch failed:", err)
    }
    return null
  }
}

export async function fetchGenderize(name: string): Promise<GenderizeData | null> {
  try {
    const res = await fetch(`https://api.genderize.io/?name=${encodeURIComponent(name)}`, {
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      gender?: "male" | "female" | null
      probability?: number
      count?: number
    }
    if (!data.gender || !data.probability || (data.count ?? 0) < 50) return null
    return { gender: data.gender, probability: data.probability }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] Genderize fetch failed:", err)
    }
    return null
  }
}
