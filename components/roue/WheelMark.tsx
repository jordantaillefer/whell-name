import type { Ref, SVGProps } from "react"
import { wedgePath } from "@/lib/geometry"
import { PASTELS } from "@/lib/palette"

const PARTS = PASTELS.slice(0, 8).map((swatch, i) => ({
  d: wedgePath(17, -112.5 + i * 45, -67.5 + i * 45),
  fill: i === 0 ? "#000091" : swatch.bg,
}))

const ORIGIN = { transformBox: "view-box", transformOrigin: "0 0" } as const

type Props = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number
  title?: string
  ref?: Ref<SVGSVGElement>
}

/** Pictogramme : mini-roue pastel, part du haut en bleu France. */
export function WheelMark({ size = 40, title, ref, ...rest }: Props) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="-20 -20 40 40"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      <circle data-mark-ring r={19} fill="#fff" stroke="#DDDDDD" strokeWidth={0.8} />
      {PARTS.map((part, i) => (
        <path key={i} data-mark-part={i} d={part.d} fill={part.fill} stroke="#fff" strokeWidth={0.9} style={ORIGIN} />
      ))}
      <g data-mark-hub style={ORIGIN}>
        <circle r={4.5} fill="#fff" stroke="#DDDDDD" strokeWidth={0.6} />
        <circle r={1.8} fill="#000091" />
      </g>
    </svg>
  )
}
