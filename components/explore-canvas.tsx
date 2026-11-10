"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import Image from "next/image"
import Link from "next/link"

import { ArtworkDetails } from "@/components/artwork-details"
import { artworkHref } from "@/components/artwork-origin"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Artwork } from "@/lib/content"
import { cn } from "@/lib/utils"

/* Sizes in pixels. RAIL matches --rail in globals.css from 768px up, which
   is the only width at which the side card is used. */
const RAIL = 88
const CARD_WIDTH = 340
const CARD_GAP = 24
const CARD_HEIGHT_ESTIMATE = 400
const EDGE = 24
const DRAG_THRESHOLD = 5
const WIDE_QUERY = "(min-width: 48rem)"

type Placement = {
  side: "left" | "right"
  align: "top" | "bottom"
  /* How far the card is pulled back over the image when there is not room
     for it beside the work. */
  nudge: number
}

type Active = { slug: string; pinned: boolean }

type Drag = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  lastX: number
  lastY: number
  lastTime: number
  velocityX: number
  velocityY: number
  moved: boolean
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const chip =
  "bg-(--glass-raised) px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase backdrop-blur-md"

const quietLink =
  "font-mono text-xs underline-offset-4 outline-none hover:underline focus-visible:underline"

/*
 * The Explore wall: a surface larger than the screen that can be dragged,
 * scrolled or moved with the arrow keys. Each work sits where its "explore"
 * values in content/artworks.json put it.
 *
 * Hovering a work brings its card forward. Clicking pins the card open.
 * On a touch screen, or a narrow window, tapping opens the same details in
 * a sheet from the bottom.
 */
