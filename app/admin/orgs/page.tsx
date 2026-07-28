"use client";
// Admin → Organisations : valider ou suspendre les inscriptions du portail
// établissements. La validation envoie automatiquement le mail de bienvenue
// avec le lien de la page publique.
import { useEffect, useState } from "react";

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

  const Row = ({ o }: { o: Org }) => (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <span className="text-xl">{TYPE_ICON[o.type] || "🏢"}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">{o.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${o.verified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            {o.verified ? "Vérifiée" : "En attente"}
          </span>
          {o.verified && !o.public_listing && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500" title="L'établissement a désactivé sa page publique">
              🔒 page désactivée par l'org
            </span>
          )}
          {o.counts.claims > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800">
              {o.counts.claims} réclamation{o.counts.claims > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="truncate text-xs text-gray-500">
          {[o.city, o.state_id].filter(Boolean).join(", ")}
          {" · "}{o.counts.stored} en stock / {o.counts.total} au total
          {" · "}{o.public_email || o.member_email || "pas d'email"}
          {o.phone ? ` · ${o.phone}` : ""}
          {" · inscrite le "}{new Date(o.created_at).toLocaleDateString("fr-FR")}
        </div>
      </div>
      <a href={`/o/${o.slug}`} target="_blank" rel="noopener"
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        title={o.verified ? "Voir la page publique" : "La page sera visible après validation"}>
        👁 /o/{o.slug}
      </a>
      {o.verified ? (
        <button type="button" disabled={busyId === o.id} onClick={() => setVerified(o, false)}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">
          Suspendre
        </button>
      ) : (
        <button type="button" disabled={busyId === o.id} onClick={() => setVerified(o, true)}
          className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-50">
          {busyId === o.id ? "…" : "✓ Valider"}
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
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
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              En attente ({pending.length})
            </h2>
            {pending.length === 0 && <div className="text-sm text-gray-400">Aucune inscription en attente.</div>}
            {pending.map((o) => <Row key={o.id} o={o} />)}
          </section>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Actives ({active.length})
            </h2>
            {active.length === 0 && <div className="text-sm text-gray-400">Aucune organisation active.</div>}
            {active.map((o) => <Row key={o.id} o={o} />)}
          </section>
        </>
      )}
    </div>
  );
}
