import Link from "next/link"

const PAGES = [
  { href: "/artworks", label: "Artworks" },
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About & CV" },
  { href: "/contact", label: "Contact" },
]

/* The large ruled list of pages on the home page. */
export function PageIndex() {
  return (
    <nav aria-label="Pages" className="pl-(--rail)">
      <ul className="mx-5 my-20 border-t border-foreground md:mx-12 md:my-28 lg:mx-14">
        {PAGES.map((page) => (
          <li key={page.href} className="border-b border-foreground">
            <Link
              href={page.href}
              className="group display flex items-center justify-between gap-6 py-3 outline-none md:py-4"
            >
              <span className="transition-transform duration-500 ease-settle group-hover:translate-x-3 group-focus-visible:translate-x-3">
                {page.label}
              </span>
              <span
                aria-hidden
                className="-translate-x-3 font-mono text-base opacity-0 transition duration-500 ease-settle group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
