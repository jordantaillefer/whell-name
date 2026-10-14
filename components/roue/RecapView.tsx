import { useEffect, useRef, type CSSProperties } from "react"
import { ReloadIcon } from "@radix-ui/react-icons"
import { colorsFor } from "@/lib/palette"
import { sessionStats, type PassEntry } from "@/lib/sessionLog"
import { SPEAKING_LIMIT_MS, formatDuration } from "@/lib/timer"
import { cn } from "@/lib/utils"
import styles from "./RecapView.module.css"

type Props = { entries: PassEntry[]; onReplay: () => void; onNewList: () => void }

export function RecapView({ entries, onReplay, onNewList }: Props) {
  const colors = colorsFor(entries.map((e) => e.name))
  const stats = sessionStats(entries)
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Le bouton « Terminer le tour de table » disparaît : on amène le focus sur le récap
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <section className={styles.recap} aria-labelledby="recap-title">
      <p className={styles.eyebrow}>Tour de table terminé</p>
      <h2 id="recap-title" ref={titleRef} tabIndex={-1} className={styles.title}>
        Tout le monde est passé <span aria-hidden>🎉</span>
      </h2>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>participants</dt>
          <dd>{stats.count}</dd>
        </div>
        <div className={styles.stat}>
          <dt>durée totale</dt>
          <dd>{formatDuration(stats.totalMs)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>moyenne</dt>
          <dd>{formatDuration(stats.averageMs)}</dd>
        </div>
      </dl>
      <ol className={styles.timeline} aria-label="Ordre de passage">
        {entries.map((entry, i) => {
          const over = entry.durationMs > SPEAKING_LIMIT_MS
          return (
            <li
              key={`${entry.name}-${i}`}
              className={cn(styles.row, over && styles.over)}
              style={{ "--i": i } as CSSProperties}
            >
              <span className={styles.rank}>{i + 1}</span>
              <span
                className={styles.dot}
                style={{ background: colors[i].bg, boxShadow: `inset 0 0 0 1px ${colors[i].ink}55` }}
                aria-hidden
              />
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.time}>
                {formatDuration(entry.durationMs)}
                {over && <span className="sr-only"> (au-delà de 2 minutes)</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onReplay}>
          <ReloadIcon aria-hidden />
          Rejouer avec les mêmes
        </button>
        <button type="button" className={styles.secondary} onClick={onNewList}>
          Nouvelle liste
        </button>
      </div>
    </section>
  )
}
