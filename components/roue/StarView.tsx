"use client"

import { starPoints } from "@/lib/geometry"
import { truncateLabel } from "@/lib/names"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import styles from "./StarView.module.css"

const SIZE = 420
const C = SIZE / 2
const OUTER = C - 10
const INNER = OUTER * 0.4

type Props = { names: string[]; colors: Swatch[]; highlightIndex: number | null; winnerIndex: number | null }

export function StarView({ names, colors, highlightIndex, winnerIndex }: Props) {
  const count = names.length
  const points = starPoints(C, C, Math.max(count, 1), OUTER, INNER)
  const outline = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")} Z`
  const fontSize = count > 8 ? 14 : count > 5 ? 16 : 18

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn(styles.star, winnerIndex !== null && styles.won)}
      role="img"
      aria-label={`Étoile avec ${count} participants : ${names.join(", ")}`}
    >
      {count > 0 && (
        <>
          <path d={outline} className={styles.rimEdge} />
          <path d={outline} className={styles.rim} />
        </>
      )}
      {names.map((name, i) => {
        const swatch = colors[i]
        const corners = [points[i * 2], points[(i * 2 + 1) % points.length], { x: C, y: C }, points[(i * 2 - 1 + points.length) % points.length]]
        const d = `M ${corners.map((p) => `${p.x},${p.y}`).join(" L ")} Z`
        const angle = ((i * 360) / count - 90) * (Math.PI / 180)
        const highlighted = i === highlightIndex
        const win = i === winnerIndex
        return (
          <g key={name} className={cn(styles.branch, highlighted && styles.highlight, win && styles.winner)}>
            <path
              d={d}
              fill={swatch.bg}
              stroke={highlighted ? "var(--rn-blue)" : win ? swatch.ink : "var(--rn-wheel-ring)"}
              strokeWidth={highlighted ? 4 : 3}
              strokeLinejoin="round"
            />
            <text
              x={(C + Math.cos(angle) * OUTER * 0.45).toFixed(2)}
              y={(C + Math.sin(angle) * OUTER * 0.45).toFixed(2)}
              fill={swatch.ink}
              fontSize={fontSize}
              fontWeight={win ? 700 : 500}
              textAnchor="middle"
              dominantBaseline="middle"
              className={styles.label}
            >
              {truncateLabel(name, 12)}
              <title>{name}</title>
            </text>
          </g>
        )
      })}
      <circle cx={C} cy={C} r={10} className={styles.hub} />
    </svg>
  )
}
