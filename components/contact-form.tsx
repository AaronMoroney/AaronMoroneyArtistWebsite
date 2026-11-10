"use client"

import type { FormEvent } from "react"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type WorkOption = { slug: string; title: string }

const fieldClass =
  "h-12 rounded-none border-foreground/30 bg-transparent px-3.5 text-base shadow-none focus-visible:border-foreground focus-visible:ring-0 md:text-base"

/*
 * There is no server behind this form. Sending opens the visitor's own email
 * app with the message filled in, addressed to the email in site.json.
 */
export function ContactForm({
  email,
  work,
}: {
  email: string
  work?: WorkOption
}) {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email) return

    const data = new FormData(event.currentTarget)
    const field = (name: string) => String(data.get(name) ?? "").trim()
    const name = field("name")

    const subject = work ? `Enquiry: ${work.title}` : `Enquiry from ${name}`
    const body = `${field("message")}\n\n${name}\n${field("email")}`

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {work && (
        <p className="border-b border-foreground/15 pb-4 text-sm">
          <span className="mr-3 font-mono text-[0.6875rem] tracking-[0.14em] text-muted-foreground uppercase">
            Regarding
          </span>
          {work.title}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={7}
          className={`${fieldClass} h-auto min-h-44 py-3`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button type="submit" variant="outline" size="xl" disabled={!email}>
          Send
        </Button>
        <p className="font-mono text-xs text-muted-foreground">
          {email
            ? "Opens your email app with the message ready to send."
            : "The contact address has not been added yet."}
        </p>
      </div>
    </form>
  )
}

/* Picks up ?work=slug, which the Enquire button on an artwork page adds. */
export function ContactFormForWork({
  email,
  works,
}: {
  email: string
  works: WorkOption[]
}) {
  const slug = useSearchParams().get("work")
  const work = works.find((option) => option.slug === slug)

  return <ContactForm email={email} work={work} />
}
