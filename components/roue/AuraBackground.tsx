import { cn } from "@/lib/utils"
import styles from "./AuraBackground.module.css"

/** Taches pastel floutées qui dérivent lentement derrière la scène. */
export function AuraBackground({ visible = true }: { visible?: boolean }) {
  return (
    <div className={cn(styles.aura, !visible && styles.hidden)} aria-hidden>
      <span className={cn(styles.blob, styles.b1)} />
      <span className={cn(styles.blob, styles.b2)} />
      <span className={cn(styles.blob, styles.b3)} />
      <span className={cn(styles.blob, styles.b4)} />
    </div>
  )
}
