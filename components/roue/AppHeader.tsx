"use client"

import type { Ref } from "react"
import { PersonIcon } from "@radix-ui/react-icons"
import type { Swatch } from "@/lib/palette"
import { cn } from "@/lib/utils"
import { ShareButton } from "./ShareButton"
import { ThemeToggle } from "./ThemeToggle"
import { WheelMark } from "./WheelMark"
import styles from "./AppHeader.module.css"

type Props = {
  names: string[]
  colors: Swatch[]
  onOpenParticipants: () => void
  markRef?: Ref<SVGSVGElement>
}

export function AppHeader({ names, colors, onOpenParticipants, markRef }: Props) {
  const shown = names.slice(0, 6)
  const extra = names.length - shown.length

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <WheelMark ref={markRef} size={40} />
        <div>
          <h1 className={styles.title}>Roue des noms</h1>
          <p className={styles.subtitle}>Tirage au sort pour vos rituels d'équipe</p>
        </div>
      </div>
      <nav className={styles.tools} aria-label="Outils">
        <button type="button" className={styles.tool} onClick={onOpenParticipants} aria-haspopup="dialog">
          <PersonIcon aria-hidden />
          <span className={styles.toolLabel}>Participants</span>
          <span className="sr-only">{`(${names.length})`}</span>
          {names.length === 0 ? (
            <span className={styles.count} aria-hidden>0</span>
          ) : (
            <span className={styles.avatars} aria-hidden>
              {shown.map((name, i) => (
                <span key={name} className={styles.avatar} style={{ background: colors[i].bg, color: colors[i].ink }}>
                  {name.charAt(0).toUpperCase()}
                </span>
              ))}
              {extra > 0 && <span className={cn(styles.avatar, styles.avatarMore)}>+{extra}</span>}
            </span>
          )}
        </button>
        <ShareButton />
        <ThemeToggle />
      </nav>
    </header>
  )
}
