"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { useDraw } from "@/hooks/useDraw"
import { useNameFact } from "@/hooks/useNameFact"
import { useNameHistory } from "@/hooks/useNameHistory"
import { useNamesUrlState } from "@/hooks/useNamesUrlState"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useSessionLog } from "@/hooks/useSessionLog"
import { useSpeakingTimer } from "@/hooks/useSpeakingTimer"
import { burstConfetti, rainConfetti } from "@/lib/confetti"
import { mergeNames, nameKey, removeName, type DisplayMode } from "@/lib/names"
import { PASTELS, colorsFor } from "@/lib/palette"
import { cn } from "@/lib/utils"
import { AppHeader } from "./AppHeader"
import { AuraBackground } from "./AuraBackground"
import { FINALE_SPIN_MS, FinaleView } from "./FinaleView"
import { GridView } from "./GridView"
import { ModeSwitch } from "./ModeSwitch"
import { ParticipantsDrawer } from "./ParticipantsDrawer"
import { RecapView } from "./RecapView"
import { ResultPanel } from "./ResultPanel"
import { SpinButton } from "./SpinButton"
import { StarView } from "./StarView"
import { WheelView } from "./WheelView"
import styles from "./NameWheelApp.module.css"

type Stage = "play" | "finale-spinning" | "finale" | "recap"

const MODE_TARGET: Record<DisplayMode, string> = { wheel: "la roue", grid: "la grille", star: "l'étoile" }

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("input, textarea, select, button, a, [contenteditable='true'], [role='radio'], [role='tab']") !== null
  )
}

function confettiColors(bg: string, ink: string): string[] {
  return [bg, ink, "#000091", ...PASTELS.map((p) => p.bg)]
}

