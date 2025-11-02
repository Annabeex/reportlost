"use client";

import * as React from "react";

export default function CaseNotes({ publicId }: { publicId: string }) {
  const storageKey = React.useMemo(() => `rl_notes_${publicId}`, [publicId]);
  const [notes, setNotes] = React.useState("");
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  // Charger depuis localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const j = JSON.parse(raw) as { notes: string; savedAt?: string };
        setNotes(j.notes || "");
        setSavedAt(j.savedAt || null);
      }
    } catch {}
  }, [storageKey]);

  const save = React.useCallback(() => {
    const payload = { notes, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSavedAt(payload.savedAt);
    } catch {
      /* ignore */
    }
  }, [notes, storageKey]);

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-yellow-900">Personal notes</h3>
        {savedAt && (
          <span className="text-[11px] text-yellow-700">
            saved {new Date(savedAt).toLocaleString()}
          </span>
        )}
      </div>
      <textarea
        className="w-full h-48 rounded-md border border-yellow-300 bg-white/80 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="Add internal notes about this case… (private, local to your browser)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-3 flex items-center justify-between">
        <button
          className="inline-flex items-center rounded-md bg-yellow-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
          onClick={save}
        >
          Save notes
        </button>
        <button
          className="text-xs text-yellow-700 underline decoration-dotted"
          onClick={() => {
            setNotes("");
            try { localStorage.removeItem(storageKey); } catch {}
            setSavedAt(null);
          }}
        >
          clear
        </button>
      </div>
      <p className="mt-3 text-[11px] text-yellow-800/80">
        These notes are stored only in your browser (localStorage). They are not visible publicly and not synced.
      </p>
    </div>
  );
}
