"use client";

// components/AdminDailyChart.tsx
// Dépôts par jour sur un mois, avec la part payante.
//
// Forme retenue : des barres EMPILÉES, pas deux séries côte à côte ni deux axes.
// Les payés sont un sous-ensemble des dépôts, et les deux se comptent dans la
// même unité : la hauteur totale donne les dépôts du jour, le segment coloré la
// part payée, et le rapport des deux se lit sans calcul.
import { useEffect, useMemo, useState } from "react";

type Jour = { day: string; total: number; payes: number; recette: number };

export default function AdminDailyChart({ days = 30 }: { days?: number }) {
  const [serie, setSerie] = useState<Jour[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [survol, setSurvol] = useState<number | null>(null);

  useEffect(() => {
    let vivant = true;
    fetch(`/api/admin/stats-daily?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => vivant && setSerie(j.serie || []))
      .catch((e) => vivant && setErreur(String(e.message || e)));
    return () => { vivant = false; };
  }, [days]);

  const t = useMemo(() => {
    const s = serie || [];
    const total = s.reduce((a, d) => a + d.total, 0);
    const payes = s.reduce((a, d) => a + d.payes, 0);
    const recette = s.reduce((a, d) => a + d.recette, 0);
    return { total, payes, recette, taux: total ? (100 * payes) / total : 0 };
  }, [serie]);

  if (erreur) return null;
  if (!serie) return <div className="h-[150px] animate-pulse rounded-xl bg-gray-100" />;

  const max = Math.max(1, ...serie.map((d) => d.total));
  const H = 96; // hauteur de tracé
  const libelle = (k: string) => { const [, m, j] = k.split("-"); return `${Number(j)}/${Number(m)}`; };

  return (
    <section className="admin-daily rounded-xl border border-gray-200 bg-white p-4">
      <style>{`
        .admin-daily { --depots: #2a78d6; --payes: #eb6834; --surface: #ffffff; }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .admin-daily {
            --depots: #3987e5; --payes: #d95926; --surface: #1a1a19;
          }
        }
        :root[data-theme="dark"] .admin-daily {
          --depots: #3987e5; --payes: #d95926; --surface: #1a1a19;
        }
      `}</style>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          Dépôts par jour <span className="font-normal text-gray-500">— {days} derniers jours</span>
        </h3>
        <div className="flex items-center gap-4 text-[12px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: "var(--depots)" }} />
            Dépôts
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: "var(--payes)" }} />
            Payés
          </span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { k: "Dépôts", v: String(t.total) },
          { k: "Payés", v: `${t.payes}  (${t.taux.toFixed(1)} %)` },
          { k: "Recette", v: `${t.recette} $` },
        ].map((x) => (
          <div key={x.k} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <div className="text-[10.5px] uppercase tracking-wide text-gray-500">{x.k}</div>
            <div className="text-[17px] font-bold leading-tight text-gray-900">{x.v}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="flex items-end gap-[3px]" style={{ height: H }}>
          {serie.map((d, i) => {
            const hTot = Math.round((d.total / max) * H);
            const hPay = d.payes ? Math.max(3, Math.round((d.payes / max) * H)) : 0;
            const hLib = Math.max(0, hTot - hPay - (hPay ? 2 : 0)); // 2px de respiration
            return (
              <div
                key={d.day}
                className="group relative flex flex-1 cursor-default flex-col justify-end"
                style={{ height: H }}
                onMouseEnter={() => setSurvol(i)}
                onMouseLeave={() => setSurvol(null)}
              >
                {hLib > 0 && (
                  <div
                    style={{ height: hLib, background: "var(--depots)" }}
                    className={`rounded-t-[4px] ${hPay ? "" : "rounded-b-[1px]"}`}
                  />
                )}
                {hPay > 0 && (
                  <div
                    style={{ height: hPay, background: "var(--payes)", marginTop: hLib ? 2 : 0 }}
                    className={hLib ? "rounded-b-[1px]" : "rounded-[4px_4px_1px_1px]"}
                  />
                )}
                {d.total === 0 && <div className="h-[2px] rounded bg-gray-200" />}

                {survol === i && (
                  <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] shadow-lg">
                    <b>{libelle(d.day)}</b> — {d.total} dépôt{d.total > 1 ? "s" : ""}
                    {d.payes > 0 && (
                      <span className="text-gray-600">, dont {d.payes} payé{d.payes > 1 ? "s" : ""} ({d.recette} $)</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-1.5 flex gap-[3px] text-[10px] text-gray-400">
          {serie.map((d, i) => (
            <div key={d.day} className="flex-1 text-center">
              {i % 5 === 0 || i === serie.length - 1 ? libelle(d.day) : ""}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
