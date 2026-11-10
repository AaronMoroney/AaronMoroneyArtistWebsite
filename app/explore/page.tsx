import type { Metadata } from "next"

import { ExploreCanvas } from "@/components/explore-canvas"
import { PageTransition } from "@/components/page-transition"
import { getArtworks } from "@/lib/content"

export const metadata: Metadata = {
  title: "Explore",
}

export default async function ExplorePage() {
  const works = await getArtworks()

  return (
    <PageTransition>
      <h1 className="sr-only">Explore</h1>
      <ExploreCanvas works={works} />
    </PageTransition>
  )
}
