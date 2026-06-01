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

export interface WikidataCelebrity {
  label: string
  description?: string
}

export interface WikidataData {
  celebrities: WikidataCelebrity[]
}

export interface AgifyData {
  age: number
  count: number
}

export interface NationalizeCountry {
  country_id: string
  probability: number
}

export interface NationalizeData {
  countries: NationalizeCountry[]
}

export interface GenderizeData {
  gender: "male" | "female" | null
  probability: number
}

export interface NumerologyData {
  number: number
  meaning: string
}

export interface SaintData {
  date: string // ex. "15 août"
  saintName?: string
}

export type FactCategory =
  | "etymology"
  | "variants"
  | "popularity"
  | "yearly"
  | "wikipedia"
  | "cultural"
  | "celebrities"
  | "numerology"
  | "saint"
  | "international"
  | "fun"

export interface CategorizedFacts {
  etymology: string[]
  variants: string[]
  popularity: string[]
  yearly: string[]
  wikipedia: string[]
  cultural: string[]
  celebrities: string[]
  numerology: string[]
  saint: string[]
  international: string[]
  fun: string[]
}

export interface NameFactResult {
  name: string
  fact: string
  totalFacts: number
}
