"use client";
// components/OrgFoundForm.tsx — formulaire public « j'ai trouvé un objet ».
// Pensé pour un téléphone tenu d'une main : peu de champs, grandes cibles,
// l'appareil photo s'ouvre directement, la photo est compressée avant l'envoi.
import { useRef, useState } from "react";
import { compressImage } from "@/lib/imageCompress";

const FIELD =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const LABEL = "mb-1.5 block text-[15px] font-semibold text-gray-900";

export default function OrgFoundForm({
  orgSlug,
  orgName,
  publicListing,
  allowKeep,
}: {
  orgSlug: string;
  orgName: string;
  publicListing: boolean;
  /** L'établissement accepte-t-il les signalements d'objets gardés par leur trouveur ? */
  allowKeep: boolean;
}) {
  // desk = je le dépose à l'accueil ; finder = je le garde, on me contacte.
  const [heldBy, setHeldBy] = useState<"desk" | "finder">("desk");
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "",
    found_location: "",
    found_at: today,
    description: "",
    finder_name: "",
    finder_email: "",
    website: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreparing(true);
    try {
      const small = await compressImage(f);
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(small);
      setPreview(URL.createObjectURL(small));
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearPhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.set("org_slug", orgSlug);
      fd.set("held_by", heldBy);
      (Object.keys(form) as (keyof typeof form)[]).forEach((k) => fd.set(k, form[k]));
      if (photo) fd.set("photo", photo, photo.name);
      const r = await fetch("/api/o/intake", { method: "POST", body: fd });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || "The form could not be sent. Please try again.");
      setCode(String(j.code || "ok"));
      window.scrollTo({ top: 0 });
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (code && heldBy === "finder") {
    return (
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center">
        <p className="text-[19px] font-bold text-[#14532d]">Your report is recorded</p>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-gray-700">
          The {orgName} lost and found office now knows you have this item. When someone describes it
          correctly, the office gives them your email address ({form.finder_email}) so you can arrange
          the handover.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-gray-500">
          Your contact is never shown publicly. You can still bring the item to the front desk at any
          time: give the reference below and the desk finds your report, nothing to fill in again.
        </p>
        <p className="mt-4 text-[14px] font-semibold text-gray-600">Reference</p>
        <p className="font-mono text-[34px] font-bold leading-tight tracking-[0.12em] text-[#14532d]">{code}</p>
      </section>
    );
  }

  if (code) {
    return (
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center">
        <p className="text-[15px] font-semibold text-gray-600">Your drop-off code</p>
        <p className="mt-2 font-mono text-[56px] font-bold leading-none tracking-[0.12em] text-[#14532d]">{code}</p>
        <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-gray-700">
          Bring the item to the {orgName} front desk and show this code. The desk finds your
          description with it and confirms it has the item.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-gray-500">
          The item is not recorded until the desk confirms it. If it is never handed in, this
          description and its photo are deleted.
        </p>
        <button
          type="button"
          onClick={() => {
            clearPhoto();
            setForm((f) => ({ ...f, title: "", description: "", found_location: "" }));
            setCode("");
          }}
          className="mt-6 text-[14px] text-gray-500 underline"
        >
          Hand in another item
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      {allowKeep && (
        <fieldset>
          <legend className={LABEL}>What will you do with the item</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["desk", "I bring it to the front desk", "You get a short code to show at the desk."],
              ["finder", "I keep it for now", "You leave your email so the owner can get it back from you."],
            ] as const).map(([v, title, sub]) => (
              <label key={v}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 ${heldBy === v ? "border-emerald-500 bg-emerald-50/60" : "border-gray-300 bg-white"}`}>
                <input type="radio" name="held_by" value={v} checked={heldBy === v} onChange={() => setHeldBy(v)}
                  className="mt-1 h-4 w-4 flex-none accent-emerald-600" />
                <span>
                  <span className="block text-[15px] font-semibold text-gray-900">{title}</span>
                  <span className="block text-[13px] leading-snug text-gray-500">{sub}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <input ref={fileRef} id="found-photo" type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      <div>
        <span className={LABEL}>Photo <span className="font-normal text-gray-400">(optional)</span></span>
        {preview ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#eef0f3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-56 w-full object-contain" />
            <div className="flex items-center justify-between bg-white px-4 py-2.5 text-[14px]">
              <label htmlFor="found-photo" className="cursor-pointer font-semibold text-emerald-700">Retake</label>
              <button type="button" onClick={clearPhoto} className="text-gray-400 hover:text-red-600">Remove</button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="found-photo"
            className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-[#f7f8fa] text-center"
          >
            <span className="text-[30px]" aria-hidden>📷</span>
            <span className="mt-1 text-[15px] font-semibold text-gray-800">{preparing ? "Preparing…" : "Take a photo"}</span>
            <span className="text-[13px] text-gray-500">Only the lost and found office sees it</span>
          </label>
        )}
      </div>

      <div>
        <label htmlFor="f-title" className={LABEL}>What is it</label>
        <input id="f-title" required minLength={2} maxLength={120} value={form.title} onChange={set("title")}
          placeholder="e.g. Black backpack, set of keys, water bottle" className={FIELD} />
      </div>

      <div>
        <label htmlFor="f-where" className={LABEL}>Where you found it</label>
        <input id="f-where" maxLength={200} value={form.found_location} onChange={set("found_location")}
          placeholder="Building, floor, room" className={FIELD} />
      </div>

      <div>
        <label htmlFor="f-when" className={LABEL}>Date found</label>
        <input id="f-when" type="date" required max={today} value={form.found_at} onChange={set("found_at")} className={FIELD} />
      </div>

      <div>
        <label htmlFor="f-desc" className={LABEL}>Details <span className="font-normal text-gray-400">(optional)</span></label>
        <textarea id="f-desc" rows={2} maxLength={1000} value={form.description} onChange={set("description")}
          placeholder="Brand, colour, anything inside" className={FIELD} />
      </div>

      <fieldset className="rounded-xl border border-gray-200 bg-[#f7f8fa] p-4">
        <legend className="px-1 text-[14px] font-semibold text-gray-700">
          Your contact{heldBy === "desk" && <span className="font-normal text-gray-400"> (optional)</span>}
        </legend>
        <p className="mb-3 text-[13px] leading-relaxed text-gray-500">
          {heldBy === "finder"
            ? "Your email goes to the lost and found office. The office gives it to the owner only after checking their description of the item. It is never shown publicly: the public list shows a category, the date and the place, nothing else."
            : "Only used by the lost and found office if it has a question about the item. Never shown publicly."}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.finder_name} onChange={set("finder_name")} maxLength={80} placeholder="Name" autoComplete="name" className={FIELD} />
          <input type="email" required={heldBy === "finder"} value={form.finder_email} onChange={set("finder_email")} maxLength={160} placeholder="Email" autoComplete="email" className={FIELD} />
        </div>
      </fieldset>

      <input value={form.website} onChange={set("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{err}</div>}

      <button type="submit" disabled={busy || preparing}
        className="w-full rounded-xl bg-[#16a34a] px-6 py-4 text-[17px] font-bold text-white shadow-sm hover:bg-[#15913f] disabled:opacity-60">
        {busy ? "Sending…" : heldBy === "finder" ? "Send my report" : "Get my drop-off code"}
      </button>

      {publicListing && (
        <p className="text-center text-[13px] text-gray-500">
          Looking for something you lost instead?{" "}
          <a href={`/o/${orgSlug}`} className="underline">See the items held by {orgName}</a>
        </p>
      )}
    </form>
  );
}
