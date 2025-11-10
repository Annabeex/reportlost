// app/maximum-search/page.tsx
// Marketing/landing page for the "Maximum search" assistance level.
// - Tailwind CSS styling

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Check, Mail, Shield, Search, Bell, MapPin, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Maximum search — ReportLost",
  description:
    "Hands-on outreach to local Lost & Found desks, broad database checks, targeted alerts — plus a prevention kit with secure ID stickers.",
};

function Bulleted({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <Check aria-hidden className="mt-1 h-5 w-5" />
      <span>{children}</span>
    </li>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const ridParam = typeof searchParams?.rid === "string" ? searchParams!.rid : undefined;
  const contributeHref = `/report?go=contribute${ridParam ? `&rid=${encodeURIComponent(ridParam)}` : ""}`;

  // Put your file in /public/files/scan-demo.pdf
  const stickersPdfHref = "/files/scan-demo.pdf";

  return (
    <main className="min-h-screen bg-white text-gray-900 -mt-10">
      {/* HERO */}
      <section className="relative overflow-hidden -mt-10 md:-mt-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 text-white">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Left copy */}
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
                Maximum search
              </h1>
              <p className="mt-4 text-lg sm:text-xl/relaxed opacity-95">
                We actively contact local authorities and Lost &amp; Found desks, search large
                databases, and set up targeted alerts for you. Includes our prevention kit with
                secure ID stickers.
              </p>

              {/* Small note + learn more */}
              <div className="mt-5">
                <p className="text-sm sm:text-base">
                  <span className="font-semibold">Included:</span> an anonymous sticker sheet so you never lose your items again.
                </p>
                <Link
                  href="#whats-included"
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 font-semibold text-white ring-1 ring-white/40 backdrop-blur hover:bg-white/25"
                >
                  Learn more about the Maximum search plan
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={contributeHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-black/90 px-5 py-3 font-semibold text-white shadow-lg shadow-black/20 ring-emerald-200 transition hover:bg-black"
                >
                  Activate my search <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#whats-included"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 font-semibold text-white ring-1 ring-white/40 backdrop-blur hover:bg-white/25"
                >
                  See what’s included
                </Link>
              </div>

              {ridParam && (
                <p className="mt-2 text-sm opacity-80">
                  Report reference preserved (<span className="font-mono">rid</span> attached).
                </p>
              )}
            </div>

            {/* Right visual */}
            <div className="relative">
              {/* Place your image at /public/images/hero.png */}
              <Image
                src="/images/hero.png"
                alt="Examples of items with secure QR stickers (keys, passport, bottle, laptop)"
                width={900}
                height={700}
                className="w-full h-auto rounded-2xl shadow-lg shadow-black/20 ring-1 ring-white/20"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold">Outreach for you</h3>
            <p className="mt-2 text-gray-700">
              We notify and follow up with relevant Lost &amp; Found desks (transit, venues, and other likely
              locations) on your behalf.
            </p>
          </div>
          <div className="rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Search className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold">Broader search</h3>
            <p className="mt-2 text-gray-700">
              We search across large databases and public listings relevant to your case to catch potential matches.
            </p>
          </div>
          <div className="rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Bell className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold">Targeted alerts</h3>
            <p className="mt-2 text-gray-700">
              We set up monitoring and alerts so you’re quickly contacted if a credible match appears.
            </p>
          </div>
        </div>
      </section>

      {/* WHY NOW */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold">Why activate now?</h2>
            <p className="mt-3 text-gray-700">
              In the first 48 hours, items often move quickly between locations. Starting early increases the
              chances that staff recognize and route your item back to you.
            </p>
            <ul className="mt-6 space-y-3">
              <Bulleted>We contact local desks and keep the follow-up going for you.</Bulleted>
              <Bulleted>We check broad sources beyond a single agency or platform.</Bulleted>
              <Bulleted>We configure alerts and outreach to capture new signals fast.</Bulleted>
            </ul>
            <div className="mt-8">
              <Link
                href={contributeHref}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow hover:bg-emerald-700"
              >
                Activate my search <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold">What we’ll typically do</h3>
            <ul className="mt-4 space-y-3 text-gray-700">
              <Bulleted>Map likely places and contacts for your specific case.</Bulleted>
              <Bulleted>Send clear notices with photos/details when available.</Bulleted>
              <Bulleted>Log responses and perform timely follow-ups.</Bulleted>
              <Bulleted>Search public listings and aggregation sources.</Bulleted>
              <Bulleted>Set up alerts to be pinged on new potential matches.</Bulleted>
            </ul>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section id="whats-included" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl border p-6 sm:p-10 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            Included with Maximum search
          </span>
          <h2 className="mt-4 text-2xl font-bold">Prevention kit & secure stickers</h2>
          <p className="mt-3 max-w-3xl text-gray-700">
            You get a printable (PDF) sheet of secure ID stickers for your everyday items — luggage, keys, laptop,
            water bottle, or <b>anything you want to track</b>
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" /> Why they’re secure
              </h3>
              <p className="mt-2 text-gray-700">
                Each sticker routes finders to a <b>private, dedicated address we host for you</b>. People can contact
                you without your personal email or phone appearing on the object.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                <Bulleted>No personal contact info printed on the sticker.</Bulleted>
                <Bulleted>Messages reach you via a protected relay inbox.</Bulleted>
                <Bulleted>Quick scan with any smartphone camera (QR).</Bulleted>
              </ul>
            </div>
            <div className="rounded-2xl border p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Where to use them
              </h3>
              <p className="mt-2 text-gray-700">
                Keys, luggage tag, laptop, passport cover, water bottle, kid’s backpack, and more.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Keys</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Luggage</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Laptop</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Passport</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Water bottle</span>
              </div>
              <div className="mt-6">
                {/* Opens PDF in a new tab */}
                <Link
                  href={stickersPdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
                >
                  Preview the sticker sheet (PDF)
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href={contributeHref}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700"
            >
              Activate my search <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl border p-6 sm:p-10">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold">How long do you keep searching?</h3>
              <p className="mt-2 text-gray-700">
                We actively run the outreach and monitoring for the period stated during checkout (typically 30 days),
                and leave your report live for later matches.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Can I start without photos?</h3>
              <p className="mt-2 text-gray-700">
                Yes. Photos help, but we can start immediately with your description and update the report later.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Do the stickers expose my contact details?</h3>
              <p className="mt-2 text-gray-700">
                No. Stickers point to a private address hosted by us so finders can reach you without seeing your
                personal email or phone number.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
