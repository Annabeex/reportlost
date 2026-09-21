// components/orgPublic/ListPage.tsx — page publique d'un établissement,
// servie sous /campus/<slug> et /at/<slug> (voir publicPath dans lib/orgScope).
// Affichage STRICT MINIMUM par objet : libellé générique + date + lieu général.
// Jamais de description détaillée ni de photo (elles servent de preuve de
// propriété lors des réclamations).
//
// C'est la page qu'ouvre le QR code « Lost something? » : la liste d'abord,
// puis, si l'objet n'y est pas, une déclaration de perte adressée à CET
// établissement. Elle existe dès que l'établissement est vérifié ; s'il a coupé
// sa liste publique, la page reste, sans la liste, avec la déclaration.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import OrgClaimForm from "@/components/OrgClaimForm";
import OrgLostReportForm from "@/components/OrgLostReportForm";
import { portalBase, scopeOfType, publicPath, type OrgScope } from "@/lib/orgScope";


const TYPE_LABEL: Record<string, string> = {
  police: "Police department",
  city: "City services",
  university: "University",
  college: "College",
  school: "School",
  hotel: "Hotel / venue",
  transit: "Transit / airport",
  other: "Organization",
};

async function getData(slug: string) {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return null;
  const { data: org } = await sb
    .from("organizations")
    .select("id, slug, name, type, city, state_id, verified, public_listing")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  if (!org || !org.verified) return null;
  if (!org.public_listing) return { org, items: [], reports: [], listed: false };

  const { data: items } = await sb
    .from("found_items")
    .select("id, org_ref, public_label, title, date, dropoff_location")
    .eq("org_id", org.id)
    // Un objet en cours de réclamation RESTE listé : sinon la première
    // réclamation venue, erronée ou malveillante, le cacherait à son vrai
    // propriétaire. Le bureau reçoit toutes les réclamations et tranche.
    .in("status", ["stored", "claim_pending"])
    .eq("public_visible", true)
    .order("date", { ascending: false })
    .limit(200);

  // Signalements gardés par la personne qui a trouvé l'objet : listés d'office,
  // sauf ceux qu'un agent a masqués, et pas au-delà de 6 mois (durée de garde de la fiche) — personne ne
  // vient les mettre à jour, une liste qui vieillit seule devient fausse.
  const since = new Date(Date.now() - 180 * 86400000).toISOString();
  const { data: reports } = await sb
    .from("org_intakes")
    .select("id, title, public_label, found_at, found_location")
    .eq("org_id", org.id)
    // Les deux cas : « je le garde » et « je le dépose » tant que l'accueil n'a
    // pas confirmé l'avoir reçu. Dans les deux, l'objet est chez le trouveur.
    .eq("status", "pending")
    .eq("public_visible", true)
    .gte("created_at", since)
    .order("found_at", { ascending: false })
    .limit(100);

  return { org, items: items || [], reports: reports || [], listed: true };
}

export async function listMetadata(slug: string): Promise<Metadata> {
  const data = await getData(slug);
  if (!data) return { title: "Lost & Found | ReportLost" };
  const { org } = data;
  return {
    title: `Lost & Found — ${org.name} | ReportLost`,
    description: `Found items currently held by ${org.name}${org.city ? ` in ${org.city}` : ""}. Recognize yours? Submit a claim with proof of ownership.`,
    alternates: { canonical: `https://reportlost.org${publicPath(org)}` },
    // Sans liste publiée, la page n'a rien à proposer à un moteur de recherche.
    ...(data.listed ? {} : { robots: { index: false, follow: false } }),
  };
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default async function ListPage({ slug, scope }: { slug: string; scope: OrgScope }) {
  const data = await getData(slug);
  if (!data) notFound();
  // Une université ouverte sous /org/… (ou l'inverse) est renvoyée à sa vraie adresse.
  if (scopeOfType(data.org.type) !== scope) permanentRedirect(publicPath(data.org));
  const { org, items, reports, listed } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl bg-gradient-to-r from-[#26723e] to-[#2ea052] px-6 py-6 text-white">
        <p className="text-sm text-emerald-100">{TYPE_LABEL[org.type] || "Organization"}{org.city ? ` · ${org.city}${org.state_id ? `, ${org.state_id}` : ""}` : ""}</p>
        <h1 className="text-2xl font-bold">Lost &amp; Found — {org.name}</h1>
        <p className="mt-1 text-sm text-emerald-50">
          {listed
            ? "Items currently held by this organization. Recognize yours? Claim it by describing it precisely: details are checked before any handover."
            : "This organization does not publish the list of items it holds. Report what you lost below: the office compares your report with its inventory."}
        </p>
        {listed && (
          <a href="#report" className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white underline-offset-2 hover:bg-white/25">
            Not in the list? Report it to {org.name}
          </a>
        )}
      </div>

      {!listed ? null : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center text-gray-500">
          No items listed at the moment. Check back soon, new finds are added regularly.
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">{it.public_label || it.title}</span>
                <span className="text-sm text-gray-500">
                  found {fmtDate(it.date)}
                  {it.dropoff_location ? ` at ${it.dropoff_location}` : ""}
                </span>
                <span className="ml-auto" />
                <OrgClaimForm orgSlug={org.slug} itemId={String(it.id)} label={it.public_label || it.title || "this item"} />
              </div>
            </div>
          ))}
        </div>
      )}

      {reports.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[17px] font-bold text-gray-900">Kept by the person who found them</h2>
          <p className="mt-1 text-sm text-gray-600">
            These items are not at the {org.name} desk yet. Each one is still with the person who found
            it, who left a contact with the office. Describe the item precisely: if your description matches, the
            office puts you in touch.
          </p>
          <div className="mt-3 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{r.public_label || "Item"}</span>
                  <span className="text-sm text-gray-500">
                    found {fmtDate(r.found_at)}
                    {r.found_location ? ` at ${r.found_location}` : ""}
                  </span>
                  <span className="ml-auto" />
                  <OrgClaimForm orgSlug={org.slug} itemId={String(r.id)} label={r.public_label || "this item"} kind="report" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="report" className="mt-10 scroll-mt-6">
        <h2 className="text-[19px] font-bold text-gray-900">
          {listed ? `Not in the list? Report your lost item to ${org.name}` : `Report your lost item to ${org.name}`}
        </h2>
        <p className="mb-4 mt-1 text-sm text-gray-600">
          Your report goes to the {org.name} lost and found office. It is compared with the items held
          there, including items handed in later. Nothing you write here is published.
        </p>
        <OrgLostReportForm orgSlug={org.slug} orgName={org.name} />
      </section>

      <p className="mt-4 text-center text-sm text-gray-600">
        Found an item here?{" "}
        <a href={publicPath(org, "/found")} className="font-semibold underline">
          Describe it and hand it in at the front desk
        </a>
      </p>

      <p className="mt-6 text-center text-xs text-gray-400">
        Powered by ReportLost.org · Free lost &amp; found management for organizations ·{" "}
        <Link href={`${portalBase(scopeOfType(org.type))}/login`} className="underline">Create your page</Link>
      </p>
    </main>
  );
}
