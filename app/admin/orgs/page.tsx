"use client";
// Admin → Organisations : un bloc par établissement (bandeau compact avec les
// actions Valider/Suspendre) puis SES OBJETS en vignettes, 4 par ligne, avec
// la photo réelle ou l'image de catégorie du site en fallback.
import { useEffect, useState } from "react";

type OrgItem = {
  id: string;
  org_ref: string | null;
  title: string | null;
  image_url: string | null;
  status: string | null;
  date: string | null;
  public_visible?: boolean;
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

// Image de catégorie du site (public/images/categories) déduite du titre,
// utilisée quand l'objet n'a pas de photo. Mêmes visuels que les pages catégorie.
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

const STATUS_LABEL: Record<string, string> = {
  stored: "En stock",
  claim_pending: "Réclamation",
  returned: "Rendu",
  disposed: "Sorti",
};
const STATUS_STYLE: Record<string, string> = {
  stored: "bg-emerald-50 text-emerald-800",
  claim_pending: "bg-blue-50 text-blue-800",
  returned: "bg-gray-100 text-gray-500",
  disposed: "bg-gray-100 text-gray-400",
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

  const OrgBlock = ({ o }: { o: Org }) => (
    <section className={`rounded-xl border bg-white shadow-sm ${o.verified ? "border-gray-200" : "border-amber-300"}`}>
      {/* Bandeau organisation : identité + actions */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <span className="text-lg">{TYPE_ICON[o.type] || "🏢"}</span>
        <span className="font-semibold text-gray-900">{o.name}</span>
        <span className="text-xs text-gray-500">{[o.city, o.state_id].filter(Boolean).join(", ")}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${o.verified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {o.verified ? "Vérifiée" : "En attente"}
        </span>
        {o.counts.claims > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800">
            {o.counts.claims} réclamation{o.counts.claims > 1 ? "s" : ""}
          </span>
        )}
        {o.verified && !o.public_listing && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500" title="L'établissement a désactivé sa page publique">
            🔒 page désactivée par l'org
          </span>
        )}
        <span className="hidden sm:inline text-[11px] text-gray-400 truncate max-w-[220px]"
          title={`inscrite le ${new Date(o.created_at).toLocaleDateString("fr-FR")}${o.phone ? ` · ${o.phone}` : ""}`}>
          {o.public_email || o.member_email || "pas d'email"}
        </span>
        <span className="ml-auto" />
        <a href={`/o/${o.slug}`} target="_blank" rel="noopener"
          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
          title={o.verified ? "Voir la page publique" : "La page sera visible après validation"}>
          👁 Page publique
        </a>
        {o.verified ? (
          <button type="button" disabled={busyId === o.id} onClick={() => setVerified(o, false)}
            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">
            Suspendre
          </button>
        ) : (
          <button type="button" disabled={busyId === o.id} onClick={() => setVerified(o, true)}
            className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-3 py-1 text-xs font-semibold text-white shadow disabled:opacity-50">
            {busyId === o.id ? "…" : "✓ Valider"}
          </button>
        )}
      </div>

      {/* Objets en vignettes, 4 par ligne */}
      <div className="p-3">
        {o.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-xs text-gray-400">
            Aucun objet enregistré
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {o.items.map((it) => (
              <div key={it.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="relative h-24 bg-gray-50">
                  <img src={it.image_url || catImage(it.title)} alt="" className="h-full w-full object-cover" />
                  {it.public_visible === false && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white" title="Masqué de la page publique">
                      🚫 privé
                    </span>
                  )}
                  <span className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[it.status || "stored"]}`}>
                    {STATUS_LABEL[it.status || "stored"]}
                  </span>
                </div>
                <div className="px-2.5 py-2">
                  <div className="truncate text-sm font-medium text-gray-900" title={it.title || ""}>{it.title || "—"}</div>
                  <div className="truncate text-[11px] text-gray-400">
                    {it.org_ref || ""}{it.date ? ` · trouvé le ${new Date(`${it.date}T00:00:00`).toLocaleDateString("fr-FR")}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const pending = orgs.filter((o) => !o.verified);
  const active = orgs.filter((o) => o.verified);

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
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                En attente ({pending.length})
              </h2>
              {pending.map((o) => <OrgBlock key={o.id} o={o} />)}
            </div>
          )}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Actives ({active.length})
            </h2>
            {active.length === 0 && <div className="text-sm text-gray-400">Aucune organisation active.</div>}
            {active.map((o) => <OrgBlock key={o.id} o={o} />)}
          </div>
        </>
      )}
    </div>
  );
}
