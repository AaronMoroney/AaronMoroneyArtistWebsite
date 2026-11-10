"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

import type { VideoChapterContent } from "@/lib/content"

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const chip =
  "bg-(--glass-raised) px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase backdrop-blur-md"

/*
 * A full-screen video between sections of the home page.
 *
 * The section is taller than the screen and the video is pinned inside it.
 * As it scrolls into place a white gradient lifts off the top; as it leaves,
 * white rises from the bottom. Both edges are driven by scroll position, so
 * scrolling back up plays the same thing in reverse.
 *
 * Until a video file is set in content/site.json, the still image stands in.
 */
export function VideoChapter({
  number,
  src,
  title,
  still,
}: VideoChapterContent & { number: number }) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const pausedByVisitor = useRef(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0

    const update = () => {
      frame = 0
      let veilIn = 0.16
      let veilOut = 0.16

      if (!reducedMotion.matches) {
        const rect = section.getBoundingClientRect()
        const screen = window.innerHeight
        /* Starts clearing when the section is 60% of the way up the screen
           and finishes shortly after the video is pinned. */
        veilIn = clamp((rect.top + screen * 0.3) / (screen * 0.9))
        /* Fully white again at the moment the video is released. */
        veilOut = clamp((screen * 1.55 - rect.bottom) / (screen * 0.55))
      }

      section.style.setProperty("--veil-in", veilIn.toFixed(4))
      section.style.setProperty("--veil-out", veilOut.toFixed(4))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    reducedMotion.addEventListener("change", schedule)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      reducedMotion.removeEventListener("change", schedule)
    }
  }, [])

  /* Play only while on screen, and never start on its own for visitors who
     have asked for reduced motion. */
  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches

        if (!entry.isIntersecting) {
          video.pause()
        } else if (!pausedByVisitor.current && !reducedMotion) {
          video.play().catch(() => {})
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(section)

    /* Next hides this page rather than discarding it when the visitor moves
       on, and a hidden video keeps playing unless it is paused. */
    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [src])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      pausedByVisitor.current = false
      video.play().catch(() => {})
    } else {
      pausedByVisitor.current = true
      video.pause()
    }
  }

  const label = String(number).padStart(2, "0")

  return (
    <section
      ref={sectionRef}
      aria-label={title || `Video ${label}`}
      className="chapter relative h-[230vh] motion-reduce:h-dvh"
    >
      <div className="sticky top-0 h-dvh overflow-hidden bg-muted">
        <div className="chapter-media absolute inset-0">
          {src ? (
            <video
              ref={videoRef}
              src={src}
              poster={still?.src}
              muted
              loop
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              className="size-full object-cover"
            />
          ) : (
            still && (
              <Image
                src={still.src}
                alt=""
                fill
                sizes="100vw"
                placeholder={still.blurDataURL ? "blur" : "empty"}
                blurDataURL={still.blurDataURL}
                className="chapter-still object-cover"
              />
            )
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 pl-(--rail)">
          <div className="flex items-end justify-between gap-4 px-5 pb-6 md:px-12 lg:px-14">
            <p className={chip}>
              {src ? title || `Video ${label}` : `Video ${label} · Placeholder`}
            </p>
            {src && (
              <button
                type="button"
                onClick={toggle}
                className={`${chip} cursor-pointer outline-none hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background`}
              >
                {playing ? "Pause" : "Play"}
              </button>
            )}
          </div>
        </div>

        <div
          aria-hidden
          className="chapter-veil-in pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden
          className="chapter-veil-out pointer-events-none absolute inset-0"
        />
      </div>
    </section>
  )
}
