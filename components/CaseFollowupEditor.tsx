// components/CaseFollowupEditor.tsx
"use client";

import * as React from "react";
import type { FollowupBlock } from "./CaseFollowup";

type Block = FollowupBlock & { id: string };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Autorise **bold** ou <strong>…</strong> et garde les sauts de ligne */
function toSafeHTML(text: string): string {
  let s = String(text ?? "");
  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/&lt;strong&gt;/g, "<strong>").replace(/&lt;\/strong&gt;/g, "</strong>");
  s = s.replace(/\r?\n/g, "<br />");
  return s;
}

/** Defaults initiaux (remplacés par localStorage si présents) */
function baseDefaults(publicId?: string): Block[] {
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
        "✅ NYPD units covering East River Park — the 7th Precinct (Lower East Side) and the 9th Precinct (East Village). For best results, please call the lost and found office or visit the office in person with proof of ownership if you have.",
      ],
    },
    {
      id: uid(),
      title: "Anonymous Contact Address - Safety & Anti-Scam Measures",
      paragraphs: [
        `✅ We created a case-specific anonymous inbox: **${anon}**. Finders can message this address; our moderators screen messages and forward verified leads to you. Your personal email is never published publicly in the social media.`,
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

/** Applique les modèles personnalisés (localStorage) par titre */
function applyLocalDefaults(blocks: Block[]): Block[] {
  if (typeof window === "undefined") return blocks;
  try {
    const raw = localStorage.getItem("rl_block_defaults_by_title");
    if (!raw) return blocks;
    const map = JSON.parse(raw) as Record<string, { title: string; paragraphs: string[] }>;
    return blocks.map((b) =>
      map[b.title]?.paragraphs?.length
        ? { ...b, paragraphs: map[b.title].paragraphs.slice() }
        : b
    );
  } catch {
    return blocks;
  }
}

export default function CaseFollowupEditor({
  publicId,
  firstName,
  userEmail,
}: {
  publicId: string;
  firstName?: string;
  userEmail?: string;
}) {
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // quels blocs sont en mode édition (par défaut: aucun)
  const [editing, setEditing] = React.useState<Record<string, boolean>>({});

  // 🏁 état visuel d’envoi de mail
  const [followupInfo, setFollowupInfo] = React.useState<{
    sent: boolean;
    sentAt?: string;
    to?: string | null;
  }>({ sent: false });

  // Chargement depuis DB + pré-remplissage
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/case_followup/${encodeURIComponent(publicId)}`, { cache: "no-store" });
        const j = await res.json().catch(() => null);

        if (!mounted) return;
        const b = Array.isArray(j?.blocks) ? (j.blocks as Block[]) : [];

        // ⬇️ renseigne le drapeau de suivi s’il vient de l’API
        setFollowupInfo(j?.followup || { sent: false });

        if (b.length > 0) {
          const withIds = b.map((x) => ({ ...x, id: x.id || uid() }));
          setBlocks(withIds);
          setEditing(Object.fromEntries(withIds.map((x) => [x.id, false])));
        } else {
          const d = applyLocalDefaults(baseDefaults(publicId));
          setBlocks(d);
          setEditing(Object.fromEntries(d.map((x) => [x.id, false])));
          setDirty(true); // non enregistrées
        }
      } catch {
        const d = applyLocalDefaults(baseDefaults(publicId));
        setBlocks(d);
        setEditing(Object.fromEntries(d.map((x) => [x.id, false])));
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
    alert("Saved.");
  };

  // ——— Edits
  const addBlock = () => {
    const b: Block = { id: uid(), title: "New block", paragraphs: ["New paragraph…"] };
    setBlocks((prev) => [...prev, b]);
    setEditing((prev) => ({ ...prev, [b.id]: true })); // ouvre en édition
    setDirty(true);
  };
  const removeBlock = (id: string) => {
    setBlocks((p) => p.filter((b) => b.id !== id));
    setEditing((p) => {
      const { [id]: _, ...rest } = p;
      return rest;
    });
    setDirty(true);
  };
  const move = (id: string, dir: -1 | 1) => {
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
  const updateTitle = (id: string, title: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
    setDirty(true);
  };
  const updateParagraph = (id: string, pi: number, val: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, paragraphs: b.paragraphs.map((p, i) => (i === pi ? val : p)) } : b
      )
    );
    setDirty(true);
  };
  const addParagraph = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, paragraphs: [...b.paragraphs, "New paragraph…"] } : b))
    );
    setDirty(true);
  };
  const removeParagraph = (id: string, pi: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, paragraphs: b.paragraphs.filter((_, i) => i !== pi) } : b
      )
    );
    setDirty(true);
  };

  /** Wrap sélection avec **…** dans le textarea */
  const boldSelection = (id: string, pi: number) => {
    const area = document.getElementById(`para-${id}-${pi}`) as HTMLTextAreaElement | null;
    if (!area) return;
    const { selectionStart, selectionEnd, value } = area;
    if (selectionStart == null || selectionEnd == null || selectionEnd <= selectionStart) return;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);
    const next = `${before}**${selected}**${after}`;
    updateParagraph(id, pi, next);
    requestAnimationFrame(() => {
      area.focus();
      area.selectionStart = selectionStart + 2;
      area.selectionEnd = selectionEnd + 2;
    });
  };

  /** ❤️ Définir ce bloc comme modèle par défaut (localStorage, par titre).
   *  N'AFFECTE PAS le case en cours (ne touche pas `blocks` ni `dirty`). */
  const makeDefaultForTitle = (block: Block) => {
    try {
      const raw = localStorage.getItem("rl_block_defaults_by_title");
      const map = raw ? JSON.parse(raw) : {};
      map[block.title] = { title: block.title, paragraphs: block.paragraphs };
      localStorage.setItem("rl_block_defaults_by_title", JSON.stringify(map));
      alert(`Saved “${block.title}” as the new default for future cases.`);
    } catch {
      alert("Could not save default locally.");
    }
  };

  // ——— Preview button
  const onPreview = () => {
    window.open(`/case/${encodeURIComponent(publicId)}`, "_blank");
  };

  // ——— Send button (confirm)
  const onSend = async () => {
    const ok = window.confirm(
      `Send the follow-up email to ${firstName ? firstName + " " : ""}${userEmail || ""} ?`
    );
    if (!ok) return;

    const payload = {
      to: userEmail,
      subject: `Your lost item case update — ReportLost.org #${publicId}`,
      text: `Hello ${firstName || ""},

A summary of actions taken for your lost item report is available online:
https://reportlost.org/case/${publicId}

We will keep you informed as soon as we have any new information.`.replace(/\n{2,}/g, "\n\n"),
      publicId, // ⬅️ nécessaire pour marquer l’envoi côté API
    };

    try {
      const res = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));

      // Mise à jour optimiste de l’indicateur
      setFollowupInfo({
        sent: true,
        sentAt: new Date().toISOString(),
        to: userEmail || null,
      });

      alert("Email sent.");
    } catch {
      alert("Failed to send email.");
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading editor…</div>;

  return (
    <div className="space-y-4">
      {/* 🏁 État d’envoi de mail */}
      {followupInfo.sent ? (
        <div className="flex items-center gap-2 text-emerald-700 text-sm">
          <span>✅ Follow-up email sent</span>
          {followupInfo.sentAt && (
            <span className="text-gray-500">
              ({new Date(followupInfo.sentAt).toLocaleString()})
            </span>
          )}
          {followupInfo.to && (
            <span className="text-gray-500 italic">→ {followupInfo.to}</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-amber-700 text-sm">
          <span>⚠️ No follow-up email sent yet</span>
        </div>
      )}

      {/* Barre d’actions globale */}
      <div className="flex items-center gap-3">
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={onPreview}>
          Preview
        </button>
        <button
          className="rounded-md bg-emerald-700 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          onClick={onSend}
        >
          Send
        </button>
        {/* ✅ Save toujours cliquable */}
        <button
          className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          onClick={save}
        >
          Save
        </button>
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={addBlock}>
          + Add block
        </button>
        {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
      </div>

      {blocks.map((b, idx) => {
        const isEditing = !!editing[b.id];

        // ——— Mode PREVIEW (par défaut)
        if (!isEditing) {
          return (
            <div key={b.id} className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 border-b border-emerald-200">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                  </span>
                  <span className="font-semibold text-emerald-900 text-lg">{b.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                    onClick={() => setEditing((p) => ({ ...p, [b.id]: true }))}
                  >
                    ✏️ Modifier
                  </button>
                  {/* ❤️ ne touche PAS le case courant */}
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-pink-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                    onClick={() => makeDefaultForTitle(b)}
                    title="Set as default template (for future cases)"
                  >
                    ❤️
                  </button>
                </div>
              </div>
              <div className="px-6 py-5 leading-relaxed text-gray-900 bg-white">
                {b.paragraphs.map((p, i) => (
                  <div
                    key={i}
                    className="mb-4"
                    dangerouslySetInnerHTML={{ __html: toSafeHTML(p) }}
                  />
                ))}
              </div>
            </div>
          );
        }

        // ——— Mode EDIT (quand on clique sur ✏️)
        return (
          <div key={b.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-white/80 border rounded-md px-3 py-2"
                value={b.title}
                onChange={(e) => updateTitle(b.id, e.target.value)}
              />
              <button className="px-2 py-1 border rounded" onClick={() => move(b.id, -1)} title="Move up">
                ↑
              </button>
              <button className="px-2 py-1 border rounded" onClick={() => move(b.id, +1)} title="Move down">
                ↓
              </button>
              {/* ❤️ ici aussi, mais n'affecte pas le case courant */}
              <button
                className="px-3 py-1.5 rounded-md bg-pink-600 text-white"
                onClick={() => makeDefaultForTitle(b)}
                title="Set this block as new default template (by title)"
              >
                ❤️
              </button>
              <button
                className="px-3 py-1.5 rounded-md bg-red-600 text-white"
                onClick={() => removeBlock(b.id)}
                title="Delete block"
              >
                Delete
              </button>
              <button
                className="ml-auto px-3 py-1.5 rounded-md border"
                onClick={() => setEditing((p) => ({ ...p, [b.id]: false }))}
                title="Done editing"
              >
                Terminer
              </button>
            </div>

            {b.paragraphs.map((p, i) => (
              <div key={i} className="mt-3">
                {/* mini barre d’outils */}
                <div className="mb-1 flex items-center gap-2">
                  <button
                    className="px-2 py-1 rounded border text-xs"
                    onClick={() => boldSelection(b.id, i)}
                    title="Bold selection (**…**)"
                  >
                    Bold
                  </button>
                </div>

                <textarea
                  id={`para-${b.id}-${i}`}
                  className="w-full min-h-[110px] bg-white/90 border rounded-md px-3 py-2"
                  value={p}
                  onChange={(e) => updateParagraph(b.id, i, e.target.value)}
                  placeholder="Paragraph… (use line breaks for lists; **bold** supported)"
                />

                <div className="mt-2 flex justify-between">
                  <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => addParagraph(b.id)}>
                    + Add paragraph
                  </button>
                  <button
                    className="rounded-md border px-2 py-1 text-xs text-rose-700"
                    onClick={() => removeParagraph(b.id, i)}
                    title="Remove paragraph"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {/* APERÇU du bloc en cours d'édition */}
            <div className="mt-5 border-t pt-3 text-xs text-gray-500">PREVIEW</div>
            <div className="mt-2 rounded-lg bg-emerald-50/60 p-4 space-y-3">
              <div className="font-semibold text-emerald-900">{b.title}</div>
              {b.paragraphs.map((p, i) => (
                <div key={i} className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: toSafeHTML(p) }} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Barre d’actions bas de page */}
      <div className="flex items-center gap-3">
        {/* ✅ Save toujours cliquable */}
        <button
          className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          onClick={save}
        >
          Save
        </button>
        {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
      </div>
    </div>
  );
}
