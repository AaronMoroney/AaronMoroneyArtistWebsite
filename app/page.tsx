import { HomeHero } from "@/components/home-hero"
import { PageIndex } from "@/components/page-index"
import { PageTransition } from "@/components/page-transition"
import { SiteFooter } from "@/components/site-footer"
import { VideoChapter } from "@/components/video-chapter"
import { getFeaturedArtwork, getVideoChapters } from "@/lib/content"

export default async function HomePage() {
  const [featured, chapters] = await Promise.all([
    getFeaturedArtwork(),
    getVideoChapters(),
  ])
  /* The first video in site.json follows the hero; the second leads into
     the footer. */
  const [first, second] = chapters

  return (
    <PageTransition>
      {featured && <HomeHero work={featured} />}
      {first && <VideoChapter number={1} {...first} />}
      <PageIndex />
      {second && <VideoChapter number={2} {...second} />}
      <SiteFooter />
    </PageTransition>
  )
}
