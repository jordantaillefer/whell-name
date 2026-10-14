"use client"

import { Link2Icon } from "@radix-ui/react-icons"
import { toast } from "sonner"
import styles from "./AppHeader.module.css"

export function ShareButton() {
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Lien copié", { description: "La liste des participants est incluse dans le lien." })
    } catch {
      toast.error("Impossible de copier le lien", { description: window.location.href })
    }
  }

  return (
    <button type="button" className={styles.tool} onClick={share}>
      <Link2Icon aria-hidden />
      <span className={styles.toolLabel}>Partager</span>
    </button>
  )
}
