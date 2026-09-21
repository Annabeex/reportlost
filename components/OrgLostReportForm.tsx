"use client";
// components/OrgLostReportForm.tsx — déclaration de perte adressée à UN
// établissement, depuis sa page publique. Courte : ce qu'on a perdu, quand, où,
// et comment être recontacté. Le bureau de l'établissement la reçoit et la
// compare à son inventaire, y compris aux objets déposés plus tard.
import { useState } from "react";

const FIELD =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const LABEL = "mb-1.5 block text-[15px] font-semibold text-gray-900";

export default function OrgLostReportForm({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "", lost_at: today, lost_location: "", description: "", name: "", email: "", phone: "", website: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ code: string; matched: boolean } | null>(null);

  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/o/lost-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_slug: orgSlug, ...form }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.code) throw new Error(j?.error || "The report could not be sent. Please try again.");
      setDone({ code: String(j.code), matched: !!j.matched });
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 text-center">
        <p className="text-[19px] font-bold text-[#14532d]">Your report is recorded</p>
        <p className="mt-2 text-[14px] font-semibold text-gray-600">Reference</p>
        <p className="font-mono text-[30px] font-bold leading-tight tracking-[0.08em] text-[#14532d]">{done.code}</p>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-gray-700">
          The {orgName} lost and found office received it. Your report is compared with the items it
          holds, including items handed in after today. If one matches, the office writes to{" "}
          {form.email}.
        </p>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-gray-500">
          A confirmation was sent to the same address. If you may have lost the item outside{" "}
          {orgName},{" "}
          <a href={`/report?src=o-${encodeURIComponent(orgSlug)}`} className="underline">
            you can also file a report on ReportLost
          </a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div>
        <label htmlFor="l-title" className={LABEL}>What you lost</label>
        <input id="l-title" required minLength={2} maxLength={120} value={form.title} onChange={set("title")}
          placeholder="e.g. Black backpack, set of keys, student ID" className={FIELD} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="l-when" className={LABEL}>Date lost</label>
          <input id="l-when" type="date" required max={today} value={form.lost_at} onChange={set("lost_at")} className={FIELD} />
        </div>
        <div>
          <label htmlFor="l-where" className={LABEL}>Where, if you know</label>
          <input id="l-where" maxLength={200} value={form.lost_location} onChange={set("lost_location")}
            placeholder="Building, floor, room" className={FIELD} />
        </div>
      </div>
      <div>
        <label htmlFor="l-desc" className={LABEL}>Description</label>
        <textarea id="l-desc" rows={3} maxLength={1500} value={form.description} onChange={set("description")}
          placeholder="Brand, colour, contents, any mark that only the owner would know" className={FIELD} />
        <p className="mt-1 text-[13px] text-gray-500">Only the lost and found office reads it. It is used to check that the item is yours.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="l-name" className={LABEL}>Your name</label>
          <input id="l-name" required maxLength={80} value={form.name} onChange={set("name")} autoComplete="name" className={FIELD} />
        </div>
        <div>
          <label htmlFor="l-email" className={LABEL}>Your email</label>
          <input id="l-email" type="email" required maxLength={160} value={form.email} onChange={set("email")} autoComplete="email" className={FIELD} />
        </div>
      </div>
      <div>
        <label htmlFor="l-phone" className={LABEL}>Phone <span className="font-normal text-gray-400">(optional)</span></label>
        <input id="l-phone" type="tel" maxLength={40} value={form.phone} onChange={set("phone")} autoComplete="tel" className={FIELD} />
      </div>

      <input value={form.website} onChange={set("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{err}</div>}

      <button type="submit" disabled={busy}
        className="w-full rounded-xl bg-[#16a34a] px-6 py-4 text-[17px] font-bold text-white shadow-sm hover:bg-[#15913f] disabled:opacity-60">
        {busy ? "Sending…" : `Send my report to ${orgName}`}
      </button>
      <p className="text-center text-[12.5px] text-gray-500">
        How this information is used and how long it is kept:{" "}
        <a href="/privacy/institutions" target="_blank" rel="noopener" className="underline">privacy notice</a>
      </p>
    </form>
  );
}
