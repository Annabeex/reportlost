// app/o/[slug]/page.tsx — page publique d'un établissement.
// Affichage STRICT MINIMUM par objet : libellé générique + date + lieu général.
// Jamais de description détaillée ni de photo (elles servent de preuve de
// propriété lors des réclamations). Visible uniquement si l'organisation est
// vérifiée ET a activé sa page publique.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import OrgClaimForm from "@/components/OrgClaimForm";
import { portalBase, scopeOfType } from "@/lib/orgScope";

export const revalidate = 60; // 1 min : les ajouts/retraits d'objets doivent apparaître vite

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
  if (!org || !org.verified || !org.public_listing) return null;

  const { data: items } = await sb
    .from("found_items")
    .select("id, org_ref, public_label, title, date, dropoff_location")
    .eq("org_id", org.id)
    .eq("status", "stored")
    .eq("public_visible", true)
    .order("date", { ascending: false })
    .limit(200);

  // Signalements gardés par la personne qui a trouvé l'objet : uniquement ceux
  // qu'un agent a choisi d'afficher, et pas au-delà de 90 jours — personne ne
  // vient les mettre à jour, une liste qui vieillit seule devient fausse.
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: reports } = await sb
    .from("org_intakes")
    .select("id, title, public_label, found_at, found_location")
    .eq("org_id", org.id)
    .eq("held_by", "finder")
    .eq("status", "pending")
    .eq("public_visible", true)
    .gte("created_at", since)
    .order("found_at", { ascending: false })
    .limit(100);

  return { org, items: items || [], reports: reports || [] };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getData(params.slug);
  if (!data) return { title: "Lost & Found | ReportLost" };
  const { org } = data;
  return {
    title: `Lost & Found — ${org.name} | ReportLost`,
    description: `Found items currently held by ${org.name}${org.city ? ` in ${org.city}` : ""}. Recognize yours? Submit a claim with proof of ownership.`,
    alternates: { canonical: `https://reportlost.org/o/${org.slug}` },
  };
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default async function OrgPublicPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const { org, items, reports } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl bg-gradient-to-r from-[#26723e] to-[#2ea052] px-6 py-6 text-white">
        <p className="text-sm text-emerald-100">{TYPE_LABEL[org.type] || "Organization"}{org.city ? ` · ${org.city}${org.state_id ? `, ${org.state_id}` : ""}` : ""}</p>
        <h1 className="text-2xl font-bold">Lost &amp; Found — {org.name}</h1>
        <p className="mt-1 text-sm text-emerald-50">
          Items currently held by this organization. Recognize yours? Claim it by describing it
          precisely: details are checked before any handover.
        </p>
      </div>

      {items.length === 0 ? (
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
            These items are not at the {org.name} desk. The person who found each one kept it and left
            a contact with the office. Describe the item precisely: if your description matches, the
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

      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
        Lost something that isn&apos;t listed here?{" "}
        <Link href="/report" className="font-semibold underline">
          File a report on ReportLost
        </Link>{" "}
        and it stays active, searching for a match, including against items added here later.
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        Found an item here?{" "}
        <a href={`/o/${org.slug}/found`} className="font-semibold underline">
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
