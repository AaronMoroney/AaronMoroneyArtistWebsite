import { Suspense, ViewTransition } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArtworkDetails } from "@/components/artwork-details"
import {
  BackLink,
  BackLinkForOrigin,
  SiblingLinks,
  SiblingLinksForOrigin,
} from "@/components/artwork-origin"
import { PageShell } from "@/components/page-shell"
import { PageTransition } from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { getArtwork, getArtworks } from "@/lib/content"
import { titleWithYear } from "@/lib/format"

/* Every work in content/artworks.json gets its page built ahead of time
   (generateStaticParams below). Only an address that matches no work has to
   wait for the server, to be told it does not exist. */
export const instant = false

export async function generateStaticParams() {
  const works = await getArtworks()
  return works.map((work) => ({ slug: work.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/artworks/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const work = await getArtwork(slug)
  return work ? { title: titleWithYear(work) } : {}
}

export default async function ArtworkPage({
  params,
}: PageProps<"/artworks/[slug]">) {
  const { slug } = await params
  const works = await getArtworks()
  const index = works.findIndex((work) => work.slug === slug)
  if (index === -1) notFound()

  const work = works[index]
  const sibling = (step: number) => {
    const { slug, title } = works[(index + step + works.length) % works.length]
    return { slug, title }
  }
  const previous = sibling(-1)
  const next = sibling(1)

  return (
    <PageTransition>
      <PageShell>
        {/* On a phone the way back comes first, above the image. From 1024px
            it sits at the top of the text column, beside the image. */}
        <div className="grid gap-y-6 py-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8 lg:py-12">
          <div className="lg:col-start-2 lg:pt-2">
            <Suspense fallback={<BackLink slug={work.slug} />}>
              <BackLinkForOrigin slug={work.slug} />
            </Suspense>
          </div>

          <div className="lg:sticky lg:top-12 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
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
                sizes="(min-width: 1024px) 52vw, 100vw"
                placeholder={work.image.blurDataURL ? "blur" : "empty"}
                blurDataURL={work.image.blurDataURL}
                preload
                className="mx-auto h-auto max-h-[calc(100dvh-6rem)] w-auto max-w-full bg-muted"
              />
            </ViewTransition>
          </div>

          <div className="pt-4 lg:col-start-2 lg:pt-0">
            <div>
              {work.type && <p className="eyebrow">{work.type}</p>}
              <h1 className="title text-balance">{work.title}</h1>
              {work.year && (
                <p className="font-mono text-sm text-muted-foreground">
                  {work.year}
                </p>
              )}
            </div>

            <ArtworkDetails work={work} className="mt-8" />

            <Button asChild variant="outline" size="xl" className="mt-10">
              <Link href={`/contact?work=${work.slug}`}>Enquire</Link>
            </Button>

            {works.length > 1 && (
              <Suspense
                fallback={<SiblingLinks previous={previous} next={next} />}
              >
                <SiblingLinksForOrigin previous={previous} next={next} />
              </Suspense>
            )}
          </div>
        </div>
      </PageShell>
    </PageTransition>
  )
}
