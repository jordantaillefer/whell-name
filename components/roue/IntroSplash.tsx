"use client"

import { useEffect, useRef, type RefObject } from "react"
import { TrackNextIcon } from "@radix-ui/react-icons"
import { WheelMark } from "./WheelMark"
import styles from "./IntroSplash.module.css"

const MARK_SIZE = 132
const WORD = "Roue des noms"

type Props = {
  targetRef: RefObject<Element | null>
  /** Diamètre de l'anneau cible / largeur de l'élément cible (412/420 pour la roue). */
  ringRatio: number
  onReveal: () => void
  onSettle: () => void
  onExited: () => void
}

export function IntroSplash({ targetRef, ringRatio, onReveal, onSettle, onExited }: Props) {
  const markRef = useRef<SVGSVGElement>(null)
  const wordRef = useRef<HTMLParagraphElement>(null)
  const tagRef = useRef<HTMLParagraphElement>(null)
  const callbacks = useRef({ onReveal, onSettle, onExited })
  const skipRef = useRef<() => void>(() => {})

  useEffect(() => {
    callbacks.current = { onReveal, onSettle, onExited }
  })

  useEffect(() => {
    const animations: Animation[] = []
    const timers: number[] = []
    let finished = false

    const animate = (el: Element | null, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      if (!el) return null
      const animation = el.animate(keyframes, { fill: "both", ...options })
      animations.push(animation)
      return animation
    }
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
    const finish = () => {
      if (finished) return
      finished = true
      animations.forEach((a) => a.cancel())
      timers.forEach((id) => window.clearTimeout(id))
      callbacks.current.onReveal()
      callbacks.current.onSettle()
      callbacks.current.onExited()
    }
    skipRef.current = finish

    const mark = markRef.current
    if (!mark || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish()
      return
    }

    // 1. Les parts se déploient en spirale, puis l'anneau et le moyeu
    mark.querySelectorAll("[data-mark-part]").forEach((part, i) =>
      animate(
        part,
        [
          { transform: "rotate(-60deg) scale(0)", opacity: 0 },
          { transform: "rotate(0deg) scale(1.06)", opacity: 1, offset: 0.7 },
          { transform: "rotate(0deg) scale(1)", opacity: 1 },
        ],
        { duration: 520, delay: 60 + i * 45, easing: "cubic-bezier(.2,.9,.3,1.2)" },
      ),
    )
    animate(mark.querySelector("[data-mark-ring]"), [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 520 })
    animate(mark.querySelector("[data-mark-hub]"), [{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1)" }], {
      duration: 300,
      delay: 560,
      easing: "cubic-bezier(.3,1.6,.5,1)",
    })

    // 2. Le nom monte lettre par lettre, puis le sous-titre
    wordRef.current?.querySelectorAll("[data-letter]").forEach((letter, k) =>
      animate(letter, [{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], {
        duration: 420,
        delay: 520 + k * 26,
        easing: "cubic-bezier(.2,1.1,.4,1)",
      }),
    )
    animate(tagRef.current, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 860 })

    // 3. Tour d'élan
    animate(mark, [{ transform: "rotate(0deg)" }, { transform: "rotate(-12deg)", offset: 0.25 }, { transform: "rotate(360deg)" }], {
      duration: 800,
      delay: 1050,
      easing: "cubic-bezier(.5,0,.2,1)",
    })
    later(() => {
      animate(wordRef.current, [{ opacity: 1 }, { opacity: 0, transform: "translateY(8px)" }], { duration: 250 })
      animate(tagRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 })
    }, 1300)

    // 4. FLIP : le pictogramme se pose exactement sur la roue
    later(() => {
      const target = targetRef.current
      if (!target) {
        finish()
        return
      }
      const from = mark.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      const scale = (to.width * ringRatio) / ((MARK_SIZE * 38) / 40)
      const dx = to.left + to.width / 2 - (from.left + from.width / 2)
      const dy = to.top + to.height / 2 - (from.top + from.height / 2)
      const move = animate(
        mark,
        [
          { transform: "translate(0px, 0px) scale(1) rotate(360deg)" },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(360deg)` },
        ],
        { duration: 700, easing: "cubic-bezier(.6,0,.15,1)" },
      )
      later(() => callbacks.current.onReveal(), 420)
      if (move) {
        move.onfinish = () => {
          if (finished) return
          callbacks.current.onSettle()
          const fade = animate(mark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" })
          if (fade) fade.onfinish = finish
        }
      }
    }, 1860)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      animations.forEach((a) => a.cancel())
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [targetRef, ringRatio])

  return (
    <>
      <div className={styles.splash} aria-hidden>
        <div className={styles.mark}>
          <WheelMark ref={markRef} size={MARK_SIZE} className={styles.markSvg} />
          <p ref={wordRef} className={styles.word}>
            {[...WORD].map((char, i) => (
              <span key={i} data-letter className={styles.letter}>
                {char === " " ? " " : char}
              </span>
            ))}
          </p>
          <p ref={tagRef} className={styles.tag}>
            Tirage au sort pour vos rituels d'équipe
          </p>
        </div>
      </div>
      <button type="button" className={styles.skip} onClick={() => skipRef.current()}>
        <TrackNextIcon aria-hidden />
        Passer l'intro <kbd>Échap</kbd>
      </button>
    </>
  )
}
