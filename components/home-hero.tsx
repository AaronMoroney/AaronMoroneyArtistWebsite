import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { ArrowUpRightIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import type { Artwork } from "@/lib/content"
import { exhibitionPlace } from "@/lib/format"

function HeroLine({
  label,
  heading = false,
  children,
}: {
  label: string
  heading?: boolean
  children: ReactNode
}) {
  const Text = heading ? "h1" : "p"
  return (
    <div className="mt-2 first:mt-0">
      <p className="eyebrow">{label}</p>
      <Text className="title max-w-[21ch] text-balance">{children}</Text>
    </div>
  )
}

/* The opening screen: the featured work's title, where it was shown, and
   the image filling the right-hand side. */
export function HomeHero({ work }: { work: Artwork }) {
  const exhibition = work.exhibitions.at(0)
  const place = exhibition ? exhibitionPlace(exhibition) : ""

  return (
    <section className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,41%)]">
      <div className="order-2 pl-(--rail) lg:order-1">
        <div className="px-5 pt-9 pb-16 md:px-12 lg:px-14 lg:pt-10">
          <HeroLine label={work.type || "Featured work"} heading>
            ‘{work.title}’
          </HeroLine>

          {exhibition && (
            <HeroLine label={exhibition.kind || "Exhibition"}>
              ‘{exhibition.title}’
              {exhibition.curator && `, curated by ${exhibition.curator}`}
            </HeroLine>
          )}

          {place && <HeroLine label="Location">{place}</HeroLine>}

          <div className="mt-12 flex flex-wrap gap-4 lg:mt-16">
            <Button asChild variant="outline" size="xl">
              <Link href="/artworks">View all work</Link>
            </Button>
            {exhibition?.link ? (
              <Button asChild variant="outline" size="xl">
                <a
                  href={exhibition.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {exhibition.link.label}
                  <ArrowUpRightIcon />
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline" size="xl">
                <Link href="/explore">Explore</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Below 1024px the image sits under the top bar (or beside the rail)
          and is shown whole, never taller than the screen, so all of it is
          visible before scrolling. From 1024px it fills the right-hand
          column edge to edge. */}
      <Link
        href={`/artworks/${work.slug}`}
        aria-label={`View ${work.title}`}
        className="relative order-1 block bg-muted pt-(--bar) pl-(--rail) outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-foreground lg:order-2 lg:p-0"
      >
        <Image
          src={work.image.src}
          alt={work.title}
          width={work.image.width}
          height={work.image.height}
          preload
          sizes="(min-width: 1024px) 41vw, 100vw"
          placeholder={work.image.blurDataURL ? "blur" : "empty"}
          blurDataURL={work.image.blurDataURL}
          className="h-auto max-h-[calc(100dvh-var(--bar))] w-full object-contain lg:absolute lg:inset-0 lg:h-full lg:max-h-none lg:object-cover"
        />
      </Link>
    </section>
  )
}
