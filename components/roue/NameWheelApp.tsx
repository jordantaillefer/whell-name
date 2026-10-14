"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { useDraw } from "@/hooks/useDraw"
import { useNameFact } from "@/hooks/useNameFact"
import { useNameHistory } from "@/hooks/useNameHistory"
import { useNamesUrlState } from "@/hooks/useNamesUrlState"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useSessionLog } from "@/hooks/useSessionLog"
import { useSpeakingTimer } from "@/hooks/useSpeakingTimer"
import { burstConfetti } from "@/lib/confetti"
import { mergeNames, nameKey, removeName, type DisplayMode } from "@/lib/names"
import { PASTELS, colorsFor } from "@/lib/palette"
import { cn } from "@/lib/utils"
import { AppHeader } from "./AppHeader"
import { AuraBackground } from "./AuraBackground"
import { GridView } from "./GridView"
import { ModeSwitch } from "./ModeSwitch"
import { ParticipantsDrawer } from "./ParticipantsDrawer"
import { ResultPanel } from "./ResultPanel"
import { SpinButton } from "./SpinButton"
import { StarView } from "./StarView"
import { WheelView } from "./WheelView"
import styles from "./NameWheelApp.module.css"

const MODE_TARGET: Record<DisplayMode, string> = { wheel: "la roue", grid: "la grille", star: "l'étoile" }

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("input, textarea, select, button, a, [contenteditable='true'], [role='radio'], [role='tab']") !== null
  )
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
  const { record } = log
  const [selected, setSelected] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerOpenerRef = useRef<HTMLElement | null>(null)
  const openParticipants = useCallback(() => {
    drawerOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setDrawerOpen(true)
  }, [])
  const appRef = useRef<HTMLDivElement>(null)
  const drawAreaRef = useRef<HTMLDivElement>(null)
  const fact = useNameFact(selected)

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
      burstConfetti(app, { x: r.left - a.left + r.width / 2, y: r.top - a.top + 12 }, [
        swatch.bg,
        swatch.ink,
        "#000091",
        ...PASTELS.map((p) => p.bg),
      ])
    },
    [startTimer, reducedMotion],
  )

  const draw = useDraw({ mode, reducedMotion, onLanded: handleLanded })
  const { start: startDraw, drawing } = draw

  const selectedIndex = selected === null ? -1 : names.findIndex((n) => nameKey(n) === nameKey(selected))
  const winnerIndex = selectedIndex >= 0 ? selectedIndex : null
  const selectedSwatch = winnerIndex !== null ? colors[winnerIndex] : null

  const launch = useCallback(() => {
    if (names.length < 2 || drawing) return
    resetTimer()
    setSelected(null)
    startDraw(names)
  }, [names, drawing, resetTimer, startDraw])

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
        removeSelected(false)
        return
      }
      setNames(removeName(names, name))
    },
    [selected, names, removeSelected, setNames],
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

  const primaryRef = useRef(launch)
  useEffect(() => {
    primaryRef.current = launch
  }, [launch])

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
  const spinLabel = drawing ? "Tirage en cours…" : `${selected ? "Relancer" : "Lancer"} ${MODE_TARGET[mode]}`

  return (
    <div ref={appRef} className={cn(styles.app, selected && styles.won)} style={winStyle}>
      <AuraBackground />
      <AppHeader names={names} colors={colors} onOpenParticipants={openParticipants} />

      <main className={styles.stage}>
        <div className={styles.drawCol}>
          <ModeSwitch value={mode} onChange={setMode} disabled={drawing} />
          <div ref={drawAreaRef} className={styles.drawArea}>
            <span className={styles.glow} aria-hidden />
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
          </div>
          <SpinButton
            label={spinLabel}
            icon="spin"
            busy={drawing}
            disabled={names.length < 2 || drawing}
            onClick={launch}
            hint={
              names.length < 2 ? (
                "Ajoutez au moins 2 participants"
              ) : (
                <>
                  ou appuyez sur <kbd>Espace</kbd>
                </>
              )
            }
          />
        </div>

        <ResultPanel
          selectedName={selected}
          participantCount={names.length}
          drawing={drawing}
          isFinale={false}
          finalistName={null}
          timer={timer}
          fact={fact}
          onRemove={() => removeSelected(false)}
          onRemoveAndSpin={() => removeSelected(true)}
          onFinish={() => removeSelected(false)}
          onOpenParticipants={openParticipants}
        />
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
