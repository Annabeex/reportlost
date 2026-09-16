"use client";
// Création de l'établissement (après inscription). La liste des types est
// bornée au portail : on ne crée pas un commissariat depuis /campus.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal, portalFetch } from "@/lib/portal";
import { ORG_TYPES } from "@/lib/orgScope";

export default function PortalOnboarding() {
  const router = useRouter();
  const { scope, base, words } = usePortal();
  const types = ORG_TYPES[scope];
  const [form, setForm] = useState({
    name: "",
    type: types[0].v,
    state_id: "",
    city: "",
    public_email: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await portalFetch(scope, "/api/org/create", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      router.push(`${base}/dashboard`);
    } catch (e: any) {
      if (String(e?.message) === "no-session") { router.push(`${base}/login`); return; }
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">{words.setupTitle}</h1>
      <p className="mt-1 text-sm text-gray-600">{words.setupSubtitle}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">{words.orgLabel}</label>
          <input required value={form.name} onChange={set("name")} placeholder={words.orgPlaceholder} className={cls} />
        </div>
        <div>
          <label className="block font-medium mb-1">Type</label>
          <select value={form.type} onChange={set("type")} className={cls}>
            {types.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium mb-1">State (2 letters)</label>
            <input required maxLength={2} value={form.state_id} onChange={set("state_id")} placeholder="NY" className={cls} />
          </div>
          <div>
            <label className="block font-medium mb-1">City</label>
            <input required value={form.city} onChange={set("city")} placeholder="New York" className={cls} />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Public contact email (optional)</label>
          <input type="email" value={form.public_email} onChange={set("public_email")} className={cls} />
        </div>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <button type="submit" disabled={busy}
          className="w-full rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2.5 font-semibold text-white shadow disabled:opacity-60">
          {busy ? "…" : "Create"}
        </button>
      </form>
    </main>
  );
}
