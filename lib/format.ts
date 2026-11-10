import type { Artwork, Availability, Exhibition } from "@/lib/content"

const AVAILABILITY_LABELS: Record<Exclude<Availability, "">, string> = {
  available: "Available",
  sold: "Sold",
  "on-hold": "On hold",
  "not-for-sale": "Not for sale",
}

export function availabilityLabel(availability: Availability): string {
  return availability ? AVAILABILITY_LABELS[availability] : ""
}

/* A price is only shown while a work can still be bought. */
export function priceLabel(work: Pick<Artwork, "availability" | "price">) {
  if (work.availability === "sold" || work.availability === "not-for-sale") {
    return ""
  }
  return work.price
}

export function titleWithYear(work: Pick<Artwork, "title" | "year">): string {
  return work.year ? `${work.title}, ${work.year}` : work.title
}

export function exhibitionPlace(exhibition: Exhibition): string {
  return [exhibition.venue, exhibition.date].filter(Boolean).join(", ")
}

export type DetailRow = { label: string; value: string }

/* The short facts about a work. Anything left empty in artworks.json is
   skipped rather than shown as a blank row. */
export function detailRows(work: Artwork): DetailRow[] {
  return [
    { label: "Medium", value: work.medium },
    { label: "Dimensions", value: work.dimensions },
    { label: "Status", value: availabilityLabel(work.availability) },
    { label: "Price", value: priceLabel(work) },
  ].filter((row) => row.value)
}

export function hasDetails(work: Artwork): boolean {
  return (
    detailRows(work).length > 0 ||
    work.blurb.length > 0 ||
    work.exhibitions.length > 0
  )
}
