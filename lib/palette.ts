import { nameKey } from "./names"

export type Swatch = { id: string; bg: string; ink: string }

/** Teintes 925 de la palette illustrative DSFR + texte foncé de la même famille. */
export const PASTELS: readonly Swatch[] = [
  { id: "bleu", bg: "#E3E3FD", ink: "#000091" },
  { id: "menthe", bg: "#C3FAD5", ink: "#1F5C3A" },
  { id: "tuile", bg: "#FEE9E5", ink: "#8D3A2B" },
  { id: "tilleul", bg: "#FEF7DA", ink: "#5E5A2A" },
  { id: "glycine", bg: "#FEE7FC", ink: "#6E445A" },
  { id: "archipel", bg: "#C7F6FC", ink: "#00585E" },
  { id: "cafe-creme", bg: "#F7EBE5", ink: "#6B4532" },
  { id: "cumulus", bg: "#E6EEFE", ink: "#2F3E66" },
]

/** FNV-1a 32 bits. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Couleur dérivée du nom (stable d'une session à l'autre), décalée à la
 * teinte suivante si elle est identique au voisin précédent — ou, pour le
 * dernier nom, au premier (la roue boucle).
 */
export function colorsFor(names: readonly string[]): Swatch[] {
  const count = PASTELS.length
  const indexes: number[] = []

  names.forEach((name, i) => {
    const avoid = new Set<number>()
    if (i > 0) avoid.add(indexes[i - 1])
    if (i === names.length - 1 && names.length > 2) avoid.add(indexes[0])

    let index = hashString(nameKey(name)) % count
    for (let step = 0; step < count && avoid.has(index); step++) index = (index + 1) % count
    indexes.push(index)
  })

  return indexes.map((index) => PASTELS[index])
}

function channel(value: number): number {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const raw = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}
