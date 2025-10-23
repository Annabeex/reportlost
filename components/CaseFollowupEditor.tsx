// components/CaseFollowupEditor.tsx
"use client";

import * as React from "react";
import type { FollowupBlock } from "./CaseFollowup";

type Block = FollowupBlock;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaults(publicId?: string): Block[] {
  const anon = publicId ? `item${publicId}@reportlost.org` : "your case inbox";
  return [
    {
      id: uid(),
      title: "Database & Partners searches",
      paragraphs: [
        "We search the full spectrum of public and partner lost-&-found sources that are most likely to list found items in your area: national & regional aggregators, municipal pages, transit & airport listings, university systems, police logs, classifieds, and active local groups and create alerts for the report keywords",
        [
          "✅ Search in the Reportmyloss database",
          "✅ Search in the foundrop database",
          "✅ Search in the chargerback database",
          "✅ Search in the iLost.co united states database",
          "✅ Search in the Lost-and-found.org database",
        ].join("\n"),
        "Current result: No exact match found at time of publication. We repeat these checks automatically and manually",
      ],
    },
    {
      id: uid(),
      title: "Local notifications & Authority outreach",
      paragraphs: [
        "We notify local lost & found desks and common drop-off points when relevant: police non-emergency lines, transit agencies, airport lost & found, and nearby institutions (hotels, hospitals, universities). We include your report reference so physical returns can be matched quickly.",
        "✅ NYPD units covering East River Park — the 7th Precinct (Lower East Side) and the 9th Precinct (East Village). For best results, please call the lost and found office, or visit the office in person with proof of ownership if you have.",
      ],
    },
    {
      id: uid(),
      title: "Anonymous Contact Address - Safety & Anti-Scam Measures",
      paragraphs: [
        `✅ We created a case-specific anonymous inbox: **${anon}** . Finders can message this address; our moderators screen messages and forward verified leads to you. Your personal email is never published publicly in the social media.`,
        "Our team ensures the veracity of the content of the messages received and filters unsolicited emails (advertising, spam, scam attempts, etc.).",
      ],
    },
    {
      id: uid(),
      title: "Online publication & Accessibility",
      paragraphs: [
        "Your public report is live in our database and partners such as lost-found.org. Optimized for desktop, tablet and mobile. We publish structured metadata to help search engines find and index the listing.",
      ],
    },
    {
      id: uid(),
      title: "Search Engines & Feed Distribution",
      paragraphs: [
        "We submit the report to major search engines and our syndicated feeds. This helps crawlers discover the listing faster, indexing timing is controlled by the search engines themselves.",
        ["✅ Google", "✅ Bing", "✅ Yahoo!", "✅ DuckDuckGo, Yandex Search, Ecosia, Aol, Ask"].join("\n"),
      ],
    },
    {
      id: uid(),
      title: "Social Media & Community Posting",
      paragraphs: [
        "We post the report to our public Facebook page and local groups, prepare a Nextdoor template, and publish short alerts on X and Instagram. Facebook and Nextdoor are typically the most effective for recoveries; Instagram and TikTok are supplementary.",
        "Facebook wallets group, Facebook NY and lost and found groups",
      ],
    },
    {
      id: uid(),
      title: "Specialist Channels & Partners",
      paragraphs: [
        "When appropriate we push the listing to specialized networks (pet recovery platforms, resale marketplaces, institutional pages) and local classified boards.",
      ],
    },
    {
      id: uid(),
      title: "Automated Monitoring & Human Verification",
      paragraphs: [
        "We combine automated scans, image-similarity checking, and human review. Active monitoring runs with multiple daily checks.",
      ],
    },
    {
      id: uid(),
      title: "What Happens If We Find a Match",
      paragraphs: [
        "We verify photos and identifying marks.",
        "We request verification photos from the finder via the anonymous inbox.",
        "We notify you immediately with instructions; we never publish your private data.",
        "We advise a safe, public handoff and coordinate with police if needed.",
      ],
    },
  ];
}

