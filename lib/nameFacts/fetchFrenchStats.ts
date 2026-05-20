import type { FrenchStatsData, YearlyCount } from "./types"
import { normalizeName } from "./normalize"

const OPENDATASOFT_URL =
  "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/demographyref-france-prenoms-departement-millesime/records"

interface OpenDataSoftAggRecord {
  birth_year?: string | number
  total?: string | number
}

interface OpenDataSoftResponse {
  total_count?: number
  results?: OpenDataSoftAggRecord[]
}

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR_RECENT = CURRENT_YEAR - 40

export async function fetchFrenchStats(name: string): Promise<FrenchStatsData | null> {
  const normalized = normalizeName(name)
  if (!normalized) return null

  try {
    const records = await fetchAggregated(normalized)
    if (records.length === 0) return null

    const yearlyAll: YearlyCount[] = records
      .map((r) => {
        const year = typeof r.birth_year === "number" ? r.birth_year : parseInt(String(r.birth_year ?? ""), 10)
        const count = typeof r.total === "number" ? r.total : parseInt(String(r.total ?? ""), 10)
        return { year, count }
      })
      .filter((y) => Number.isFinite(y.year) && Number.isFinite(y.count) && y.year >= 1900 && y.year <= 2100)
      .sort((a, b) => a.year - b.year)

    if (yearlyAll.length === 0) {
      return null
    }

    const firstYear = yearlyAll[0].year
    const yearly = yearlyAll.filter((y) => y.year >= MIN_YEAR_RECENT)

    const total40Years = yearly.reduce((sum, y) => sum + y.count, 0)
    const last10 = yearlyAll.filter((y) => y.year >= CURRENT_YEAR - 10)
    const total10Years = last10.reduce((sum, y) => sum + y.count, 0)
    const averagePerYear = yearly.length > 0 ? Math.round(total40Years / yearly.length) : 0

    let peakYear: number | null = null
    let peakCount = 0
    for (const y of yearlyAll) {
      if (y.count > peakCount) {
        peakCount = y.count
        peakYear = y.year
      }
    }

    const trend = computeTrend(yearlyAll)

    return {
      yearly,
      total40Years,
      total10Years,
      averagePerYear,
      peakYear,
      peakCount,
      firstYear,
      trend,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[nameFacts] French stats fetch failed:", err)
    }
    return null
  }
}

async function fetchAggregated(normalizedName: string): Promise<OpenDataSoftAggRecord[]> {
  const all: OpenDataSoftAggRecord[] = []
  const limit = 100
  let offset = 0

  while (offset < 300) {
    const params = new URLSearchParams({
      select: "birth_year,sum(birth_count) as total",
      where: `prenom="${normalizedName}"`,
      group_by: "birth_year",
      order_by: "birth_year",
      limit: String(limit),
      offset: String(offset),
    })
    const res = await fetch(`${OPENDATASOFT_URL}?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    })
    if (!res.ok) break
    const data = (await res.json()) as OpenDataSoftResponse
    const results = data.results ?? []
    all.push(...results)
    if (results.length < limit) break
    offset += limit
  }

  return all
}

function computeTrend(yearly: YearlyCount[]): "up" | "down" | "stable" | null {
  const last10 = yearly.slice(-10)
  if (last10.length < 4) return null
  const half = Math.floor(last10.length / 2)
  const firstHalf = last10.slice(0, half)
  const secondHalf = last10.slice(-half)
  const avg = (arr: YearlyCount[]) => arr.reduce((s, y) => s + y.count, 0) / arr.length
  const a = avg(firstHalf)
  const b = avg(secondHalf)
  if (a === 0 && b === 0) return null
  const change = (b - a) / Math.max(a, 1)
  if (change > 0.15) return "up"
  if (change < -0.15) return "down"
  return "stable"
}
