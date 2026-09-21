"use client";
// components/portal/PortalImport.tsx — reprise d'un inventaire tenu ailleurs
// (autre logiciel, Excel). Le fichier est lu DANS LE NAVIGATEUR : on montre
// ce qu'on a compris, colonne par colonne, avant d'écrire quoi que ce soit.
import { useMemo, useState } from "react";
import Link from "next/link";
import PortalNav from "@/components/portal/PortalNav";
import { usePortalSession } from "@/lib/portalSession";
import { parseCsv, parseLooseDate, toCsv } from "@/lib/csv";

type FieldKey = "title" | "found_at" | "description" | "found_location" | "storage_location" | "status" | "ref";

const FIELDS: { key: FieldKey; label: string; required?: boolean; guess: RegExp }[] = [
  { key: "title", label: "Item", required: true, guess: /^(item|title|name|object|article|what|type|category)/i },
  { key: "found_at", label: "Date found", required: true, guess: /(date.*(found|receiv|logged|turn)|found.*(date|on)|^date$|received)/i },
  { key: "description", label: "Description", guess: /(descr|detail|note|comment|remark)/i },
  { key: "found_location", label: "Found location", guess: /(found.*(loc|at|where|place)|where|location.*found|building|place)/i },
  { key: "storage_location", label: "Storage location", guess: /(stor|shelf|bin|locker|box|kept)/i },
  { key: "status", label: "Status", guess: /(status|state|outcome|disposition)/i },
  { key: "ref", label: "Reference / tag number", guess: /(^ref|reference|tag|^id$|number|^no\.?$|#)/i },
];

function mapStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (!s) return "stored";
  if (/return|claimed|picked|collected|owner/.test(s)) return "returned";
  if (/dispos|donat|discard|destroy|transfer|police|auction|sold|trash|recycl/.test(s)) return "disposed";
  if (/claim|pending/.test(s)) return "claim_pending";
  return "stored";
}
const STATUS_LABEL: Record<string, string> = {
  stored: "In storage", claim_pending: "Claim pending", returned: "Returned", disposed: "Disposed",
};

const CHUNK = 200;

export default function PortalImport() {
  const { api, base, org, orgs, cross, role, pending, switchOrg } = usePortalSession("import");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [body, setBody] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<FieldKey, number>>({} as Record<FieldKey, number>);
  const [dayFirst, setDayFirst] = useState(false);
  const [listPublic, setListPublic] = useState(true);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ imported: number; duplicates: number; errors: { index: number; reason: string }[]; matched: number } | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr("");
    setResult(null);
    try {
      const rows = parseCsv(await f.text());
      if (rows.length < 2) throw new Error("This file has no data rows. Export your list as CSV, with a header row.");
      if (rows.length > 20001) throw new Error("This file has more than 20,000 rows. Split it, or contact us.");
      const hs = rows[0];
      const used = new Set<number>();
      const m = {} as Record<FieldKey, number>;
      for (const fdef of FIELDS) {
        const i = hs.findIndex((h, idx) => !used.has(idx) && fdef.guess.test(h));
        m[fdef.key] = i;
        if (i >= 0) used.add(i);
      }
      setFileName(f.name);
      setHeaders(hs);
      setBody(rows.slice(1));
      setMap(m);
    } catch (e2) {
      setErr((e2 as Error).message);
    }
  };

  // Lignes normalisées + problèmes, recalculés à chaque changement de colonne.
  const prepared = useMemo(() => {
    const cell = (r: string[], k: FieldKey) => (map[k] >= 0 ? r[map[k]] || "" : "");
    const ok: any[] = [];
    const bad: { line: number; reason: string }[] = [];
    body.forEach((r, i) => {
      const title = cell(r, "title");
      const date = parseLooseDate(cell(r, "found_at"), dayFirst);
      if (!title) return void bad.push({ line: i + 2, reason: "no item name" });
      if (!date) return void bad.push({ line: i + 2, reason: `date not understood: "${cell(r, "found_at")}"` });
      ok.push({
        index: i + 2,
        title,
        found_at: date,
        description: cell(r, "description"),
        found_location: cell(r, "found_location"),
        storage_location: cell(r, "storage_location"),
        status: mapStatus(cell(r, "status")),
        ref: cell(r, "ref"),
      });
    });
    return { ok, bad };
  }, [body, map, dayFirst]);

  const ready = map.title >= 0 && map.found_at >= 0;

  const run = async () => {
    setErr("");
    const total = prepared.ok.length;
    const sum = { imported: 0, duplicates: 0, errors: [] as { index: number; reason: string }[], matched: 0 };
    setProgress({ done: 0, total });
    try {
      for (let i = 0; i < total; i += CHUNK) {
        const r = await api("/api/org/items/import", {
          method: "POST",
          body: JSON.stringify({ rows: prepared.ok.slice(i, i + CHUNK), public_visible: listPublic }),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `Error ${r.status}`);
        sum.imported += Number(j.imported || 0);
        sum.duplicates += Number(j.duplicates || 0);
        sum.matched += Number(j.matched || 0);
        sum.errors.push(...(Array.isArray(j.errors) ? j.errors : []));
        setProgress({ done: Math.min(i + CHUNK, total), total });
      }
      setResult(sum);
      setBody([]);
      setHeaders([]);
    } catch (e2) {
      // Ce qui est déjà passé est enregistré ; relancer le même fichier ne
      // double rien, les lignes existantes sont reconnues.
      setErr(`${(e2 as Error).message}. ${sum.imported} item(s) were saved before the error. You can run the same file again: rows already imported are skipped.`);
    } finally {
      setProgress(null);
    }
  };

  const template = () => {
    const csv = toCsv([
      ["Item", "Date found", "Description", "Found location", "Storage location", "Status", "Reference"],
      ["Blue water bottle", "2026-09-14", "Metal, dented at the base", "Library, 2nd floor", "Shelf B3", "In storage", ""],
    ]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "reportlost-import-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (!org) return <div className="p-10 text-gray-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <PortalNav current="import" pending={pending} orgs={orgs} activeId={String(org.id)} crossPortal={cross} onChangeOrg={switchOrg} />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Import items</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bring in the list you kept in another system or in a spreadsheet. Export it as CSV, choose the
          file, check the columns. Nothing is saved until you confirm.
        </p>

        {role !== "admin" ? (
          <div className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            Only an administrator of this account can import items.
          </div>
        ) : result ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-5">
            <h2 className="text-[17px] font-bold text-gray-900">{result.imported} item{result.imported === 1 ? "" : "s"} imported</h2>
            <ul className="mt-2 space-y-1 text-[14.5px] text-gray-700">
              {result.duplicates > 0 && <li>{result.duplicates} already in your inventory, skipped.</li>}
              {result.errors.length > 0 && (
                <li>
                  {result.errors.length} rejected: {result.errors.slice(0, 8).map((e) => `line ${e.index} (${e.reason})`).join(", ")}
                  {result.errors.length > 8 ? "…" : ""}
                </li>
              )}
              {result.matched > 0 && <li>{result.matched} possible match{result.matched === 1 ? "" : "es"} with reported losses, waiting in To review.</li>}
            </ul>
            <Link href={`${base}/dashboard`} className="mt-4 inline-block rounded-xl bg-[#16a34a] px-5 py-3 text-[15px] font-bold text-white">
              Open the inventory
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
              <label className="block text-[15px] font-bold text-gray-900" htmlFor="csv-file">1. CSV file</label>
              <input id="csv-file" type="file" accept=".csv,text/csv,.txt,.tsv" onChange={onFile}
                className="mt-2 block w-full text-[14px] file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:font-semibold file:text-emerald-800" />
              <p className="mt-2 text-[13px] text-gray-500">
                One row per item, with a header row. Item and date found are required.{" "}
                <button type="button" onClick={template} className="underline">Download a template</button>
              </p>
            </div>

            {headers.length > 0 && (
              <>
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
                  <h2 className="text-[15px] font-bold text-gray-900">2. Columns of {fileName}</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {FIELDS.map((f) => (
                      <label key={f.key} className="block text-[14px]">
                        <span className="mb-1 block font-semibold text-gray-700">
                          {f.label}{f.required ? "" : <span className="font-normal text-gray-400"> (optional)</span>}
                        </span>
                        <select
                          value={map[f.key] ?? -1}
                          onChange={(e) => setMap((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-[15px] ${f.required && (map[f.key] ?? -1) < 0 ? "border-amber-400" : "border-gray-300"}`}
                        >
                          <option value={-1}>Not in my file</option>
                          {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-2 text-[14px] text-gray-700">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={dayFirst} onChange={(e) => setDayFirst(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                      Dates in my file are written day first (31/12/2026)
                    </label>
                    <label className="flex items-start gap-2">
                      <input type="checkbox" checked={listPublic} onChange={(e) => setListPublic(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
                      <span>
                        List the items still in storage on our public page
                        <span className="block text-[13px] text-gray-500">Shown as a generic category only (Wallet, Keys, Phone). Descriptions stay private.</span>
                      </span>
                    </label>
                  </div>
                </div>

                {ready && (
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
                    <h2 className="text-[15px] font-bold text-gray-900">3. Check before importing</h2>
                    <p className="mt-1 text-[14px] text-gray-600">
                      {prepared.ok.length} row{prepared.ok.length === 1 ? "" : "s"} ready
                      {prepared.bad.length > 0 && <>, <span className="font-semibold text-amber-700">{prepared.bad.length} will be left out</span></>}.
                    </p>
                    {prepared.bad.length > 0 && (
                      <p className="mt-1 text-[13px] text-amber-800">
                        {prepared.bad.slice(0, 6).map((b) => `Line ${b.line}: ${b.reason}`).join(" · ")}{prepared.bad.length > 6 ? " …" : ""}
                      </p>
                    )}
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-[13px]">
                        <thead className="text-gray-500">
                          <tr><th className="py-1.5 pr-3">Item</th><th className="pr-3">Found</th><th className="pr-3">Where</th><th className="pr-3">Storage</th><th className="pr-3">Status</th><th>Ref.</th></tr>
                        </thead>
                        <tbody>
                          {prepared.ok.slice(0, 5).map((r) => (
                            <tr key={r.index} className="border-t border-gray-100 text-gray-800">
                              <td className="max-w-[220px] truncate py-1.5 pr-3 font-medium">{r.title}</td>
                              <td className="pr-3">{r.found_at}</td>
                              <td className="max-w-[160px] truncate pr-3">{r.found_location}</td>
                              <td className="max-w-[120px] truncate pr-3">{r.storage_location}</td>
                              <td className="pr-3">{STATUS_LABEL[r.status]}</td>
                              <td className="text-gray-500">{r.ref || "new"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={run} disabled={!!progress || prepared.ok.length === 0}
                      className="mt-4 rounded-xl bg-[#16a34a] px-6 py-3.5 text-[16px] font-bold text-white disabled:opacity-60">
                      {progress ? `Importing… ${progress.done}/${progress.total}` : `Import ${prepared.ok.length} item${prepared.ok.length === 1 ? "" : "s"}`}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {err && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{err}</div>}
      </div>
    </div>
  );
}
