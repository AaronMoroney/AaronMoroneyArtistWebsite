"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

/*
 * Remembers that an artwork page was reached from the Explore wall.
 *
 * Links from the wall add ?from=explore. While that is present, the artwork
 * page offers a way back to the wall (landing on the same work) instead of
 * the list, and the previous / next links keep the marker.
 */

type Sibling = { slug: string; title: string }

const quietLink =
  "font-mono text-xs underline-offset-4 outline-none hover:underline focus-visible:underline"

export function artworkHref(slug: string, fromExplore: boolean) {
  return fromExplore ? `/artworks/${slug}?from=explore` : `/artworks/${slug}`
}

function useFromExplore() {
  return useSearchParams().get("from") === "explore"
}

export function BackLink({
  slug,
  fromExplore = false,
}: {
  slug: string
  fromExplore?: boolean
}) {
  if (fromExplore) {
    return (
      <Button
        asChild
        variant="outline"
        className="h-10 px-4 font-mono text-xs"
      >
        <Link href={`/explore?work=${slug}`}>← Back to Explore</Link>
      </Button>
    )
  }

  return (
    <Link
      href="/artworks"
      className={`${quietLink} text-muted-foreground hover:text-foreground`}
    >
      ← All artworks
    </Link>
  )
}

export function SiblingLinks({
  previous,
  next,
  fromExplore = false,
}: {
  previous: Sibling
  next: Sibling
  fromExplore?: boolean
}) {
  return (
    <nav
      aria-label="More artworks"
      className="mt-14 flex justify-between gap-6 border-t border-foreground/15 pt-5"
    >
      <Link href={artworkHref(previous.slug, fromExplore)} className={quietLink}>
        ← {previous.title}
      </Link>
      <Link
        href={artworkHref(next.slug, fromExplore)}
        className={`${quietLink} text-right`}
      >
        {next.title} →
      </Link>
    </nav>
  )
}

/* These two read the address bar, so the page wraps them in <Suspense> with
   the plain versions above as the fallback. */

export function BackLinkForOrigin({ slug }: { slug: string }) {
  return <BackLink slug={slug} fromExplore={useFromExplore()} />
}

export function SiblingLinksForOrigin({
  previous,
  next,
}: {
  previous: Sibling
  next: Sibling
}) {
  return (
    <SiblingLinks
      previous={previous}
      next={next}
      fromExplore={useFromExplore()}
    />
  )
}
