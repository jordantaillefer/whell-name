export type DisplayMode = "wheel" | "grid" | "star"

/** Clé de comparaison : sans accents, sans casse, espaces normalisés. */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/** Libellé affiché : espaces normalisés, casse et accents conservés. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim()
}

export function splitInput(input: string): string[] {
  return input.split(",").map(cleanName).filter(Boolean)
}

export function mergeNames(
  current: readonly string[],
  incoming: readonly string[],
): { names: string[]; added: string[]; duplicates: string[] } {
  const seen = new Set(current.map(nameKey))
  const names = [...current]
  const added: string[] = []
  const duplicates: string[] = []

  for (const raw of incoming) {
    const label = cleanName(raw)
    if (!label) continue
    const key = nameKey(label)
    if (seen.has(key)) {
      duplicates.push(label)
      continue
    }
    seen.add(key)
    names.push(label)
    added.push(label)
  }

  return { names, added, duplicates }
}

export function removeName(names: readonly string[], name: string): string[] {
  const key = nameKey(name)
  return names.filter((n) => nameKey(n) !== key)
}

export function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

export function parseNamesParam(raw: string | null): string[] {
  if (!raw) return []
  return mergeNames([], raw.split(",")).names
}

export function parseMode(raw: string | null): DisplayMode {
  return raw === "grid" || raw === "star" ? raw : "wheel"
}

export function buildSearch(names: readonly string[], mode: DisplayMode): string {
  const params = new URLSearchParams()
  if (names.length > 0) params.set("names", names.join(","))
  if (mode !== "wheel") params.set("mode", mode)
  const search = params.toString()
  return search ? `?${search}` : ""
}

export function truncateLabel(name: string, max = 16): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name
}
