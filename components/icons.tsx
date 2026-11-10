import type { SVGProps } from "react"

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
  "aria-hidden": true,
} satisfies SVGProps<SVGSVGElement>

/* A monoline take on the Artsy mark: an "A" in an open square. */
export function ArtsyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.5H3.5v-17h17v17H16V17" />
      <path d="M7.5 13.5 10.25 7l2.75 6.5M8.5 11.25H12" />
    </svg>
  )
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="M16.9 7.1h.01" strokeWidth={1.75} />
    </svg>
  )
}

export function ArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={14} height={14} {...props}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}
