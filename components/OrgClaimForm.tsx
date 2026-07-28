"use client";
// Bouton + mini-formulaire de réclamation d'un objet listé par un établissement.
// La preuve demandée (description précise) n'est jamais publiée : elle part à
// l'établissement qui compare avec ses notes internes et sa photo.
import { useState } from "react";

export default function OrgClaimForm({ orgSlug, itemId, label }: { orgSlug: string; itemId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", proof: "", website: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    setErr(null);
    try {
      const r = await fetch("/api/o/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_slug: orgSlug, item_id: itemId, ...form }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Something went wrong.");
      setState("done");
    } catch (e: any) {
      setErr(String(e?.message || e));
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
        ✓ Claim sent, the organization will contact you
      </span>
    );
  }

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-[#2ea052] bg-white px-3 py-1.5 text-sm font-medium text-[#226638] hover:bg-[#f2fbf5]"
      >
        This might be mine
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 w-full space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs text-gray-600">
            Describe your {label.toLowerCase()} precisely (color, brand, contents, marks, where you
            think you lost it). The organization compares your description with what they hold before
            any handover, so the more specific, the better.
          </p>
          <textarea required minLength={15} rows={3} value={form.proof} onChange={set("proof")}
            placeholder="e.g. Black iPhone 13, cracked top-left corner, photo of a dog as wallpaper, lost near the entrance on Saturday evening…" className={cls} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={form.name} onChange={set("name")} placeholder="Your name" className={cls} />
            <input required type="email" value={form.email} onChange={set("email")} placeholder="Your email" className={cls} />
          </div>
          <input value={form.phone} onChange={set("phone")} placeholder="Phone (optional)" className={cls} />
          <input value={form.website} onChange={set("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</div>}
          <button type="submit" disabled={state === "busy"}
            className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60">
            {state === "busy" ? "Sending…" : "Send my claim"}
          </button>
        </form>
      )}
    </>
  );
}