export function NameWheelApp() {
  const { names, mode, setNames, setMode } = useNamesUrlState()
  const colors = useMemo(() => colorsFor(names), [names])
  const reducedMotion = usePrefersReducedMotion()
  const history = useNameHistory(names)
  const { recordAdded, lastList } = history
  const timer = useSpeakingTimer()
  const { start: startTimer, reset: resetTimer, read: readTimer } = timer
  const log = useSessionLog()
  const { record, clear: clearLog, entries } = log
  const [selected, setSelected] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>("play")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerOpenerRef = useRef<HTMLElement | null>(null)
  const openParticipants = useCallback(() => {
    drawerOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setDrawerOpen(true)
  }, [])
  const appRef = useRef<HTMLDivElement>(null)
  const drawAreaRef = useRef<HTMLDivElement>(null)
  const stopRainRef = useRef<(() => void) | null>(null)
  const fact = useNameFact(selected)

  useEffect(() => () => stopRainRef.current?.(), [])

  const handleLanded = useCallback(
    (index: number, drawn: string[]) => {
      setSelected(drawn[index])
      startTimer()
      const app = appRef.current
      const area = drawAreaRef.current
      if (!app || !area || reducedMotion) return
      const a = app.getBoundingClientRect()
      const r = area.getBoundingClientRect()
      const swatch = colorsFor(drawn)[index]
      burstConfetti(app, { x: r.left - a.left + r.width / 2, y: r.top - a.top + 12 }, confettiColors(swatch.bg, swatch.ink))
    },
    [startTimer, reducedMotion],
  )

  const draw = useDraw({ mode, reducedMotion, onLanded: handleLanded })
  const { start: startDraw, reset: resetDraw, drawing } = draw

  const selectedIndex = selected === null ? -1 : names.findIndex((n) => nameKey(n) === nameKey(selected))
  const winnerIndex = selectedIndex >= 0 ? selectedIndex : null
  const selectedSwatch = winnerIndex !== null ? colors[winnerIndex] : null
  const finaleReady = stage === "play" && names.length === 1 && entries.length > 0 && selected === null && !drawing
  const inFinale = stage === "finale-spinning" || stage === "finale"

  const launch = useCallback(() => {
    if (names.length < 2 || drawing) return
    resetTimer()
    setSelected(null)
    startDraw(names)
  }, [names, drawing, resetTimer, startDraw])

  const launchFinale = useCallback(() => {
    if (!finaleReady) return
    const finalist = names[0]
    setStage("finale-spinning")
    window.setTimeout(
      () => {
        setStage("finale")
        setSelected(finalist)
        startTimer()
        if (appRef.current && !reducedMotion) {
          const swatch = colorsFor([finalist])[0]
          stopRainRef.current = rainConfetti(appRef.current, confettiColors(swatch.bg, swatch.ink), 3000)
        }
      },
      reducedMotion ? 0 : FINALE_SPIN_MS,
    )
  }, [finaleReady, names, startTimer, reducedMotion])

  const removeSelected = useCallback(
    (thenSpin: boolean) => {
      if (!selected) return
      record(selected, readTimer())
      resetTimer()
      const next = removeName(names, selected)
      setSelected(null)
      setNames(next)
      if (thenSpin && next.length >= 2) window.setTimeout(() => startDraw(next), 50)
    },
    [selected, names, record, readTimer, resetTimer, setNames, startDraw],
  )

  const finishRound = useCallback(() => {
    if (!selected) return
    record(selected, readTimer())
    resetTimer()
    stopRainRef.current?.()
    setNames(removeName(names, selected))
    setSelected(null)
    setStage("recap")
  }, [selected, names, record, readTimer, resetTimer, setNames])

  const replay = useCallback(() => {
    const again = mergeNames([], entries.map((e) => e.name)).names
    clearLog()
    resetDraw()
    setStage("play")
    setNames(again)
  }, [entries, clearLog, resetDraw, setNames])

  const newList = useCallback(() => {
    clearLog()
    resetDraw()
    setStage("play")
    setNames([])
    drawerOpenerRef.current = null
    setDrawerOpen(true)
  }, [clearLog, resetDraw, setNames])

  const addNames = useCallback(
    (labels: string[]) => {
      const result = mergeNames(names, labels)
      if (result.added.length > 0) {
        setNames(result.names)
        recordAdded(result.added)
      }
      return { added: result.added, duplicates: result.duplicates }
    },
    [names, setNames, recordAdded],
  )

  const removeFromDrawer = useCallback(
    (name: string) => {
      if (selected && nameKey(name) === nameKey(selected)) {
        if (stage === "finale") finishRound()
        else removeSelected(false)
        return
      }
      setNames(removeName(names, name))
    },
    [selected, stage, names, finishRound, removeSelected, setNames],
  )

  const clearNames = useCallback(() => {
    resetTimer()
    setSelected(null)
    setNames([])
  }, [resetTimer, setNames])

  // Les noms arrivés par un lien partagé comptent comme une utilisation (une fois par chargement)
  const initialNamesRecorded = useRef(false)
  useEffect(() => {
    if (!history.available || initialNamesRecorded.current) return
    initialNamesRecorded.current = true
    if (names.length > 0) recordAdded(names)
  }, [history.available, names, recordAdded])

  const resumeLastList = useCallback(() => {
    if (lastList) addNames(lastList.names)
  }, [lastList, addNames])

  const primary = finaleReady ? launchFinale : launch
  const primaryRef = useRef(primary)
  useEffect(() => {
    primaryRef.current = stage === "play" ? primary : () => {}
  }, [primary, stage])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || drawerOpen || isInteractiveTarget(event.target)) return
      event.preventDefault()
      primaryRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [drawerOpen])

  const winStyle = selectedSwatch
    ? ({ "--win": selectedSwatch.bg, "--win-ink": selectedSwatch.ink } as CSSProperties)
    : undefined
  const spinLabel = finaleReady
    ? "Lancer la finale"
    : drawing
      ? "Tirage en cours…"
      : `${selected ? "Relancer" : "Lancer"} ${MODE_TARGET[mode]}`
  const spinHint = finaleReady ? (
    <>
      Dernière personne en lice · <kbd>Espace</kbd>
    </>
  ) : names.length < 2 ? (
    "Ajoutez au moins 2 participants"
  ) : (
    <>
      ou appuyez sur <kbd>Espace</kbd>
    </>
  )

  return (
    <div ref={appRef} className={cn(styles.app, selected && styles.won)} style={winStyle}>
      <AuraBackground />
      <AppHeader names={names} colors={colors} onOpenParticipants={openParticipants} />

      <main className={cn(styles.stage, stage === "recap" && styles.stageSingle)}>
        {stage === "recap" ? (
          <RecapView entries={entries} onReplay={replay} onNewList={newList} />
        ) : (
          <>
            <div className={styles.drawCol}>
              <ModeSwitch value={mode} onChange={setMode} disabled={drawing || inFinale} />
              <div ref={drawAreaRef} className={styles.drawArea}>
                <span className={styles.glow} aria-hidden />
                {finaleReady || inFinale ? (
                  <FinaleView
                    name={names[0] ?? selected ?? ""}
                    swatch={colors[0] ?? PASTELS[0]}
                    stage={stage === "finale" ? "revealed" : stage === "finale-spinning" ? "spinning" : "ready"}
                  />
                ) : (
                  <>
                    {mode === "wheel" && (
                      <WheelView
                        names={names}
                        colors={colors}
                        rotation={draw.rotation}
                        animate={draw.animateRotation}
                        durationMs={draw.durationMs}
                        spinning={drawing}
                        winnerIndex={winnerIndex}
                      />
                    )}
                    {mode === "grid" && (
                      <GridView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
                    )}
                    {mode === "star" && (
                      <StarView names={names} colors={colors} highlightIndex={draw.highlightIndex} winnerIndex={winnerIndex} />
                    )}
                  </>
                )}
              </div>
              {stage === "play" && (
                <SpinButton
                  label={spinLabel}
                  icon={finaleReady ? "finale" : "spin"}
                  busy={drawing}
                  pulse={finaleReady}
                  disabled={!finaleReady && (names.length < 2 || drawing)}
                  onClick={primary}
                  hint={spinHint}
                />
              )}
            </div>

            <ResultPanel
              selectedName={selected}
              participantCount={names.length}
              drawing={drawing || stage === "finale-spinning"}
              isFinale={stage === "finale"}
              finalistName={finaleReady ? names[0] : null}
              timer={timer}
              fact={fact}
              onRemove={() => removeSelected(false)}
              onRemoveAndSpin={() => removeSelected(true)}
              onFinish={finishRound}
              onOpenParticipants={openParticipants}
            />
          </>
        )}
      </main>

      <ParticipantsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        names={names}
        colors={colors}
        history={history}
        onAdd={addNames}
        onRemove={removeFromDrawer}
        onClear={clearNames}
        onResumeLastList={resumeLastList}
        returnFocusRef={drawerOpenerRef}
      />
    </div>
  )
}
