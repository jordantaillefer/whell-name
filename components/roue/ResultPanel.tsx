"use client"

import { useState, type CSSProperties, type Ref } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  Cross2Icon,
  InfoCircledIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
} from "@radix-ui/react-icons"
import type { NameFactState } from "@/hooks/useNameFact"
import type { SpeakingTimer } from "@/hooks/useSpeakingTimer"
import { getDailyHoroscope } from "@/lib/nameFacts/horoscopeTemplates"
import { SPEAKING_LIMIT_MS, formatCountdown, timerProgress, timerTone } from "@/lib/timer"
import { cn } from "@/lib/utils"
import styles from "./ResultPanel.module.css"

type Props = {
  selectedName: string | null
  participantCount: number
  drawing: boolean
  isFinale: boolean
  finalistName: string | null
  timer: SpeakingTimer
  fact: NameFactState
  onRemove: () => void
  onRemoveAndSpin: () => void
  onFinish: () => void
  onOpenParticipants: () => void
  /** Conteneur stable qui reçoit le focus quand la carte disparaît (retrait du nom). */
  rootRef?: Ref<HTMLDivElement>
}

const TONE_COLOR = { ok: "var(--accent)", warn: "var(--rn-warning)", danger: "var(--rn-error)" } as const

export function ResultPanel(props: Props) {
  const { selectedName, isFinale, rootRef } = props
  return (
    <div ref={rootRef} className={styles.root} tabIndex={-1} aria-label="Résultat du tirage">
      <p className="sr-only" aria-live="polite">
        {selectedName ? `${isFinale ? "Et pour finir" : "Au tour de"} ${selectedName}` : ""}
      </p>
      {selectedName ? (
        <SelectedCard key={selectedName} {...props} selectedName={selectedName} />
      ) : (
        <EmptyState {...props} />
      )}
    </div>
  )
}

function EmptyState({ participantCount, drawing, finalistName, onOpenParticipants }: Props) {
  if (drawing) {
    return (
      <div className={styles.empty}>
        <strong className={styles.emptyTitle}>Tirage en cours…</strong>
        Qui sera tiré au sort ?
      </div>
    )
  }
  if (finalistName) {
    return (
      <div className={styles.empty}>
        <strong className={styles.emptyTitle}>Plus qu'une personne</strong>
        Tout le monde est passé sauf {finalistName}. Lancez la finale pour clore le tour de table.
      </div>
    )
  }
  if (participantCount < 2) {
    return (
      <div className={styles.empty}>
        <strong className={styles.emptyTitle}>Ajoutez des participants pour commencer</strong>
        Il faut au moins 2 noms pour lancer un tirage.
        <button type="button" className={styles.emptyAction} onClick={onOpenParticipants}>
          <PlusIcon aria-hidden />
          Ajouter des participants
        </button>
      </div>
    )
  }
  return (
    <div className={styles.empty}>
      <strong className={styles.emptyTitle}>Prêt pour le tirage</strong>
      {participantCount} participants dans la roue. Lancez le tirage : le nom tiré, un minuteur de 2 minutes et une
      anecdote s'afficheront ici.
    </div>
  )
}

function SelectedCard({
  selectedName,
  participantCount,
  isFinale,
  timer,
  fact,
  onRemove,
  onRemoveAndSpin,
  onFinish,
}: Props & { selectedName: string }) {
  const [tab, setTab] = useState<"fact" | "horoscope">("fact")
  const factAvailable = fact.loading || fact.fact !== null
  const activeTab = factAvailable ? tab : "horoscope"
  const tone = timerTone(timer.elapsedMs)
  const countdown = formatCountdown(timer.elapsedMs)

  return (
    <section className={styles.card} aria-labelledby="result-name">
      <div className={styles.top}>
        <p className={styles.eyebrow}>{isFinale ? "Et pour finir…" : "Au tour de"}</p>
        <h2 id="result-name" className={styles.name}>
          <span className="sr-only">{selectedName}</span>
          {[...selectedName].map((char, i) => (
            <span key={i} className={styles.letter} style={{ "--i": i } as CSSProperties} aria-hidden>
              {char === " " ? " " : char}
            </span>
          ))}
        </h2>
      </div>

      <div className={styles.timer}>
        <div className={styles.timerRow}>
          <span className={styles.eyebrow}>Temps de parole</span>
          <span className={styles.clock} data-tone={tone}>
            {countdown}
          </span>
        </div>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Temps de parole restant"
          aria-valuemin={0}
          aria-valuemax={SPEAKING_LIMIT_MS / 1000}
          aria-valuenow={Math.max(0, Math.ceil((SPEAKING_LIMIT_MS - timer.elapsedMs) / 1000))}
          aria-valuetext={countdown}
        >
          <span
            className={styles.barFill}
            style={{ transform: `scaleX(${timerProgress(timer.elapsedMs)})`, background: TONE_COLOR[tone] }}
          />
        </div>
      </div>

      {factAvailable && (
        <div className={styles.tabs} role="tablist" aria-label="Pour aller plus loin">
          <button
            type="button"
            role="tab"
            id="tab-fact"
            aria-controls="result-extra"
            aria-selected={activeTab === "fact"}
            className={styles.tab}
            onClick={() => setTab("fact")}
          >
            <InfoCircledIcon aria-hidden />
            Le saviez-vous ?
          </button>
          <button
            type="button"
            role="tab"
            id="tab-horoscope"
            aria-controls="result-extra"
            aria-selected={activeTab === "horoscope"}
            className={styles.tab}
            onClick={() => setTab("horoscope")}
          >
            <StarIcon aria-hidden />
            Horoscope
          </button>
        </div>
      )}
      <div
        id="result-extra"
        role={factAvailable ? "tabpanel" : undefined}
        aria-labelledby={factAvailable ? (activeTab === "fact" ? "tab-fact" : "tab-horoscope") : undefined}
        className={styles.panel}
      >
        {activeTab === "fact" ? (
          fact.loading ? (
            <>
              <span className={styles.skeleton} />
              <span className={styles.skeleton} style={{ width: "70%" }} />
            </>
          ) : (
            <>
              <p>« {fact.fact} »</p>
              {fact.total > 1 && (
                <p className={styles.panelMeta}>
                  1 anecdote choisie parmi {fact.total.toLocaleString("fr-FR")} possibles.
                </p>
              )}
            </>
          )
        ) : (
          <>
            {!factAvailable && (
              <p className={styles.panelTitle}>
                <StarIcon aria-hidden />
                Horoscope du jour
              </p>
            )}
            <p>« {getDailyHoroscope(selectedName)} »</p>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={cn(styles.action, styles.pause)}
          onClick={timer.running ? timer.pause : timer.resume}
        >
          {timer.running ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
          {timer.running ? "Pause" : "Reprendre"}
        </button>
        {isFinale ? (
          <button type="button" className={cn(styles.action, styles.actionPrimary)} onClick={onFinish}>
            <CheckIcon aria-hidden />
            Terminer le tour de table
          </button>
        ) : participantCount > 2 ? (
          <>
            <button type="button" className={styles.action} onClick={onRemove}>
              <Cross2Icon aria-hidden />
              Retirer {selectedName}
            </button>
            <button type="button" className={cn(styles.action, styles.actionPrimary)} onClick={onRemoveAndSpin}>
              <ArrowRightIcon aria-hidden />
              Retirer et relancer
            </button>
          </>
        ) : (
          <button type="button" className={cn(styles.action, styles.actionPrimary)} onClick={onRemove}>
            <ArrowRightIcon aria-hidden />
            Retirer {selectedName}
          </button>
        )}
      </div>
    </section>
  )
}
