"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ArtsyIcon, InstagramIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/artworks", label: "Artworks" },
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About & CV" },
  { href: "/contact", label: "Contact" },
]

function isCurrent(pathname: string | null, href: string) {
  if (!pathname) return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null
  onNavigate: () => void
}) {
  return (
    <ul className="my-auto">
      {LINKS.map((link, index) => {
        const current = isCurrent(pathname, link.href)
        return (
          <li
            key={link.href}
            className="nav-row border-b border-foreground/15 first:border-t"
            style={{ "--i": index } as CSSProperties}
          >
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className="group flex h-14 items-center gap-4 font-mono text-lg outline-none md:text-xl"
            >
              <span className="w-6 text-[0.6875rem] text-muted-foreground tabular-nums transition-colors group-hover:text-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="underline-offset-8 transition-transform duration-300 ease-settle group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5 group-focus-visible:underline">
                {link.label}
              </span>
              {current && (
                <span aria-hidden className="ml-auto size-1.5 bg-foreground" />
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/* Reads the current route so the active page can be marked. Kept in its own
   component so only this part waits on the URL. */
function CurrentNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  return <NavLinks pathname={pathname} onNavigate={onNavigate} />
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  const className = "grid size-10 place-items-center text-foreground"

  /* Until a URL is added in content/site.json the icon holds its place in
     the layout but is not a link. */
  if (!href) {
    return (
      <span
        role="img"
        aria-label={`${label} (link not added yet)`}
        title={`${label} link not added yet`}
        className={cn(className, "opacity-35")}
      >
        {children}
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        className,
        "opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-foreground"
      )}
    >
      {children}
    </a>
  )
}

export function SiteNav({
  name,
  email,
  artsy,
  instagram,
}: {
  name: string
  email: string
  artsy: string
  instagram: string
}) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const root = document.documentElement
    const { body } = document
    const scrollbar = window.innerWidth - root.clientWidth
    const previousOverflow = root.style.overflow
    const previousPadding = body.style.paddingRight

    /* Hold the page still behind the card without it jumping sideways. */
    root.style.overflow = "hidden"
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener("keydown", onKeyDown)

    return () => {
      root.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <>
      <div
        aria-hidden
        className="nav-scrim touch-none"
        data-open={open}
        onClick={close}
      />

      <header className="site-nav" data-open={open}>
        <div className="nav-bar">
          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle outline-none focus-visible:outline-2 focus-visible:outline-foreground"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>

          <Link
            href="/"
            onClick={close}
            aria-label={`${name}, home`}
            className="absolute top-1/2 left-1/2 block h-5 w-[7.5rem] -translate-x-1/2 -translate-y-[calc(50%-2px)] outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-foreground md:h-[15rem] md:w-10 md:-translate-x-[calc(50%+5px)] md:-translate-y-1/2"
          >
            <Image
              src="/logo.png"
              alt=""
              width={2186}
              height={361}
              sizes="240px"
              preload
              className="absolute top-1/2 left-1/2 w-[7.5rem] max-w-none -translate-x-1/2 -translate-y-1/2 md:w-[15rem] md:rotate-90"
            />
          </Link>

          <div className="flex items-center md:flex-col md:gap-1">
            <SocialLink href={artsy} label="Artsy">
              <ArtsyIcon />
            </SocialLink>
            <SocialLink href={instagram} label="Instagram">
              <InstagramIcon />
            </SocialLink>
          </div>
        </div>

        <nav
          id="site-menu"
          aria-label="Main"
          className="nav-panel"
          inert={!open}
        >
          <Suspense fallback={<NavLinks pathname={null} onNavigate={close} />}>
            <CurrentNavLinks onNavigate={close} />
          </Suspense>

          {email && (
            <a
              href={`mailto:${email}`}
              className="nav-row font-mono text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground focus-visible:underline"
              style={{ "--i": LINKS.length } as CSSProperties}
            >
              {email}
            </a>
          )}
        </nav>
      </header>
    </>
  )
}
