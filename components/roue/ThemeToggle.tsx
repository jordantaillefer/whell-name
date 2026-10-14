"use client"

import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"
import styles from "./AppHeader.module.css"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      className={styles.tool}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-pressed={dark}
      title={dark ? "Passer en thème clair" : "Passer en thème sombre"}
    >
      {dark ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
      <span className={styles.toolLabel}>Thème</span>
    </button>
  )
}
