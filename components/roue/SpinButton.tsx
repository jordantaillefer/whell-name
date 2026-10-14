import type { ReactNode } from "react"
import { ReloadIcon, StarFilledIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import styles from "./SpinButton.module.css"

type Props = {
  label: string
  icon: "spin" | "finale"
  busy: boolean
  disabled: boolean
  pulse?: boolean
  hint: ReactNode
  onClick: () => void
}

export function SpinButton({ label, icon, busy, disabled, pulse, hint, onClick }: Props) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={cn(styles.button, pulse && !disabled && styles.pulse)}
        disabled={disabled}
        aria-busy={busy}
        onClick={onClick}
      >
        {icon === "finale" ? (
          <StarFilledIcon aria-hidden />
        ) : (
          <ReloadIcon aria-hidden className={busy ? styles.busyIcon : undefined} />
        )}
        <span>{label}</span>
      </button>
      <p className={styles.hint}>{hint}</p>
    </div>
  )
}
