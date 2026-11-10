import { getSite } from "@/lib/content"

export function SiteFooter() {
  const site = getSite()

  return (
    <footer className="pl-(--rail)">
      <div className="mx-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-foreground/15 py-8 font-mono text-xs text-muted-foreground md:mx-12 lg:mx-14">
        <span>{site.name}</span>
        {site.email && (
          <a
            href={`mailto:${site.email}`}
            className="underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
          >
            {site.email}
          </a>
        )}
      </div>
    </footer>
  )
}
