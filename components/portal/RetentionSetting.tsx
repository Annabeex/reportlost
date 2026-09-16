"use client";
// components/portal/RetentionSetting.tsx
//
// La durée de garde, affichée avec SA SOURCE. Tant qu'un établissement non
// policier n'a rien réglé, le chiffre est provisoire : il s'affiche en ambre et
// demande confirmation, parce qu'une date de mise au rebut fausse mais
// discrète est exactement ce qu'on cherche à éviter.

import { useState } from "react";
import { orgRetention, MIN_RETENTION_DAYS, MAX_RETENTION_DAYS } from "@/lib/orgRetention";

export default function RetentionSetting({
  org,
  onSave,
}: {
  org: any;
  /** Renvoie le nombre d'objets recalculés, ou lève. */
  onSave: (days: number) => Promise<number>;
}) {
  const r = orgRetention(org);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(r.days));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const save = async () => {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n) || n < MIN_RETENTION_DAYS || n > MAX_RETENTION_DAYS) {
      setErr(`Enter a number of days between ${MIN_RETENTION_DAYS} and ${MAX_RETENTION_DAYS}.`);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const n2 = await onSave(n);
      setOpen(false);
      setMsg(n2 > 0 ? `Saved · ${n2} item${n2 > 1 ? "s" : ""} in storage updated` : "Saved");
      setTimeout(() => setMsg(""), 6000);
    } catch (e) {
      setErr((e as Error).message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const tone = r.confirmed
    ? "border-gray-200 bg-white text-gray-600"
    : "border-amber-300 bg-amber-50 text-amber-900";

  return (
    <div className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-2.5 text-[14px] ${tone}`}>
      <span className="font-semibold">Holding period</span>
      <span>{r.label}</span>

      {!r.confirmed && !open && (
        <span className="text-[13px] text-amber-800">
          State holding laws cover police custody, not your institution. Set the period your policy
          actually applies.
        </span>
      )}

      {open ? (
        <span className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={MIN_RETENTION_DAYS}
            max={MAX_RETENTION_DAYS}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Holding period in days"
            className="w-24 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[14px] font-semibold"
          />
          <span className="text-gray-500">days</span>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-[#16a34a] px-3.5 py-1.5 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setErr(""); }}
            className="text-[13.5px] text-gray-500 underline"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => { setValue(String(r.days)); setOpen(true); }}
          className="ml-auto rounded-lg border border-current px-3 py-1.5 text-[13.5px] font-semibold"
        >
          {r.confirmed ? "Change" : "Set my policy"}
        </button>
      )}

      {msg && <span className="w-full text-[13px] text-emerald-700">{msg}</span>}
      {err && <span className="w-full text-[13px] text-red-700">{err}</span>}
    </div>
  );
}
