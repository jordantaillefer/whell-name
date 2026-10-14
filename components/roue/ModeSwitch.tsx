"use client"

import type { KeyboardEvent } from "react"
import { GridIcon, StarIcon, TargetIcon } from "@radix-ui/react-icons"
import type { DisplayMode } from "@/lib/names"
import { cn } from "@/lib/utils"
import styles from "./ModeSwitch.module.css"

const OPTIONS: { value: DisplayMode; label: string; Icon: typeof TargetIcon }[] = [
  { value: "wheel", label: "Roue", Icon: TargetIcon },
  { value: "grid", label: "Grille", Icon: GridIcon },
  { value: "star", label: "Étoile", Icon: StarIcon },
]

type Props = { value: DisplayMode; onChange: (mode: DisplayMode) => void; disabled?: boolean }

export function ModeSwitch({ value, onChange, disabled }: Props) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
    event.preventDefault()
    const index = OPTIONS.findIndex((o) => o.value === value)
    const next = OPTIONS[(index + (event.key === "ArrowRight" ? 1 : OPTIONS.length - 1)) % OPTIONS.length]
    onChange(next.value)
    const target = event.currentTarget.querySelector<HTMLButtonElement>(`[data-mode="${next.value}"]`)
    target?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Mode de tirage" className={styles.switch} onKeyDown={disabled ? undefined : onKeyDown}>
      {OPTIONS.map(({ value: mode, label, Icon }) => {
        const active = mode === value
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            data-mode={mode}
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            className={cn(styles.option, active && styles.active)}
            onClick={() => onChange(mode)}
          >
            <Icon aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
