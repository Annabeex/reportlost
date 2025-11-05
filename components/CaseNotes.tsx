"use client";

import * as React from "react";

export default function CaseNotes({ publicId }: { publicId: string }) {
  const storageKey = React.useMemo(() => `rl_notes_${publicId}`, [publicId]);
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState<"idle"|"loading"|"saving"|"saved"|"error">("loading");
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  // util GET json no-store
  async function getJSON<T=any>(url: string): Promise<T|null> {
    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache:"no-store" });
      if (!res.ok) return null;
      return await res.json().catch(() => null);
    } catch { return null; }
  }

  // Charge d'abord depuis BDD (/notes). Si vide, migre le localStorage -> BDD (une fois).
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setStatus("loading");

      // 1) Essaye BDD
      const jn = await getJSON<{notes?: string|null}>(`/api/case_followup/${encodeURIComponent(publicId)}/notes`);
      let serverNotes = typeof jn?.notes === "string" ? jn!.notes! : "";

      // 2) Si BDD vide, tenter migration depuis localStorage (une fois)
      if (!serverNotes) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const loc = JSON.parse(raw) as { notes?: string; savedAt?: string };
            if (loc?.notes && typeof loc.notes === "string" && loc.notes.trim()) {
              // pousser vers BDD
              const r = await fetch(`/api/case_followup/${encodeURIComponent(publicId)}/notes?t=${Date.now()}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: loc.notes }),
                cache: "no-store",
              });
              if (r.ok) {
                serverNotes = loc.notes;
                // nettoyer le local après migration
                localStorage.removeItem(storageKey);
              }
            }
          }
        } catch {}
      }

      // 3) Met à jour l’UI
      if (!mounted) return;
      setNotes(serverNotes || "");
      setStatus("idle");
      setSavedAt(null);
    })();

    return () => { mounted = false; };
  }, [publicId, storageKey]);

  const save = React.useCallback(async () => {
    setStatus("saving");
    try {
      const r = await fetch(`/api/case_followup/${encodeURIComponent(publicId)}/notes?t=${Date.now()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(String(r.status));
      setStatus("saved");
      const t = new Date().toISOString();
      setSavedAt(t);
      // bonus: garder une copie locale si tu veux un filet de sécurité
      try { localStorage.setItem(storageKey, JSON.stringify({ notes, savedAt: t })); } catch {}
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("error");
    }
  }, [notes, publicId, storageKey]);

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-yellow-900">Personal notes</h3>
        <span className="text-[11px] text-yellow-700">
          {status === "loading" ? "Loading…" :
           status === "saving" ? "Saving…" :
           status === "saved" ? (savedAt ? `Saved ${new Date(savedAt).toLocaleString()}` : "Saved") :
           status === "error" ? "Save failed" :
           savedAt ? `Auto-saved ${new Date(savedAt).toLocaleString()}` : "Idle"}
        </span>
      </div>

      <textarea
        className="w-full h-48 rounded-md border border-yellow-300 bg-white/80 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="Add internal notes about this case… (private)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="mt-3 flex items-center justify-between">
        <button
          className="inline-flex items-center rounded-md bg-yellow-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
          onClick={save}
          disabled={status === "saving" || status === "loading"}
        >
          Save notes
        </button>
        <button
          className="text-xs text-yellow-700 underline decoration-dotted"
          onClick={async () => {
            setNotes("");
            setSavedAt(null);
            // vide en BDD aussi (si tu veux conserver le clear local-only, supprime ce bloc)
            try {
              await fetch(`/api/case_followup/${encodeURIComponent(publicId)}/notes?t=${Date.now()}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: "" }),
                cache: "no-store",
              });
            } catch {}
            try { localStorage.removeItem(storageKey); } catch {}
          }}
        >
          clear
        </button>
      </div>

      <p className="mt-3 text-[11px] text-yellow-800/80">
        These notes are now synced to the server. A local copy is kept as a backup.
      </p>
    </div>
  );
}
