/** Crée une particule positionnée en (0, 0) du conteneur (qui doit être en position relative). */
export function createConfettiPiece(container: HTMLElement, color: string, k: number): HTMLSpanElement {
  const piece = document.createElement("span")
  piece.setAttribute("aria-hidden", "true")
  const thin = k % 4 === 1
  Object.assign(piece.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: thin ? "5px" : "9px",
    height: thin ? "12px" : "9px",
    background: color,
    borderRadius: k % 3 === 0 ? "50%" : "0",
    pointerEvents: "none",
    zIndex: "5",
  })
  container.appendChild(piece)
  return piece
}

/** Gerbe de confettis depuis `origin` (coordonnées relatives au conteneur). */
export function burstConfetti(
  container: HTMLElement,
  origin: { x: number; y: number },
  colors: readonly string[],
  count = 70,
): void {
  if (typeof container.animate !== "function") return
  for (let k = 0; k < count; k++) {
    const piece = createConfettiPiece(container, colors[k % colors.length], k)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3
    const speed = 180 + Math.random() * 260
    const dx = Math.cos(angle) * speed
    const dy = Math.sin(angle) * speed
    const animation = piece.animate(
      [
        { transform: `translate(${origin.x}px, ${origin.y}px) rotate(0deg)`, opacity: 1 },
        {
          transform: `translate(${origin.x + dx * 0.7}px, ${origin.y + dy * 0.7}px) rotate(${Math.random() * 360}deg)`,
          opacity: 1,
          offset: 0.45,
        },
        {
          transform: `translate(${origin.x + dx}px, ${origin.y + dy + 380}px) rotate(${Math.random() * 720}deg)`,
          opacity: 0,
        },
      ],
      { duration: 1600 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.4,1)" },
    )
    animation.onfinish = () => piece.remove()
    animation.oncancel = () => piece.remove()
  }
}
