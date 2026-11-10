import type { ReactNode } from "react"

import { SiteFooter } from "@/components/site-footer"

/* Standard page frame: clears the side rail (or the top bar on phones) and
   sets the page margins. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="min-h-[calc(100dvh-6rem)] pt-(--bar) pl-(--rail)">
        <div className="px-5 md:px-12 lg:px-14">{children}</div>
      </div>
      <SiteFooter />
    </>
  )
}

export function PageHeader({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <header className="pt-10 pb-10 md:pt-12 md:pb-14">
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <h1 className="display">{title}</h1>
    </header>
  )
}
