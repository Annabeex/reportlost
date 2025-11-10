// app/scan-demo/page.tsx
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Scan demo — ReportLost",
  description:
    "Example of what a finder sees after scanning your secure QR sticker.",
};

export default function Page() {
  const mailExample = `Hi! I found an item with your QR (ID #12345).
Found near Union Station at 6:30 pm. I can hold it for pickup.
— Alex`;

  const stickersPaymentLink =
    process.env.NEXT_PUBLIC_STICKERS_PAYMENT_LINK || "/stickers";

  return (
    <main className="min-h-screen bg-white -mt-10">{/* ✅ marge haute réduite */}
      {/* HERO (compact) */}
      <section className="relative overflow-hidden -mt-10 md:-mt-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-white">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Scan demo</h1>
          <p className="mt-2 opacity-95">
            This is the page a finder could see after scanning a “SCAN ME” sticker.
            It shows the kind of message they might send, and where stickers can be placed.
          </p>
        </div>
      </section>

      {/* Two columns: sample message + visual */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* LEFT */}
          <div className="rounded-2xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Suggested message</h2>
            <p className="mt-2 text-gray-600">
              The finder can copy or adapt this message. Your personal email stays
              private — replies are relayed by our system.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 border p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">
{mailExample}
              </pre>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Tip: if the finder adds a photo or a pickup location, it can help you confirm it’s yours.
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* Achat stickers seul (12$) */}
              <Link
                href={stickersPaymentLink}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                Order the stickers PDF — $12
              </Link>

              {/* Rappel : inclus dans Maximum search */}
              <Link
                href="/maximum-search"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50"
              >
                Included free with Maximum search
              </Link>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              No report needed to order the PDF. You’ll receive a printable sheet with
              secure stickers that route finders to a private relay address (no personal email/phone exposed).
            </p>
          </div>

          {/* RIGHT */}
          <div className="rounded-2xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Where you can put them</h2>
            <p className="mt-2 text-gray-600">
              Stickers are small and discreet. Keys, luggage tag, laptop, passport, water bottle —{" "}
              <b>anything you want to track</b>.
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border">
              <Image
                src="/images/where-to-put-them.jpg"
                alt="Examples: keys, luggage tag, laptop, passport, water bottle with secure QR stickers"
                width={1200}
                height={1600}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