export function ExploreCanvas({ works }: { works: Artwork[] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)
  const coordsRef = useRef<HTMLSpanElement>(null)

  const offset = useRef({ x: 0, y: 0 })
  const drag = useRef<Drag | null>(null)
  const motionFrame = useRef(0)
  const hoverTimer = useRef(0)
  const ignoreClick = useRef(false)
  const pointerType = useRef("mouse")
  const hasMounted = useRef(false)

  const [active, setActive] = useState<Active | null>(null)
  const [placements, setPlacements] = useState<Record<string, Placement>>({})
  const [sheet, setSheet] = useState<{ slug: string; open: boolean } | null>(
    null
  )
  const [dragging, setDragging] = useState(false)

  /* ---------- Moving the wall ---------- */

  const limit = useCallback((x: number, y: number) => {
    const viewport = viewportRef.current
    const plane = planeRef.current
    if (!viewport || !plane) return { x, y }
    return {
      x: clamp(x, Math.min(0, viewport.clientWidth - plane.offsetWidth), 0),
      y: clamp(y, Math.min(0, viewport.clientHeight - plane.offsetHeight), 0),
    }
  }, [])

  const moveTo = useCallback(
    (x: number, y: number) => {
      const viewport = viewportRef.current
      const plane = planeRef.current
      if (!viewport || !plane) return

      const next = limit(x, y)
      offset.current = next
      plane.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`

      if (coordsRef.current) {
        const format = (value: number) =>
          String(Math.round(clamp(value, 0, 100))).padStart(3, "0")
        const centreX =
          ((viewport.clientWidth / 2 - next.x) / plane.offsetWidth) * 100
        const centreY =
          ((viewport.clientHeight / 2 - next.y) / plane.offsetHeight) * 100
        coordsRef.current.textContent = `X ${format(centreX)} · Y ${format(centreY)}`
      }
    },
    [limit]
  )

  const glideTo = useCallback(
    (x: number, y: number, duration = 520) => {
      cancelAnimationFrame(motionFrame.current)
      const target = limit(x, y)

      if (prefersReducedMotion()) {
        moveTo(target.x, target.y)
        return
      }

      const from = { ...offset.current }
      const started = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        moveTo(
          from.x + (target.x - from.x) * eased,
          from.y + (target.y - from.y) * eased
        )
        if (progress < 1) motionFrame.current = requestAnimationFrame(step)
      }
      motionFrame.current = requestAnimationFrame(step)
    },
    [limit, moveTo]
  )

  const centre = useCallback(
    (animate: boolean) => {
      const viewport = viewportRef.current
      const plane = planeRef.current
      if (!viewport || !plane) return
      const x = (viewport.clientWidth - plane.offsetWidth) / 2
      const y = (viewport.clientHeight - plane.offsetHeight) / 2
      if (animate) glideTo(x, y, 700)
      else moveTo(x, y)
    },
    [glideTo, moveTo]
  )

  useEffect(() => {
    const viewport = viewportRef.current
    const plane = planeRef.current
    if (!viewport || !plane) return

    /* Coming back from an artwork page (/explore?work=slug) lands on that
       work rather than the middle of the wall. */
    const returningTo = new URLSearchParams(window.location.search).get("work")
    const work = returningTo
      ? plane.querySelector<HTMLElement>(
          `[data-work="${CSS.escape(returningTo)}"]`
        )
      : null

    if (work) {
      moveTo(
        viewport.clientWidth / 2 - work.offsetLeft,
        viewport.clientHeight / 2 - work.offsetTop
      )
      /* Used once, then dropped from the address, so a later return to this
         page does not jump back to the same work. */
      window.history.replaceState(null, "", window.location.pathname)
    } else if (!hasMounted.current) {
      centre(false)
    } else {
      /* Next keeps this page alive while other pages are open and runs this
         again on return (the browser's back button, say). The wall stays
         where it was left. */
      moveTo(offset.current.x, offset.current.y)
    }
    hasMounted.current = true

    /* A non-passive listener, so two-finger scrolling pans the wall instead
       of bouncing the page. Pinch-zoom (ctrl + wheel) is left alone. */
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      if ((event.target as HTMLElement).closest("[data-card-panel]")) return
      event.preventDefault()
      cancelAnimationFrame(motionFrame.current)
      const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1
      moveTo(
        offset.current.x - event.deltaX * scale,
        offset.current.y - event.deltaY * scale
      )
    }
    const onResize = () => moveTo(offset.current.x, offset.current.y)

    viewport.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("resize", onResize)

    return () => {
      viewport.removeEventListener("wheel", onWheel)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(motionFrame.current)
      window.clearTimeout(hoverTimer.current)
    }
  }, [centre, moveTo])

  /* ---------- Opening and closing a work ---------- */

  const closeActive = useCallback(() => setActive(null), [])

  /* Leaving the page hides it rather than discarding it, so an open card or
     sheet would still be open on return. Close them on the way out. */
  useLayoutEffect(() => {
    return () => {
      setActive(null)
      setSheet(null)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [active])

  /* Works out which side of the image the card should sit on, given where
     the work is on screen (optionally after a pending move of the wall). */
  const place = useCallback(
    (image: HTMLElement, shiftX = 0, shiftY = 0): Placement => {
      const bounds = viewportRef.current!.getBoundingClientRect()
      const rect = image.getBoundingClientRect()
      const left = rect.left + shiftX
      const right = rect.right + shiftX
      const needed = CARD_WIDTH + CARD_GAP + EDGE

      const roomRight = bounds.right - right
      const roomLeft = left - bounds.left - RAIL
      const side: Placement["side"] =
        roomRight >= needed || roomRight >= roomLeft ? "right" : "left"
      const room = side === "right" ? roomRight : roomLeft

      const top = rect.top + shiftY
      const bottom = rect.bottom + shiftY
      const overflowsBelow = top + CARD_HEIGHT_ESTIMATE > bounds.bottom - EDGE
      const fitsAbove = bottom - CARD_HEIGHT_ESTIMATE >= bounds.top + EDGE

      return {
        side,
        align: overflowsBelow && fitsAbove ? "bottom" : "top",
        nudge: Math.max(0, needed - room),
      }
    },
    []
  )

  /* The move needed to bring a work and its card fully on screen. */
  const shiftIntoView = useCallback(
    (image: HTMLElement, side: Placement["side"]) => {
      const bounds = viewportRef.current!.getBoundingClientRect()
      const rect = image.getBoundingClientRect()
      const card = CARD_WIDTH + CARD_GAP

      const boxLeft = side === "left" ? rect.left - card : rect.left
      const boxRight = side === "right" ? rect.right + card : rect.right
      const minLeft = bounds.left + RAIL + EDGE
      const maxRight = bounds.right - EDGE
      const minTop = bounds.top + EDGE
      const maxBottom = bounds.bottom - 72

      let x = 0
      let y = 0
      if (boxLeft < minLeft) x = minLeft - boxLeft
      else if (boxRight > maxRight) x = maxRight - boxRight
      if (rect.top < minTop) y = minTop - rect.top
      else if (rect.bottom > maxBottom) {
        y = Math.max(maxBottom - rect.bottom, minTop - rect.top)
      }

      /* Only as far as the wall can actually travel. */
      const target = limit(offset.current.x + x, offset.current.y + y)
      return {
        x: target.x - offset.current.x,
        y: target.y - offset.current.y,
      }
    },
    [limit]
  )

  const open = useCallback(
    (slug: string, image: HTMLElement, options: { pin: boolean; reveal: boolean }) => {
      let placement = place(image)
      if (options.reveal) {
        const shift = shiftIntoView(image, placement.side)
        if (shift.x || shift.y) {
          glideTo(offset.current.x + shift.x, offset.current.y + shift.y)
        }
        placement = { ...place(image, shift.x, shift.y), side: placement.side }
      }
      setPlacements((current) => ({ ...current, [slug]: placement }))
      setActive((current) =>
        !options.pin && current?.pinned ? current : { slug, pinned: options.pin }
      )
    },
    [glideTo, place, shiftIntoView]
  )

  const imageOf = (element: HTMLElement) =>
    element
      .closest("[data-work]")
      ?.querySelector<HTMLElement>("[data-work-image]") ?? element

  const onWorkEnter = (slug: string, event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || drag.current?.moved) return
    if (!window.matchMedia(WIDE_QUERY).matches) return
    const image = imageOf(event.currentTarget)
    window.clearTimeout(hoverTimer.current)
    /* A short pause, so sweeping the pointer across the wall does not set
       off every card on the way. */
    hoverTimer.current = window.setTimeout(() => {
      open(slug, image, { pin: false, reveal: false })
    }, 110)
  }

  const onWorkLeave = (slug: string) => {
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => {
      setActive((current) =>
        current && !current.pinned && current.slug === slug ? null : current
      )
    }, 90)
  }

  const onWorkClick = (slug: string, button: HTMLElement) => {
    if (ignoreClick.current) return
    window.clearTimeout(hoverTimer.current)

    const touch = pointerType.current !== "mouse"
    if (touch || !window.matchMedia(WIDE_QUERY).matches) {
      setActive(null)
      setSheet({ slug, open: true })
      return
    }

    if (active?.pinned && active.slug === slug) {
      setActive(null)
      return
    }
    open(slug, imageOf(button), { pin: true, reveal: true })
  }

  const onWorkFocus = (slug: string, button: HTMLElement) => {
    if (!button.matches(":focus-visible")) return
    if (!window.matchMedia(WIDE_QUERY).matches) return
    open(slug, imageOf(button), { pin: false, reveal: true })
  }

  const onWorkBlur = (slug: string) => {
    setActive((current) =>
      current && !current.pinned && current.slug === slug ? null : current
    )
  }

  /* ---------- Dragging ---------- */

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerType.current = event.pointerType
    ignoreClick.current = false
    if (event.pointerType === "mouse" && event.button !== 0) return
    /* Leave the open card alone, so its text can be selected. */
    if ((event.target as HTMLElement).closest("[data-card-panel]")) return

    cancelAnimationFrame(motionFrame.current)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.current.x,
      originY: offset.current.y,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocityX: 0,
      velocityY: 0,
      moved: false,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return

    const deltaX = event.clientX - current.startX
    const deltaY = event.clientY - current.startY

    if (!current.moved) {
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return
      current.moved = true
      ignoreClick.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      window.clearTimeout(hoverTimer.current)
      setDragging(true)
      setActive((value) => (value?.pinned ? value : null))
    }

    const elapsed = Math.max(1, event.timeStamp - current.lastTime)
    current.velocityX =
      0.75 * ((event.clientX - current.lastX) / elapsed) + 0.25 * current.velocityX
    current.velocityY =
      0.75 * ((event.clientY - current.lastY) / elapsed) + 0.25 * current.velocityY
    current.lastX = event.clientX
    current.lastY = event.clientY
    current.lastTime = event.timeStamp

    moveTo(current.originX + deltaX, current.originY + deltaY)
  }

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    drag.current = null
    if (!current.moved) return

    setDragging(false)

    /* Let the wall coast to a stop, unless the pointer had already paused
       or the visitor has asked for reduced motion. */
    const paused = event.timeStamp - current.lastTime > 90
    if (paused || prefersReducedMotion()) return

    let velocityX = current.velocityX * 16
    let velocityY = current.velocityY * 16
    const coast = () => {
      velocityX *= 0.935
      velocityY *= 0.935
      if (Math.abs(velocityX) < 0.25 && Math.abs(velocityY) < 0.25) return
      moveTo(offset.current.x + velocityX, offset.current.y + velocityY)
      motionFrame.current = requestAnimationFrame(coast)
    }
    motionFrame.current = requestAnimationFrame(coast)
  }

  const onBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreClick.current) return
    if ((event.target as HTMLElement).closest("[data-work]")) return
    closeActive()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 360 : 140
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    glideTo(offset.current.x + move[0], offset.current.y + move[1], 240)
  }

  const sheetWork = sheet
    ? works.find((work) => work.slug === sheet.slug)
    : undefined

  return (
    <div
      ref={viewportRef}
      role="application"
      aria-label="Explore wall. Drag, scroll or use the arrow keys to move around."
      className={cn(
        "relative mt-(--bar) h-[calc(100dvh-var(--bar))] touch-none overflow-hidden overscroll-none select-none",
        dragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClick={onBackgroundClick}
      onKeyDown={onKeyDown}
    >
      <div ref={planeRef} className="explore-plane absolute top-0 left-0">
        {works.map((work) => {
          const isActive = active?.slug === work.slug
          const isPinned = isActive && active.pinned
          const placement = placements[work.slug] ?? {
            side: "right",
            align: "top",
            nudge: 0,
          }
          const direction = placement.side === "right" ? 1 : -1

          return (
            <div
              key={work.slug}
              data-work={work.slug}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ease-settle",
                isActive ? "z-30" : "z-10",
                active && !isActive && "opacity-30"
              )}
              style={{
                left: `${work.explore.x}%`,
                top: `${work.explore.y}%`,
                width: `${work.explore.w}%`,
              }}
              onPointerEnter={(event) => onWorkEnter(work.slug, event)}
              onPointerLeave={() => onWorkLeave(work.slug)}
            >
              <button
                type="button"
                aria-expanded={isActive}
                aria-controls={`card-${work.slug}`}
                className="group relative z-10 block w-full cursor-pointer text-left outline-none"
                onClick={(event) => onWorkClick(work.slug, event.currentTarget)}
                onFocus={(event) => onWorkFocus(work.slug, event.currentTarget)}
                onBlur={() => onWorkBlur(work.slug)}
              >
                <Image
                  data-work-image
                  src={work.image.src}
                  alt={work.title}
                  width={work.image.width}
                  height={work.image.height}
                  sizes="(min-width: 1280px) 470px, (min-width: 768px) 380px, 260px"
                  placeholder={work.image.blurDataURL ? "blur" : "empty"}
                  blurDataURL={work.image.blurDataURL}
                  draggable={false}
                  className={cn(
                    "h-auto w-full bg-muted transition-[scale,box-shadow] duration-500 ease-settle group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-foreground",
                    isActive &&
                      "scale-[1.025] shadow-[0_30px_70px_-28px_rgb(26_27_31/0.45)]"
                  )}
                />
                <span className="mt-3 flex items-baseline justify-between gap-3 font-mono text-[0.6875rem] tracking-[0.14em] uppercase">
                  <span>{work.title}</span>
                  {work.year && (
                    <span className="text-muted-foreground">{work.year}</span>
                  )}
                </span>
              </button>

              {/* The card. Its padding bridges the gap to the image, so the
                  pointer can travel across without the card closing. */}
              <div
                id={`card-${work.slug}`}
                inert={!isActive}
                className={cn(
                  "absolute w-[364px] cursor-auto transition-[opacity,translate,scale] duration-500 ease-settle select-text",
                  placement.side === "right"
                    ? "left-full origin-left pl-6"
                    : "right-full origin-right pr-6",
                  placement.align === "top" ? "top-0" : "bottom-10",
                  isActive
                    ? "z-20 scale-100 opacity-100"
                    : "pointer-events-none z-0 scale-[0.96] opacity-0"
                )}
                style={{
                  translate: `${
                    isActive ? -direction * placement.nudge : -direction * 44
                  }px 0`,
                }}
              >
                <div
                  data-card-panel
                  className="max-h-[min(31rem,calc(100dvh-6rem))] overflow-y-auto rounded-[0.75rem] bg-(--glass-raised) p-6 shadow-[0_0_0_1px_rgb(26_27_31/0.08),0_30px_70px_-24px_rgb(26_27_31/0.34)] backdrop-blur-2xl backdrop-saturate-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {work.type && (
                        <p className="eyebrow text-muted-foreground">
                          {work.type}
                        </p>
                      )}
                      <h2 className="text-xl leading-snug text-balance">
                        {work.title}
                      </h2>
                      {work.year && (
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {work.year}
                        </p>
                      )}
                    </div>
                    {isPinned && (
                      <button
                        type="button"
                        onClick={closeActive}
                        className={cn(quietLink, "shrink-0 cursor-pointer pt-1")}
                      >
                        Close
                      </button>
                    )}
                  </div>

                  <ArtworkDetails work={work} className="mt-5" />

                  <Link
                    href={artworkHref(work.slug, true)}
                    className={cn(quietLink, "mt-6 inline-block")}
                  >
                    View work →
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 pl-(--rail)">
        <div className="flex items-end justify-between gap-4 px-5 pb-5 md:px-8">
          <p className={chip}>
            <span className="md:hidden">Drag to explore · Tap a work</span>
            <span className="hidden md:inline">
              Drag or scroll to explore · Click a work to pin it
            </span>
          </p>
          <div className="flex items-center gap-2">
            <span
              ref={coordsRef}
              aria-hidden
              className={cn(chip, "hidden tabular-nums sm:inline")}
            />
            <button
              type="button"
              onClick={() => {
                closeActive()
                centre(true)
              }}
              className={cn(
                chip,
                "pointer-events-auto cursor-pointer outline-none hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
              )}
            >
              Recentre
            </button>
          </div>
        </div>
      </div>

      <Sheet
        open={sheet?.open ?? false}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSheet((value) => value && { ...value, open: false })
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[88dvh] cursor-auto gap-0 overflow-y-auto rounded-t-[0.75rem] select-text"
        >
          {sheetWork && (
            <>
              {/* The sheet covers the wall, so it shows the work it is
                  about. The whole image is shown, never cropped, and the
                  top padding keeps the Close button off it. */}
              <div className="flex justify-center bg-muted px-5 pt-13 pb-6">
                <Image
                  key={sheetWork.slug}
                  src={sheetWork.image.src}
                  alt=""
                  width={sheetWork.image.width}
                  height={sheetWork.image.height}
                  sizes="(min-width: 768px) 480px, 75vw"
                  placeholder={sheetWork.image.blurDataURL ? "blur" : "empty"}
                  blurDataURL={sheetWork.image.blurDataURL}
                  draggable={false}
                  className="h-auto max-h-[38dvh] w-auto max-w-full"
                />
              </div>
              <SheetClose
                className={cn(
                  chip,
                  "absolute top-3 right-3 cursor-pointer outline-none hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
                )}
              >
                Close
              </SheetClose>

              <SheetHeader className="px-5 pt-5">
                <SheetTitle className="text-xl font-normal">
                  {sheetWork.title}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {[sheetWork.type, sheetWork.year].filter(Boolean).join(" · ") ||
                    "Artwork details"}
                </SheetDescription>
              </SheetHeader>
              <div className="px-5 pt-2 pb-8">
                <ArtworkDetails work={sheetWork} />
                <Link
                  href={artworkHref(sheetWork.slug, true)}
                  className={cn(quietLink, "mt-6 inline-block")}
                >
                  View work →
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
