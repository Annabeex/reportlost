"use client";
// components/portal/OrgProfile.tsx — nom, ville, adresse de contact de
// l'établissement, modifiables par un administrateur. L'adresse publique
// (slug) et les QR codes ne bougent pas.
import { useState } from "react";

const FIELD = "w-full rounded-lg border border-gray-300 px-3 py-2 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-emerald-400";

export default function OrgProfile({
  org,
  canEdit,
  onSave,
}: {
  org: any;
  canEdit: boolean;
  onSave: (patch: Record<string, string>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", state_id: "", public_email: "", public_intro: "", public_hours: "", public_location: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const start = () => {
    setForm({ name: org.name || "", city: org.city || "", state_id: org.state_id || "", public_email: org.public_email || "", public_intro: org.public_intro || "", public_hours: org.public_hours || "", public_location: org.public_location || "" });
    setErr("");
    setOpen(true);
  };
  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await onSave(form);
      setOpen(false);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!canEdit) return null;
  return (
    <>
      <button type="button" onClick={start} title="Edit name, contact, opening hours and public page text" aria-label="Edit institution settings"
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </button>
      {open && (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
    <form onSubmit={save} role="dialog" aria-modal="true" aria-label="Institution settings" onClick={(e) => e.stopPropagation()}
      className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-5 text-left text-base font-normal sm:rounded-2xl">
      <h2 className="text-[17px] font-bold text-gray-900">{org.name}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px] font-semibold text-gray-700 sm:col-span-2">
          Institution name
          <input required minLength={3} maxLength={120} value={form.name} onChange={set("name")} className={`${FIELD} mt-1 font-normal`} />
        </label>
        <label className="block text-[13px] font-semibold text-gray-700">
          City
          <input maxLength={80} value={form.city} onChange={set("city")} className={`${FIELD} mt-1 font-normal`} />
        </label>
        <label className="block text-[13px] font-semibold text-gray-700">
          State (2 letters)
          <input maxLength={2} value={form.state_id} onChange={set("state_id")} className={`${FIELD} mt-1 font-normal uppercase`} />
        </label>
        <label className="block text-[13px] font-semibold text-gray-700 sm:col-span-2">
          Office email, shown to claimants and used for notifications
          <input type="email" maxLength={160} value={form.public_email} onChange={set("public_email")} className={`${FIELD} mt-1 font-normal`} />
        </label>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 text-[13px] font-semibold text-gray-700">On your public page <span className="font-normal text-gray-400">(all optional)</span></div>
      <div className="mt-2 grid gap-3">
        <label className="block text-[13px] font-semibold text-gray-700">
          Introduction, shown at the top
          <textarea rows={3} maxLength={600} value={form.public_intro} onChange={set("public_intro")}
            placeholder="Items handed in on campus are kept at the Student Union front desk. Bring a photo ID to collect an item."
            className={`${FIELD} mt-1 font-normal`} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[13px] font-semibold text-gray-700">
            Where to go
            <textarea rows={2} maxLength={200} value={form.public_location} onChange={set("public_location")}
              placeholder="Student Union, room 104" className={`${FIELD} mt-1 font-normal`} />
          </label>
          <label className="block text-[13px] font-semibold text-gray-700">
            Opening hours
            <textarea rows={2} maxLength={300} value={form.public_hours} onChange={set("public_hours")}
              placeholder={"Mon to Fri, 9 am to 5 pm\nClosed on university holidays"} className={`${FIELD} mt-1 font-normal`} />
          </label>
        </div>
      </div>
      <p className="mt-2 text-[12.5px] text-gray-500">
        Your public address and printed QR codes do not change.
      </p>
      {err && <p className="mt-2 text-[13px] text-red-700">{err}</p>}
      <div className="mt-3 flex gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-[#16a34a] px-4 py-2 text-[13.5px] font-bold text-white disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13.5px] text-gray-500 underline">Cancel</button>
      </div>
    </form>
    </div>
      )}
    </>
  );
}
