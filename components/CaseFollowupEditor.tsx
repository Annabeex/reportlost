"use client";

import * as React from "react";
import type { FollowupBlock } from "./CaseFollowup";

type Block = FollowupBlock & { id: string };

type NotesResp = { notes?: string | null } | null;

type FollowupInfo = {
  sent: boolean;
  sentAt?: string;
  to?: string | null;
};

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

/** Defaults initiaux (utilisés seulement si l’utilisateur clique “Insert template”) */
function baseDefaults(publicId?: string): Block[] {
  const anon = publicId ? `item${publicId}@reportlost.org` : "your case inbox";
  return [
    { id: uid(), title: "Database & Partners searches", paragraphs: [
      "We search the full spectrum of public and partner lost-&-found sources that are most likely to list found items in your area: national & regional aggregators, municipal pages, transit & airport listings, university systems, police logs, classifieds, and active local groups and create alerts for the report keywords",
      [
        "✅ Search in the Reportmyloss database",
        "✅ Search in the foundrop database",
        "✅ Search in the chargerback database",
        "✅ Search in the iLost.co united states database",
        "✅ Search in the Lost-and-found.org database",
      ].join("\n"),
      "Current result: No exact match found at time of publication. We repeat these checks automatically and manually",
    ]},
    { id: uid(), title: "Local notifications & Authority outreach", paragraphs: [
      "We notify local lost & found desks and common drop-off points when relevant: police non-emergency lines, transit agencies, airport lost & found, and nearby institutions (hotels, hospitals, universities). We include your report reference so physical returns can be matched quickly.",
      "✅ NYPD units covering East River Park — the 7th Precinct (Lower East Side) and the 9th Precinct (East Village). For best results, please call the lost and found office or visit the office in person with proof of ownership if you have.",
    ]},
    { id: uid(), title: "Anonymous Contact Address - Safety & Anti-Scam Measures", paragraphs: [
      `✅ We created a case-specific anonymous inbox: **${anon}**. Finders can message this address; our moderators screen messages and forward verified leads to you. Your personal email is never published publicly in the social media.`,
      "Our team ensures the veracity of the content of the messages received and filters unsolicited emails (advertising, spam, scam attempts, etc.).",
    ]},
    { id: uid(), title: "Online publication & Accessibility", paragraphs: [
      "Your public report is live in our database and partners such as lost-found.org. Optimized for desktop, tablet and mobile. We publish structured metadata to help search engines find and index the listing.",
    ]},
    { id: uid(), title: "Search Engines & Feed Distribution", paragraphs: [
      "We submit the report to major search engines and our syndicated feeds. This helps crawlers discover the listing faster, indexing timing is controlled by the search engines themselves.",
      ["✅ Google", "✅ Bing", "✅ Yahoo!", "✅ DuckDuckGo, Yandex Search, Ecosia, Aol, Ask"].join("\n"),
    ]},
    { id: uid(), title: "Social Media & Community Posting", paragraphs: [
      "We post the report to our public Facebook page and local groups, prepare a Nextdoor template, and publish short alerts on X and Instagram. Facebook and Nextdoor are typically the most effective for recoveries; Instagram and TikTok are supplementary.",
      "Facebook wallets group, Facebook NY and lost and found groups",
    ]},
    { id: uid(), title: "Specialist Channels & Partners", paragraphs: [
      "When appropriate we push the listing to specialized networks (pet recovery platforms, resale marketplaces, institutional pages) and local classified boards.",
    ]},
    { id: uid(), title: "Automated Monitoring & Human Verification", paragraphs: [
      "We combine automated scans, image-similarity checking, and human review. Active monitoring runs with multiple daily checks.",
    ]},
    { id: uid(), title: "What Happens If We Find a Match", paragraphs: [
      "We verify photos and identifying marks.",
      "We request verification photos from the finder via the anonymous inbox.",
      "We notify you immediately with instructions; we never publish your private data.",
      "We advise a safe, public handoff and coordinate with police if needed.",
    ]},
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

// ✅ simple validation d’email
function looksLikeEmail(s?: string | null) {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

// --- utilitaires fetch robustes ---
async function getJSON<T = any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` as string, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as T | null;
  } catch {
    return null;
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

  // État édition
  const [editing, setEditing] = React.useState<Record<string, boolean>>({});

  // Info envoi mail (restauré comme dans ta version longue)
  const [followupInfo, setFollowupInfo] = React.useState<FollowupInfo>({ sent: false });

  // 🗒️ Notes privées — en base
  const [notes, setNotes] = React.useState<string>("");
  const [notesSaving, setNotesSaving] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const notesTimer = React.useRef<number | null>(null);
  const lastNotesSent = React.useRef<string>("");

  // Brouillon local des blocs (filet de sécurité)
  const DRAFT_KEY = React.useMemo(() => `rl_blocks_draft_${publicId}`, [publicId]);
  const [restoredFromDraft, setRestoredFromDraft] = React.useState<boolean>(false);

  // Chargement initial (blocs + followup + notes) avec endpoints /notes et fallback
  React.useEffect(() => {
    let mounted = true;
    const ac = new AbortController();
    (async () => {
      try {
        const j = await getJSON<any>(`/api/case_followup/${encodeURIComponent(publicId)}`);
        if (!mounted) return;

        // followup info si présent
        const f: FollowupInfo = j?.followup ?? { sent: false };
        setFollowupInfo({
          sent: !!f?.sent,
          sentAt: f?.sentAt,
          to: f?.to ?? null,
        });

        // notes via endpoint dédié
        let serverNotes = "";
        const jn = (await getJSON<NotesResp>(
          `/api/case_followup/${encodeURIComponent(publicId)}/notes`
        )) as NotesResp;
        if (typeof jn?.notes === "string") serverNotes = jn.notes;
        // fallback si l’endpoint dédié n’existe pas (compat rétro)
        if (!serverNotes && typeof j?.notes === "string") serverNotes = j.notes;
        setNotes(serverNotes);
        lastNotesSent.current = serverNotes;

        // blocs
        const fromApi = Array.isArray(j?.blocks) ? (j.blocks as any[]) : null;
        if (fromApi && fromApi.length > 0) {
          const withIds = fromApi.map((x: any) => ({ ...x, id: x.id || uid() }));
          setBlocks(withIds);
          setEditing(Object.fromEntries(withIds.map((x: any) => [x.id, false])));
          setDirty(false);
          setRestoredFromDraft(false);
        } else {
          // tentative de restauration locale
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
              try {
                const parsed = JSON.parse(raw) as Block[];
                if (Array.isArray(parsed) && parsed.length) {
                  const norm = parsed.map((x) => ({ ...x, id: x.id || uid() }));
                  setBlocks(norm);
                  setEditing(Object.fromEntries(norm.map((x) => [x.id, false])));
                  setDirty(true);
                  setRestoredFromDraft(true);
                } else {
                  setBlocks([]);
                  setEditing({});
                }
              } catch {
                setBlocks([]);
                setEditing({});
              }
            } else {
              setBlocks([]);
              setEditing({});
            }
          } else {
            setBlocks([]);
            setEditing({});
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (notesTimer.current) window.clearTimeout(notesTimer.current);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId]);

  // Sauvegarde auto du brouillon local (blocs)
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(blocks));
      }
    } catch {}
  }, [DRAFT_KEY, blocks]);

  // Debounce autosave des notes → endpoint dédié, avec fallback legacy
  React.useEffect(() => {
    if (notes === lastNotesSent.current) {
      setNotesSaving("idle");
      return;
    }
    setNotesSaving("saving");
    if (notesTimer.current) window.clearTimeout(notesTimer.current);
    notesTimer.current = window.setTimeout(async () => {
      try {
        // essai endpoint /notes
        let ok = false;
        try {
          const res = await fetch(
            `/api/case_followup/${encodeURIComponent(publicId)}/notes?t=${Date.now()}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notes }),
              cache: "no-store",
            }
          );
          ok = res.ok;
        } catch {}

        // fallback vers endpoint legacy si /notes indispo
        if (!ok) {
          try {
            const res2 = await fetch(`/api/case_followup/${encodeURIComponent(publicId)}?t=${Date.now()}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
                cache: "no-store",
              }
            );
            ok = res2.ok;
          } catch {}
        }

        if (!ok) throw new Error("Save failed");
        lastNotesSent.current = notes;
        setNotesSaving("saved");
        setTimeout(() => setNotesSaving("idle"), 1200);
      } catch {
        setNotesSaving("error");
      }
    }, 600) as unknown as number;

    return () => {
      if (notesTimer.current) window.clearTimeout(notesTimer.current);
    };
  }, [notes, publicId]);

  const insertTemplate = () => {
    const d = applyLocalDefaults(baseDefaults(publicId));
    setBlocks(d);
    setEditing(Object.fromEntries(d.map((x) => [x.id, false])));
    setDirty(true);
  };

  const save = async () => {
    // Normalisation minimale
    const payload = blocks.map((b) => ({
      id: b.id,
      title: String(b.title || "").trim(),
      paragraphs: Array.isArray(b.paragraphs) ? b.paragraphs.map((p) => String(p ?? "")) : [],
    }));

    const res = await fetch(`/api/case_followup/${encodeURIComponent(publicId)}?t=${Date.now()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: payload }),
      cache: "no-store",
    });

    if (!res.ok) {
      let msg = `Save failed (HTTP ${res.status})`;
      try {
        const j = await res.json();
        if (j?.error) msg += ` — ${j.error}`;
      } catch {}
      alert(msg);
      return;
    }

    try {
      if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
    } catch {}

    setDirty(false);
    setRestoredFromDraft(false);
    alert("Saved.");
  };

  // ——— Edits
  const addBlock = () => {
    const b: Block = { id: uid(), title: "New block", paragraphs: ["New paragraph…"] };
    setBlocks((prev) => [...prev, b]);
    setEditing((prev) => ({ ...prev, [b.id]: true }));
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

  // ——— Preview button
  const onPreview = () => {
    window.open(`/case/${encodeURIComponent(publicId)}`, "_blank");
  };

  // ——— Send button (conserve l’UX originale et met à jour followupInfo visuellement)
  const onSend = async () => {
    const email = (userEmail || "").trim();
    if (!looksLikeEmail(email)) {
      alert("Missing or invalid recipient email for this case.");
      return;
    }
    const ok = window.confirm(
      `Send the follow-up email to ${firstName ? firstName + " " : ""}${email} ?`
    );
    if (!ok) return;

    const payload = {
      to: email,
      subject: `Your lost item case update — ReportLost.org #${publicId}`,
      text: `Hello ${firstName || ""},

A summary of actions taken for your lost item report is available online:
https://reportlost.org/case/${publicId}

We will keep you informed as soon as we have any new information.`.replace(/\n{2,}/g, "\n\n"),
      publicId,
      kind: "followup",
    };

    try {
      const res = await fetch("/api/send-mail?t=" + Date.now(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j && (j.error || j.code))
            msg = `${msg} — ${j.error || ""} ${j.code ? `(code ${j.code})` : ""}`.trim();
        } catch {}
        throw new Error(msg);
      }

      setFollowupInfo({ sent: true, sentAt: new Date().toISOString(), to: email });
      alert("Email sent.");
    } catch (e: any) {
      alert(`Failed to send email. ${e?.message ? `\n${e.message}` : ""}`);
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
            <span className="text-gray-500">({new Date(followupInfo.sentAt).toLocaleString()})</span>
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
        <button
          className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-semibold hover:brightness-110"
          onClick={save}
        >
          Save
        </button>
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={addBlock}>
          + Add block
        </button>

        {/* ➕ bouton d’insertion du modèle */}
        {blocks.length === 0 && (
          <button
            className="rounded-md border px-3 py-1.5 text-sm"
            onClick={insertTemplate}
            title="Insert the default template"
          >
            Insert template
          </button>
        )}

        {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
        {restoredFromDraft && (
          <span className="text-sm text-blue-700">Draft restored from this browser</span>
        )}
      </div>

      {/* 🗒️ Notes (en base) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Notes (private)</div>
          <span
            className={`text-xs ${
              notesSaving === "saving"
                ? "text-blue-600"
                : notesSaving === "saved"
                ? "text-emerald-700"
                : notesSaving === "error"
                ? "text-rose-700"
                : "text-gray-500"
            }`}
          >
            {notesSaving === "saving"
              ? "Saving…"
              : notesSaving === "saved"
              ? "Saved"
              : notesSaving === "error"
              ? "Save failed"
              : "Auto-saved"}
          </span>
        </div>
        <textarea
          className="mt-2 w-full min-h-[120px] border rounded-md px-3 py-2"
          placeholder="Internal notes for this case (not visible to the client)."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Alerte quand vide */}
      {blocks.length === 0 && (
        <div className="rounded-lg border p-3 bg-amber-50 text-amber-800 text-sm">
          This case has no blocks yet. Click <strong>Insert template</strong> to start from the default model, or add your own blocks.
        </div>
      )}

      {blocks.map((b) => {
        const isEditing = !!editing[b.id];

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
                  {/* ❤️ sauve le modèle par titre dans localStorage (pour futurs cas) */}
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-pink-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                    onClick={() => {
                      try {
                        const raw = localStorage.getItem("rl_block_defaults_by_title");
                        const map = raw ? JSON.parse(raw) : {};
                        (map as any)[b.title] = { title: b.title, paragraphs: b.paragraphs };
                        localStorage.setItem("rl_block_defaults_by_title", JSON.stringify(map));
                        alert(`Saved “${b.title}” as the new default for future cases.`);
                      } catch {
                        alert("Could not save default locally.");
                      }
                    }}
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

        // ——— Mode EDIT
        return (
          <div key={b.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-white/80 border rounded-md px-3 py-2"
                value={b.title}
                onChange={(e) => updateTitle(b.id, e.target.value)}
                placeholder="Block title…"
              />
              <button className="px-2 py-1 border rounded" onClick={() => move(b.id, -1)} title="Move up">
                ↑
              </button>
              <button className="px-2 py-1 border rounded" onClick={() => move(b.id, +1)} title="Move down">
                ↓
              </button>
              {/* ❤️ modèle par titre */}
              <button
                className="px-3 py-1.5 rounded-md bg-pink-600 text-white"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem("rl_block_defaults_by_title");
                    const map = raw ? JSON.parse(raw) : {};
                    (map as any)[b.title] = { title: b.title, paragraphs: b.paragraphs };
                    localStorage.setItem("rl_block_defaults_by_title", JSON.stringify(map));
                    alert(`Saved “${b.title}” as the new default for future cases.`);
                  } catch {
                    alert("Could not save default locally.");
                  }
                }}
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

            {/* APERÇU */}
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