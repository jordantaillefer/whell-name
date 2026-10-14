export const SPIN_DURATION_MS = 4200
export const REDUCED_SPIN_DURATION_MS = 300
export const JUMP_COUNT = 33

export function normalizeAngle(deg: number): number {
  const angle = ((deg % 360) + 360) % 360
  return angle === 0 ? 0 : angle
}

export function segmentAngle(count: number): number {
  return 360 / count
}

/** Centre de la part `index` au repos ; la part 0 est sous le pointeur (−90°). */
export function segmentCenter(index: number, count: number): number {
  return -90 + index * segmentAngle(count)
}

/** Rotation absolue qui amène `index` sous le pointeur après 5 à 7 tours, avec un léger décalage. */
export function targetRotation(current: number, index: number, count: number, rng: () => number = Math.random): number {
  const seg = segmentAngle(count)
  const jitter = (rng() - 0.5) * 0.6 * seg
  const turns = 5 + Math.floor(rng() * 3)
  const delta = normalizeAngle(-index * seg + jitter - current)
  return current + turns * 360 + delta
}

export function landedIndex(rotation: number, count: number): number {
  return Math.round(normalizeAngle(-rotation) / segmentAngle(count)) % count
}

/** Un libellé radial sur la moitié gauche se lirait à l'envers : on le retourne. */
export function labelNeedsFlip(index: number, count: number, rotation: number): boolean {
  const angle = normalizeAngle(segmentCenter(index, count) + rotation)
  return angle > 90 && angle < 270
}

/** Suite de cases surlignées pour la grille et l'étoile, terminée par `finalIndex`. */
export function jumpSequence(count: number, finalIndex: number, jumps = JUMP_COUNT, rng: () => number = Math.random): number[] {
  if (count < 1) return []
  const sequence: number[] = []
  for (let step = 0; step < jumps - 1; step++) {
    const avoid = new Set<number>()
    if (sequence.length > 0) avoid.add(sequence[sequence.length - 1])
    if (step === jumps - 2) avoid.add(finalIndex)
    let next = Math.floor(rng() * count)
    for (let k = 0; k < count && avoid.has(next); k++) next = (next + 1) % count
    sequence.push(next)
  }
  sequence.push(finalIndex)
  return sequence
}

/** Délai avant le saut `step` : de 70 ms à 260 ms, en ralentissant. */
export function jumpDelay(step: number, total: number): number {
  if (total <= 1) return 0
  const t = step / (total - 1)
  return Math.round(70 + 190 * t * t)
}
