import { ViewTransition } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { PageHeader, PageShell } from "@/components/page-shell"
import { PageTransition } from "@/components/page-transition"
import { getArtworks } from "@/lib/content"
import { availabilityLabel } from "@/lib/format"

export const metadata: Metadata = {
  title: "Artworks",
}

export default async function ArtworksPage() {
  const works = await getArtworks()

  return (
    <PageTransition>
      <PageShell>
        <PageHeader
          eyebrow={`${works.length} ${works.length === 1 ? "work" : "works"}`}
          title="Artworks"
        />

        <ul className="columns-1 gap-x-10 pb-16 sm:columns-2 xl:columns-3 xl:gap-x-14">
          {works.map((work, index) => {
            const status = availabilityLabel(work.availability)
            return (
              <li key={work.slug} className="mb-12 break-inside-avoid">
                <Link
                  href={`/artworks/${work.slug}`}
                  className="group block outline-none"
                >
                  <ViewTransition
                    name={`artwork-${work.slug}`}
                    share="artwork-morph"
                    default="none"
                  >
                    <Image
                      src={work.image.src}
                      alt={work.title}
                      width={work.image.width}
                      height={work.image.height}
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                      placeholder={work.image.blurDataURL ? "blur" : "empty"}
                      blurDataURL={work.image.blurDataURL}
                      preload={index < 3}
                      className="h-auto w-full bg-muted"
                    />
                  </ViewTransition>
                  <span className="mt-3 flex items-baseline justify-between gap-4">
                    <span className="underline-offset-4 group-hover:underline group-focus-visible:underline">
                      {work.title}
                    </span>
                    <span className="shrink-0 font-mono text-[0.6875rem] tracking-[0.14em] text-muted-foreground uppercase">
                      {[work.year, status].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </PageShell>
    </PageTransition>
  )
}
