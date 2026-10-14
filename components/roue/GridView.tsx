"use client"

import type { CSSProperties } from "react"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import styles from "./GridView.module.css"

type Props = { names: string[]; colors: Swatch[]; highlightIndex: number | null; winnerIndex: number | null }

export function GridView({ names, colors, highlightIndex, winnerIndex }: Props) {
  const columns = Math.ceil(Math.sqrt(Math.max(names.length, 1)))
  return (
    <ul
      className={cn(styles.grid, winnerIndex !== null && styles.won)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-label={`Grille de ${names.length} participants`}
    >
      {names.map((name, i) => (
        <li
          key={name}
          className={cn(styles.tile, i === highlightIndex && styles.highlight, i === winnerIndex && styles.winner)}
          style={{ "--tile-bg": colors[i].bg, "--tile-ink": colors[i].ink } as CSSProperties}
        >
          <span className={styles.name} title={name}>{name}</span>
        </li>
      ))}
    </ul>
  )
}
