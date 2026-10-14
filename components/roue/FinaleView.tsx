import type { CSSProperties } from "react"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import styles from "./FinaleView.module.css"

export const FINALE_SPIN_MS = 1200

type Props = { name: string; swatch: Swatch; stage: "ready" | "spinning" | "revealed" }

export function FinaleView({ name, swatch, stage }: Props) {
  const revealed = stage === "revealed"
  return (
    <div
      className={cn(styles.finale, styles[stage])}
      style={{ "--fin-bg": swatch.bg, "--fin-ink": swatch.ink } as CSSProperties}
    >
      {revealed && <span className={styles.rays} aria-hidden />}
      <p className={styles.eyebrow}>{revealed ? "Et pour finir…" : "Dernière personne en lice"}</p>
      <div className={styles.discWrap}>
        {!revealed && (
          <svg className={styles.pointer} viewBox="0 0 30 38" aria-hidden>
            <path d="M15 37 5.17 19.88A12 12 0 1 1 24.83 19.88Z" />
            <circle cx="15" cy="13" r="4.5" />
          </svg>
        )}
        <div className={styles.disc}>
          <span className={styles.discName}>{revealed ? name.charAt(0).toUpperCase() : name}</span>
        </div>
      </div>
      {revealed && <p className={styles.bigName}>{name}</p>}
    </div>
  )
}
