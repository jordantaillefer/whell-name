import { nameKey } from "./names"

export type Swatch = { id: string; bg: string; ink: string }

/**
 * Pastels inspirés de la palette illustrative DSFR, un cran plus saturés que
 * les teintes 925 pour rester lisibles sur fond blanc. Texte ≥ 6:1 sur chaque
 * fond. L'ordre alterne chaud / froid pour que deux teintes voisines dans la
 * liste restent bien différentes.
 */
export const PASTELS: readonly Swatch[] = [
  { id: "bleu-france", bg: "#CACAFB", ink: "#000091" },
  { id: "menthe", bg: "#B3F0E4", ink: "#0B544A" },
  { id: "tuile", bg: "#FDCFC4", ink: "#87301F" },
  { id: "tilleul", bg: "#F4E89B", ink: "#544A0C" },
  { id: "glycine", bg: "#F7C8F1", ink: "#6A275E" },
  { id: "archipel", bg: "#B4EBF5", ink: "#00525C" },
  { id: "tournesol", bg: "#FDDB9E", ink: "#6A4200" },
  { id: "emeraude", bg: "#BDF0C9", ink: "#155A30" },
  { id: "macaron", bg: "#FCCFD8", ink: "#8A2238" },
  { id: "cumulus", bg: "#C4DAFB", ink: "#1D4080" },
  { id: "bourgeon", bg: "#D8F2B0", ink: "#3A5710" },
  { id: "cafe-creme", bg: "#EBD9C3", ink: "#5C3F22" },
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
 * teinte suivante si elle est déjà prise — tant qu'il reste des teintes
 * libres — ou identique au voisin précédent, ou, pour le dernier nom, au
 * premier (la roue boucle).
 */
export function colorsFor(names: readonly string[]): Swatch[] {
  const count = PASTELS.length
  const indexes: number[] = []

  names.forEach((name, i) => {
    const avoid = new Set<number>(indexes.length < count ? indexes : [])
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
