"use client";
// Création de l'organisation (après inscription).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const TYPES = [
  { v: "police", l: "Police department" },
  { v: "city", l: "City hall / municipality" },
  { v: "university", l: "University / school" },
  { v: "hotel", l: "Hotel / venue / business" },
  { v: "transit", l: "Transit / airport" },
  { v: "other", l: "Other" },
];

export default function OrgOnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", type: "police", state_id: "", city: "", public_email: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) { router.push("/org/login"); return; }
      const r = await fetch("/api/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      router.push("/org/dashboard");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Set up your organization</h1>
      <p className="mt-1 text-sm text-gray-600">
        Free plan, no card required. Your public page goes live after a quick manual review by our team.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">Organization name</label>
          <input required value={form.name} onChange={set("name")} placeholder="e.g. Tucson Police Department" className={cls} />
        </div>
        <div>
          <label className="block font-medium mb-1">Type</label>
          <select value={form.type} onChange={set("type")} className={cls}>
            {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium mb-1">State (2 letters)</label>
            <input required maxLength={2} value={form.state_id} onChange={set("state_id")} placeholder="AZ" className={cls} />
          </div>
          <div>
            <label className="block font-medium mb-1">City</label>
            <input required value={form.city} onChange={set("city")} placeholder="Tucson" className={cls} />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Public contact email (optional)</label>
          <input type="email" value={form.public_email} onChange={set("public_email")} className={cls} />
        </div>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <button type="submit" disabled={busy}
          className="w-full rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2.5 font-semibold text-white shadow disabled:opacity-60">
          {busy ? "…" : "Create my organization"}
        </button>
      </form>
    </main>
  );
}
