export interface BehindTheNameData {
  origin?: string
  meaning?: string
  usages?: string[]
  variants?: string[]
  diminutives?: string[]
  feminineForms?: string[]
  masculineForms?: string[]
}

export interface WikipediaData {
  extract?: string
}

export interface YearlyCount {
  year: number
  count: number
}

export interface FrenchStatsData {
  yearly: YearlyCount[]
  total40Years: number
  total10Years: number
  averagePerYear: number
  peakYear: number | null
  peakCount: number
  firstYear: number | null
  trend: "up" | "down" | "stable" | null
}

export interface NameFactResult {
  name: string
  fact: string
  totalFacts: number
}