export default function CaseFollowupEditor({
  publicId,
  firstName = "",
  userEmail = "",
}: {
  publicId: string;
  firstName?: string;
  userEmail?: string;
}) {
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = React.useState(false);

  // computed email preview
  const site =
    (typeof window !== "undefined" && window.location?.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://reportlost.org";
  const caseUrl = `${site}/case/${encodeURIComponent(publicId)}`;

  const emailSubject = "Your case follow-up summary";
  const emailText = `Hello ${firstName || ""},

A summary of the actions we have taken for your lost item report is available online:
${caseUrl}

We will keep you updated as soon as we have any news or a potential match.

— ReportLost.org`;

  // Load from API, seed defaults if empty
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/case_followup/${encodeURIComponent(publicId)}`, { cache: "no-store" });
        const j = await res.json().catch(() => null);
        if (!mounted) return;

        const b = Array.isArray(j?.blocks) ? (j.blocks as Block[]) : [];
        if (b.length > 0) {
          setBlocks(b);
        } else {
          setBlocks(defaults(publicId));
          setDirty(true);
        }
      } catch {
        setBlocks(defaults(publicId));
        setDirty(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [publicId]);

  const save = async () => {
    const res = await fetch(`/api/case_followup/${encodeURIComponent(publicId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    if (!res.ok) {
      alert("Save failed");
      return;
    }
    setDirty(false);
  };

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: uid(), title: "New block", paragraphs: ["New paragraph…"] },
    ]);
    setDirty(true);
  };

  const removeBlock = (id?: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setDirty(true);
  };

  const move = (id: string | undefined, dir: -1 | 1) => {
    if (!id) return;
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = prev.slice();
      const [x] = copy.splice(i, 1);
      copy.splice(j, 0, x);
      return copy;
    });
    setDirty(true);
  };

  const updateTitle = (id: string | undefined, title: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
    setDirty(true);
  };

  const updateParagraph = (id: string | undefined, pi: number, val: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, paragraphs: b.paragraphs.map((p, i) => (i === pi ? val : p)) } : b
      )
    );
    setDirty(true);
  };

  const addParagraph = (id: string | undefined) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, paragraphs: [...b.paragraphs, "New paragraph…"] } : b))
    );
    setDirty(true);
  };

  const removeParagraph = (id: string | undefined, pi: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, paragraphs: b.paragraphs.filter((_, i) => i !== pi) } : b
      )
    );
    setDirty(true);
  };

  const openConfirm = () => {
    setSendError(null);
    setSendSuccess(false);
    setConfirmOpen(true);
  };

  const doSend = async () => {
    if (!userEmail) {
      setSendError("No recipient email found for this case.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: emailSubject,
          text: emailText,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setSendSuccess(true);
      setConfirmOpen(false);
    } catch (e: any) {
      setSendError(e?.message || "Unknown error");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading editor…</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`/case/${encodeURIComponent(publicId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-emerald-600 text-emerald-700 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-50"
          title="Open the public page in a new tab"
        >
          Preview
        </a>

        <button
          className="rounded-md bg-emerald-700 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          onClick={openConfirm}
          disabled={!userEmail || sending}
          title={userEmail ? "Send email to the user" : "No user email on file"}
        >
          {sending ? "Sending…" : "Send"}
        </button>

        <span className="mx-3 h-5 w-px bg-gray-300" />

        <button
          className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          onClick={save}
          disabled={!dirty}
          title={dirty ? "Save changes" : "No changes"}
        >
          Save
        </button>

        <button
          className="rounded-md border px-3 py-1.5 text-sm"
          onClick={addBlock}
        >
          + Add block
        </button>

        {sendSuccess && (
          <span className="text-sm text-emerald-700">Email sent ✔︎</span>
        )}
        {sendError && (
          <span className="text-sm text-rose-700">Send failed: {sendError}</span>
        )}
      </div>

      {/* Blocks editor */}
      {blocks.map((b, idx) => (
        <div key={b.id ?? idx} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-white/80 border rounded-md px-3 py-2"
              value={b.title}
              onChange={(e) => updateTitle(b.id, e.target.value)}
            />
            <button className="px-2 py-1 border rounded" onClick={() => move(b.id, -1)} title="Move up">↑</button>
            <button className="px-2 py-1 border rounded" onClick={() => move(b.id, +1)} title="Move down">↓</button>
            <button
              className="px-3 py-1.5 rounded-md bg-red-600 text-white"
              onClick={() => removeBlock(b.id)}
              title="Delete block"
            >
              Delete
            </button>
          </div>

          {b.paragraphs.map((p, i) => (
            <div key={i} className="mt-3 relative">
              <textarea
                className="w-full min-h-[110px] bg-white/90 border rounded-md px-3 py-2"
                value={p}
                onChange={(e) => updateParagraph(b.id, i, e.target.value)}
              />
              <button
                className="absolute top-2 right-2 bg-rose-100 text-rose-700 border border-rose-200 rounded px-2 py-1 text-xs"
                onClick={() => removeParagraph(b.id, i)}
                title="Remove paragraph"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="mt-3">
            <button
              className="rounded-md border px-3 py-1.5 text-sm"
              onClick={() => addParagraph(b.id)}
            >
              + Add paragraph
            </button>
          </div>

          <div className="mt-5 border-t pt-3 text-xs text-gray-500">PREVIEW</div>
          <div className="mt-2 rounded-lg bg-emerald-50/60 p-4 space-y-2">
            <div className="font-semibold text-emerald-900">{b.title}</div>
            {b.paragraphs.map((p, i) => (
              <div key={i} className="text-gray-800 whitespace-pre-line leading-relaxed">
                {p}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          onClick={save}
          disabled={!dirty}
        >
          Save
        </button>
        {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => !sending && setConfirmOpen(false)} />
          <div className="relative z-10 w-[560px] max-w-[92vw] rounded-xl bg-white shadow-xl border">
            <div className="px-5 py-4 border-b">
              <div className="text-lg font-semibold">Confirm send</div>
              <div className="text-xs text-gray-500 mt-1">Email preview</div>
            </div>

            <div className="p-5 space-y-3">
              <div><span className="font-semibold">To:</span> {userEmail || "—"}</div>
              <div><span className="font-semibold">Subject:</span> {emailSubject}</div>
              <div>
                <span className="font-semibold">Message:</span>
                <pre className="mt-2 whitespace-pre-wrap rounded-md border bg-gray-50 p-3 text-sm">
{emailText}
                </pre>
              </div>
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                className="rounded-md border px-3 py-1.5 text-sm"
                onClick={() => setConfirmOpen(false)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-emerald-700 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110 disabled:opacity-60"
                onClick={doSend}
                disabled={sending}
              >
                {sending ? "Sending…" : "Send now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
