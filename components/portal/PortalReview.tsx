"use client";
// components/portal/PortalReview.tsx
//
// « To review » : la file d'attente du bureau. Un seul principe de conception —
// n'afficher que ce qui attend une DÉCISION. Pas de statistiques, pas de
// graphique : un agent derrière un comptoir n'a pas besoin de savoir combien
// d'objets il a rentrés ce mois-ci.
//
// Rien ne part au propriétaire tant qu'un humain n'a pas tranché.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setActiveOrgId } from "@/components/OrgSwitcher";
import PortalNav from "@/components/portal/PortalNav";
import { usePortal, portalFetch } from "@/lib/portal";
import { scopeOfType, portalBase } from "@/lib/orgScope";

type Match = {
  id: number;
  score: number;
  level: "strong" | "possible";
  reasons: string[];
  ai: { verdict: string; reason: string } | null;
  found: {
    id: string;
    ref: string | null;
    title: string | null;
    description: string | null;
    photo: string | null;
    date: string | null;
    found_at: string | null;
    stored_at: string | null;
    hold_until: string | null;
    days_left: number | null;
  };
  lost: {
    reference: string | null;
    title: string | null;
    description: string | null;
    date: string | null;
    city: string | null;
  };
};

// Même repli que le tableau de bord : une photo de catégorie quand l'objet
// n'en a pas. Une vignette vide au milieu d'une liste se lit comme un bug.
const CAT_IMAGES: [RegExp, string][] = [
  [/wallet|purse|billfold/i, "wallet.jpg"],
  [/phone|iphone|samsung|android/i, "phone.jpg"],
  [/key/i, "keys.jpg"],
  [/bag|backpack|luggage|suitcase/i, "bag-suitcase.jpg"],
  [/ring|bracelet|necklace|jewel|watch|earring/i, "jewelry.jpg"],
  [/laptop|macbook|computer|tablet|ipad|camera|headphone|airpod|earbud|drive|usb|charger|kindle/i, "electronic-devices.jpg"],
  [/glasses|sunglass/i, "glasses.jpg"],
  [/passport|license|document|card|id\b/i, "documents.jpg"],
  [/cat\b|dog\b|pet/i, "pets.jpg"],
  [/jacket|coat|hoodie|sweater|scarf|hat\b|cap\b|glove|shirt|shoe|cloth/i, "clothes.jpg"],
];
function catImage(title?: string | null) {
  for (const [re, img] of CAT_IMAGES) if (re.test(title || "")) return `/images/categories/${img}`;
  return "/images/categories/others.jpg";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return String(d);
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PortalReview() {
  const router = useRouter();
  const { scope, base, words } = usePortal();
  const [org, setOrg] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [cross, setCross] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const api = useCallback(
    (url: string, init?: RequestInit) => portalFetch(scope, url, init),
    [scope]
  );

  const load = useCallback(async () => {
    try {
      const me = await api("/api/org/me");
      if (me.status === 401) { router.push(`${base}/login`); return; }
      const mj = await me.json();
      if (!mj.org) {
        const all = Array.isArray(mj.allOrgs) ? mj.allOrgs : [];
        const elsewhere = all.filter((o: any) => scopeOfType(o.type) !== scope);
        router.push(
          elsewhere.length
            ? `${portalBase(scopeOfType(elsewhere[0].type))}/review`
            : `${base}/onboarding`
        );
        return;
      }
      setOrg(mj.org);
      setOrgs(Array.isArray(mj.orgs) ? mj.orgs : []);
      const all = Array.isArray(mj.allOrgs) ? mj.allOrgs : [];
      setCross(all.filter((o: any) => scopeOfType(o.type) !== scope).length);

      const r = await api("/api/org/matches?status=new");
      const j = await r.json();
      setMatches(Array.isArray(j.matches) ? j.matches : []);
      setLoading(false);
    } catch {
      router.push(`${base}/login`);
    }
  }, [api, base, router, scope]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: number, action: "confirm" | "dismiss") => {
    setBusy(id);
    setError("");
    try {
      const r = await api("/api/org/matches", {
        method: "PATCH",
        body: JSON.stringify({ id, action }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `Error ${r.status}`);
      // Retrait optimiste : la ligne quitte la file, la décision est prise.
      setMatches((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError((e as Error).message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl px-5 py-16 text-gray-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <PortalNav
        current="review"
        pending={matches.length}
        orgs={orgs}
        activeId={String(org?.id || "")}
        crossPortal={cross}
        onChangeOrg={(id) => { setActiveOrgId(scope, id); setLoading(true); load(); }}
      />

      <div className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="text-3xl font-bold tracking-tight">To review</h1>
        <p className="mt-1.5 text-[15.5px] text-gray-500">
          {matches.length === 0
            ? "Nothing waiting. New matches appear here on their own."
            : words.reviewIntro}
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
            <p className="text-[15px] text-gray-500">
              Every report filed nearby is compared with your inventory, and with every item you log.
            </p>
            <Link
              href={`${base}/items/new`}
              className="mt-5 inline-block rounded-lg bg-[#16a34a] px-5 py-3 font-bold text-white"
            >
              Log a found item
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {matches.map((m) => (
              <article key={m.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3.5">
                  <span
                    className={`rounded-full px-3 py-1 text-[13px] font-bold ${
                      m.level === "strong"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                    }`}
                  >
                    {m.score} · {m.level === "strong" ? "Strong match" : "Possible match"}
                  </span>
                  <span className="text-[14px] text-gray-500">
                    {m.found.ref} · stored {m.found.stored_at || "—"}
                  </span>
                  {typeof m.found.days_left === "number" && (
                    <span
                      className={`ml-auto text-[14px] ${
                        m.found.days_left <= 3 ? "font-bold text-amber-700" : "text-gray-500"
                      }`}
                    >
                      {m.found.days_left <= 0
                        ? "hold period over"
                        : `hold ends in ${m.found.days_left} days`}
                    </span>
                  )}
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                  {/* Ce que le propriétaire a écrit */}
                  <div className="rounded-xl bg-[#f7f8fa] p-4">
                    <p className="text-[12.5px] font-bold text-gray-500">{words.reportLabel}</p>
                    <h3 className="mt-2 text-[17px] font-bold">{m.lost.title || "—"}</h3>
                    {m.lost.description && (
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-gray-600">
                        &ldquo;{m.lost.description}&rdquo;
                      </p>
                    )}
                    <dl className="mt-3 space-y-1 text-[14px]">
                      <div className="flex gap-2">
                        <dt className="w-24 flex-none text-gray-500">Lost on</dt>
                        <dd className="font-semibold">{fmtDate(m.lost.date)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-24 flex-none text-gray-500">Report</dt>
                        <dd className="font-semibold">{m.lost.reference || "—"}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Ce que le bureau détient */}
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-[12.5px] font-bold text-gray-500">THE ITEM YOU HOLD</p>
                    <div className="mt-2 flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.found.photo || catImage(m.found.title)}
                        alt=""
                        className="h-16 w-16 flex-none rounded-lg border border-gray-200 object-cover"
                      />
                      <div className="min-w-0">
                        <h3 className="text-[17px] font-bold">{m.found.title || "—"}</h3>
                        {m.found.description && (
                          <p className="mt-1 text-[14px] leading-relaxed text-gray-600">
                            {m.found.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <dl className="mt-3 space-y-1 text-[14px]">
                      <div className="flex gap-2">
                        <dt className="w-24 flex-none text-gray-500">Found on</dt>
                        <dd className="font-semibold">{fmtDate(m.found.date)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-24 flex-none text-gray-500">Where</dt>
                        <dd className="font-semibold">{m.found.found_at || "—"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Le score n'est jamais donné sans ses raisons : le bureau doit
                    pouvoir comprendre, et contredire, ce qui lui est proposé. */}
                {(m.reasons?.length > 0 || m.ai) && (
                  <div className="mx-5 mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
                    <ul className="list-disc pl-5 text-[14px] leading-relaxed text-green-900">
                      {(m.reasons || []).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                    {m.ai?.reason && (
                      <p className="mt-2 border-t border-green-200 pt-2 text-[13.5px] text-green-900/80">
                        {m.ai.reason}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-4">
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => decide(m.id, "dismiss")}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2.5 font-bold text-red-600 disabled:opacity-50"
                  >
                    Not the same item
                  </button>
                  <span className="flex-1" />
                  <span className="text-[14px] text-gray-500">
                    Nothing is sent until you decide.
                  </span>
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => decide(m.id, "confirm")}
                    className="rounded-lg bg-[#16a34a] px-5 py-2.5 font-bold text-white disabled:opacity-50"
                  >
                    {busy === m.id ? "Saving…" : words.notifyCta}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
