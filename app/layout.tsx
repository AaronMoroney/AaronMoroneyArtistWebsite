import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import { SiteNav } from "@/components/site-nav"
import { getSite } from "@/lib/content"

import "./globals.css"

const site = getSite()

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: `The work of artist ${site.name}.`,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteNav
          name={site.name}
          email={site.email}
          artsy={site.artsy}
          instagram={site.instagram}
        />
        <main>{children}</main>
      </body>
    </html>
  )
}
