export function normalizeName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
}

export function capitalizeName(name: string): string {
  return name
    .split(/([-\s])/)
    .map((part) => {
      if (part === "-" || part === " ") return part
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join("")
}

export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR")
}
