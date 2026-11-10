import Link from "next/link"

import { PageHeader, PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <PageShell>
      <PageHeader eyebrow="404" title="Page not found" />
      <Button asChild variant="outline" size="xl" className="mb-20">
        <Link href="/">Back to home</Link>
      </Button>
    </PageShell>
  )
}
