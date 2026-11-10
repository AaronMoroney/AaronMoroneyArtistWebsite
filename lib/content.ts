import { cache } from "react"
import type { StaticImageData } from "next/image"
import { z } from "zod"

import artworksJson from "@/content/artworks.json"
import cvJson from "@/content/cv.json"
import siteJson from "@/content/site.json"

/*
 * Everything the site shows comes from three files in /content:
 *   artworks.json  one record per work
 *   cv.json        the CV on the About page
 *   site.json      name, email, links, statement, home page videos
 * Artwork images live in /content/images and are referred to by file name.
 *
 * The schemas below check those files when the site builds, so a typo stops
 * the build with a readable message instead of reaching the live site.
 */

const optionalText = z.string().trim().default("")

const exhibitionSchema = z.object({
  title: z.string().trim().min(1),
  kind: optionalText,
  curator: optionalText,
  venue: optionalText,
  date: optionalText,
  link: z
    .object({ label: z.string().trim().min(1), url: z.url() })
    .optional(),
})

const availabilitySchema = z.enum([
  "",
  "available",
  "sold",
  "on-hold",
  "not-for-sale",
])

const artworkSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use lowercase letters, numbers and hyphens"),
  title: z.string().trim().min(1),
  year: z.number().int().nullable().default(null),
  image: z.string().trim().min(1),
  type: optionalText,
  medium: optionalText,
  dimensions: optionalText,
  blurb: optionalText,
  availability: availabilitySchema.default(""),
  price: optionalText,
  exhibitions: z.array(exhibitionSchema).default([]),
  featured: z.boolean().default(false),
  /* Position on the Explore wall. x and y are the centre of the image and w
     is its width, all as percentages of the wall. */
  explore: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    w: z.number().min(3).max(40),
  }),
})

const emptyOr = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal(""), schema])

const siteSchema = z.object({
  name: z.string().trim().min(1),
  email: emptyOr(z.email()),
  instagram: emptyOr(z.url()),
  artsy: emptyOr(z.url()),
  statement: z.array(z.string().trim().min(1)).default([]),
  videos: z
    .array(
      z.object({
        /* Path under /public, e.g. "/video/studio.mp4". Empty shows the still. */
        src: optionalText,
        /* An image from /content/images, shown until the video is added. */
        still: optionalText,
        title: optionalText,
      })
    )
    .default([]),
})

const cvSchema = z.object({
  sections: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        entries: z.array(
          z.object({
            year: optionalText,
            title: z.string().trim().min(1),
            detail: optionalText,
            venue: optionalText,
          })
        ),
      })
    )
    .default([]),
})

export type Exhibition = z.infer<typeof exhibitionSchema>
export type Availability = z.infer<typeof availabilitySchema>
export type ArtworkImage = {
  src: string
  width: number
  height: number
  blurDataURL?: string
}
export type Artwork = Omit<z.infer<typeof artworkSchema>, "image"> & {
  image: ArtworkImage
}
export type Site = z.infer<typeof siteSchema>
export type Cv = z.infer<typeof cvSchema>
export type VideoChapterContent = {
  src: string
  title: string
  still: ArtworkImage | null
}

function parse<T extends z.ZodType>(
  schema: T,
  data: unknown,
  file: string
): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `content/${file} needs fixing:\n${z.prettifyError(result.error)}`
    )
  }
  return result.data
}

async function loadImage(file: string, usedBy: string): Promise<ArtworkImage> {
  let image: StaticImageData
  try {
    image = (await import(`@/content/images/${file}`)).default
  } catch {
    throw new Error(
      `content/images/${file} was not found. It is used by ${usedBy}.`
    )
  }
  return {
    src: image.src,
    width: image.width,
    height: image.height,
    blurDataURL: image.blurDataURL,
  }
}

export const getArtworks = cache(async (): Promise<Artwork[]> => {
  const records = parse(z.array(artworkSchema), artworksJson, "artworks.json")

  const seen = new Set<string>()
  for (const record of records) {
    if (seen.has(record.slug)) {
      throw new Error(
        `content/artworks.json needs fixing:\nTwo works share the slug "${record.slug}". Each slug must be unique.`
      )
    }
    seen.add(record.slug)
  }

  return Promise.all(
    records.map(async (record) => ({
      ...record,
      image: await loadImage(record.image, `"${record.title}" (${record.slug})`),
    }))
  )
})

export async function getArtwork(slug: string): Promise<Artwork | undefined> {
  return (await getArtworks()).find((work) => work.slug === slug)
}

/* The work marked "featured": true leads the home page. Falls back to the
   first work in the file. */
export async function getFeaturedArtwork(): Promise<Artwork | undefined> {
  const works = await getArtworks()
  return works.find((work) => work.featured) ?? works[0]
}

export function getSite(): Site {
  return parse(siteSchema, siteJson, "site.json")
}

export function getCv(): Cv {
  return parse(cvSchema, cvJson, "cv.json")
}

export const getVideoChapters = cache(
  async (): Promise<VideoChapterContent[]> => {
    const { videos } = getSite()
    return Promise.all(
      videos.map(async (video, index) => ({
        src: video.src,
        title: video.title,
        still: video.still
          ? await loadImage(video.still, `video ${index + 1} in site.json`)
          : null,
      }))
    )
  }
)
