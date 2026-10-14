export type Point = { x: number; y: number }

const round = (n: number) => Number(n.toFixed(3))

export function polar(radius: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) }
}

/** Part de disque centrée en (0, 0), angles en degrés (repère SVG). */
export function wedgePath(radius: number, startDeg: number, endDeg: number): string {
  const a = polar(radius, startDeg)
  const b = polar(radius, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M0 0L${round(a.x)} ${round(a.y)}A${radius} ${radius} 0 ${large} 1 ${round(b.x)} ${round(b.y)}Z`
}

/** Pointes (rayon `outer`) et creux (rayon `inner`) alternés, première pointe en haut. */
export function starPoints(cx: number, cy: number, branches: number, outer: number, inner: number): Point[] {
  const points: Point[] = []
  const step = (Math.PI * 2) / branches
  for (let i = 0; i < branches; i++) {
    const tip = i * step - Math.PI / 2
    points.push({ x: cx + Math.cos(tip) * outer, y: cy + Math.sin(tip) * outer })
    const hollow = tip + step / 2
    points.push({ x: cx + Math.cos(hollow) * inner, y: cy + Math.sin(hollow) * inner })
  }
  return points
}

export function labelFontSize(count: number): number {
  if (count > 12) return 13
  if (count > 8) return 15
  return 18
}
