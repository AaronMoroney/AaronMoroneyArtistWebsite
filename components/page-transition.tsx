import { ViewTransition, type ReactNode } from "react"

/* Wraps a page so its content crossfades on navigation while the navigation
   itself stays put. The timings live in app/globals.css. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
