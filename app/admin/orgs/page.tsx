"use client";
// Admin → Organisations : cartes par établissement avec galerie miniature des
// objets (photo, sinon icône déduite du titre). Valider = page publique
// activée + mail de bienvenue automatique. Suspendre = page masquée.
import { useEffect, useState } from "react";

type OrgItem = {
  id: string;
  title: string | null;
  image_url: string | null;
  status: string | null;
  date: string | null;
};

type Org = {
  id: string;
  slug: string;
  name: string;
  type: string;
  state_id: string | null;
  city: string | null;
  public_email: string | null;
  phone: string | null;
  verified: boolean;
  public_listing: boolean;
  plan: string;
  created_at: string;
  counts: { total: number; stored: number; claims: number };
  items: OrgItem[];
  member_email: string | null;
};

const TYPE_ICON: Record<string, string> = {
  police: "🚓",
  city: "🏛️",
  university: "🎓",
  hotel: "🏨",
  transit: "🚌",
  other: "🏢",
};

// Icône de catégorie déduite du titre de l'objet (fallback quand pas de photo)
const ITEM_ICONS: [RegExp, string][] = [
  [/wallet|purse|billfold/i, "👛"],
  [/phone|iphone|samsung|android/i, "📱"],
  [/key/i, "🔑"],
  [/bag|backpack|luggage|suitcase/i, "🎒"],
  [/ring|bracelet|necklace|jewel|watch/i, "💍"],
  [/laptop|macbook|computer|tablet|ipad/i, "💻"],
  [/glasses|sunglass/i, "👓"],
  [/card|passport|license|id\b/i, "💳"],
  [/cat|dog|pet/i, "🐾"],
  [/umbrella/i, "☂️"],
  [/jacket|coat|hoodie|sweater|scarf|hat|cap|glove/i, "🧥"],
  [/headphone|airpod|earbud/i, "🎧"],
  [/book|notebook/i, "📔"],
  [/camera/i, "📷"],
  [/drive|usb|disk/i, "💾"],
];
function itemIcon(title?: string | null) {
  for (const [re, icon] of ITEM_ICONS) if (re.test(title || "")) return icon;
  return "📦";
}

const STATUS_DOT: Record<string, string> = {
  stored: "bg-emerald-500",
  claim_pending: "bg-blue-500",
  returned: "bg-gray-300",
  disposed: "bg-gray-300",
};

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/orgs");
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setOrgs(j.orgs || []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const setVerified = async (o: Org, verified: boolean) => {
    if (!verified && !confirm(`Suspendre ${o.name} ? Sa page publique sera masquée.`)) return;
    setBusyId(o.id);
    try {
      const r = await fetch("/api/admin/orgs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: o.id, verified }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setOrgs((prev) => prev.map((x) => (x.id === o.id ? { ...x, verified } : x)));
      if (j.notified) alert(`✅ ${o.name} validée, mail de bienvenue envoyé.`);
    } catch (e: any) {
      alert(`Erreur : ${e?.message || e}`);
    } finally {
      setBusyId(null);
    }
  };

  const pending = orgs.filter((o) => !o.verified);
  const active = orgs.filter((o) => o.verified);

  const Card = ({ o }: { o: Org }) => (
    <div className={`flex flex-col rounded-2xl border bg-white shadow-sm overflow-hidden ${o.verified ? "border-gray-200" : "border-amber-300"}`}>
      {/* En-tête */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
          {TYPE_ICON[o.type] || "🏢"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{o.name}</div>
          <div className="text-xs text-gray-500 truncate">
            {[o.city, o.state_id].filter(Boolean).join(", ") || "—"}
            {" · inscrite le "}{new Date(o.created_at).toLocaleDateString("fr-FR")}
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${o.verified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {o.verified ? "Vérifiée" : "En attente"}
        </span>
      </div>

      {/* Galerie objets */}
      <div className="px-4 pt-3">
        {o.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-4 text-center text-xs text-gray-400">
            Aucun objet enregistré
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {o.items.map((it) => (
              <div key={it.id} className="relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                title={`${it.title || "?"}${it.date ? ` · ${it.date}` : ""} · ${it.status || "stored"}`}>
                {it.image_url ? (
                  <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">{itemIcon(it.title)}</div>
                )}
                <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-white ${STATUS_DOT[it.status || "stored"] || "bg-gray-300"}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Infos + badges */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 text-xs text-gray-500">
        <span>{o.counts.stored} en stock / {o.counts.total} au total</span>
        {o.counts.claims > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-800">
            {o.counts.claims} réclamation{o.counts.claims > 1 ? "s" : ""}
          </span>
        )}
        {o.verified && !o.public_listing && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500" title="L'établissement a désactivé sa page publique">
            🔒 page désactivée par l'org
          </span>
        )}
      </div>
      <div className="truncate px-4 pt-1 text-xs text-gray-400">
        {o.public_email || o.member_email || "pas d'email"}{o.phone ? ` · ${o.phone}` : ""}
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 px-4 py-3">
        <a href={`/o/${o.slug}`} target="_blank" rel="noopener"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          title={o.verified ? "Voir la page publique" : "La page sera visible après validation"}>
          👁 Page publique
        </a>
        <span className="ml-auto" />
        {o.verified ? (
          <button type="button" disabled={busyId === o.id} onClick={() => setVerified(o, false)}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">
            Suspendre
          </button>
        ) : (
          <button type="button" disabled={busyId === o.id} onClick={() => setVerified(o, true)}
            className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-50">
            {busyId === o.id ? "…" : "✓ Valider"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">🏛️ Organisations</h1>
        <a href="/admin" className="text-sm text-gray-500 underline">← Admin</a>
      </div>
      <p className="text-sm text-gray-500">
        Valider une organisation active sa page publique et lui envoie automatiquement le mail de
        bienvenue avec le lien. Suspendre masque la page immédiatement.
      </p>

      {loading && <div className="text-gray-500">Chargement…</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {!loading && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              En attente ({pending.length})
            </h2>
            {pending.length === 0 && <div className="text-sm text-gray-400">Aucune inscription en attente.</div>}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pending.map((o) => <Card key={o.id} o={o} />)}
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Actives ({active.length})
            </h2>
            {active.length === 0 && <div className="text-sm text-gray-400">Aucune organisation active.</div>}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((o) => <Card key={o.id} o={o} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
