"use client"

import type { CSSProperties, Ref } from "react"
import { labelFontSize, polar, wedgePath } from "@/lib/geometry"
import { truncateLabel } from "@/lib/names"
import type { Swatch } from "@/lib/palette"
import { labelNeedsFlip, segmentAngle, segmentCenter } from "@/lib/spin"
import { cn } from "@/lib/utils"
import styles from "./WheelView.module.css"

const R = 196

type Props = {
  names: string[]
  colors: Swatch[]
  rotation: number
  animate: boolean
  durationMs: number
  spinning: boolean
  winnerIndex: number | null
  svgRef?: Ref<SVGSVGElement>
}

export function WheelView({ names, colors, rotation, animate, durationMs, spinning, winnerIndex, svgRef }: Props) {
  const count = names.length
  const seg = count > 0 ? segmentAngle(count) : 360
  const fontSize = labelFontSize(count)
  const wheelStyle: CSSProperties = {
    transform: `rotate(${rotation}deg)`,
    transition: animate ? `transform ${durationMs}ms cubic-bezier(.12,.72,.1,1)` : "none",
  }

  return (
    <div className={cn(styles.wrap, spinning && styles.spinning, winnerIndex !== null && styles.won)}>
      <svg
        ref={svgRef}
        className={styles.wheel}
        viewBox="-210 -210 420 420"
        style={wheelStyle}
        role="img"
        aria-label={count ? `Roue avec ${count} participants : ${names.join(", ")}` : "Roue vide"}
      >
        <circle r={206} className={styles.rim} />
        {count === 0 && (
          <>
            <circle r={R} className={styles.empty} />
            <text className={styles.emptyText} textAnchor="middle" y={-70}>
              Ajoutez des participants
            </text>
          </>
        )}
        {names.map((name, i) => {
          const center = segmentCenter(i, count)
          const swatch = colors[i]
          const win = i === winnerIndex
          const offset = win ? polar(12, center) : null
          return (
            <g
              key={name}
              className={cn(styles.segment, win && styles.winner)}
              style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(1.04)` } : undefined}
            >
              {count === 1 ? (
                <circle r={R} fill={swatch.bg} />
              ) : (
                <path
                  d={wedgePath(R, center - seg / 2, center + seg / 2)}
                  fill={swatch.bg}
                  stroke={win ? swatch.ink : "var(--rn-wheel-ring)"}
                  strokeWidth={3}
                />
              )}
              <g transform={`rotate(${center}) translate(${R * 0.64} 0)`}>
                <text
                  className={cn(styles.label, !spinning && labelNeedsFlip(i, count, rotation) && styles.flip)}
                  fill={swatch.ink}
                  fontSize={fontSize}
                  fontWeight={win ? 700 : 500}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {truncateLabel(name)}
                  <title>{name}</title>
                </text>
              </g>
            </g>
          )
        })}
        <circle r={44} className={styles.hubOuter} />
        <circle r={30} className={styles.hubInner} />
        <circle r={9} className={styles.hubDot} />
      </svg>
      <svg className={styles.pointer} viewBox="0 0 30 38" aria-hidden>
        <path d="M15 37 3.2 15.5A13 13 0 1 1 26.8 15.5Z" />
        <circle cx="15" cy="13" r="4.5" />
      </svg>
    </div>
  )
}
