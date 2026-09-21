// components/orgPublic/FoundPage.tsx (servie sous /campus/<slug>/found et
// /at/<slug>/found) — « j'ai trouvé un objet » : page ouverte par le
// QR code affiché dans l'établissement. La personne décrit l'objet elle-même,
// puis le remet à l'accueil avec un code. L'accueil n'a plus qu'à confirmer.
//
// Accessible dès que l'établissement est vérifié, même si sa page publique
// d'objets est coupée : ce sont deux choix indépendants.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { scopeOfType, publicPath, type OrgScope } from "@/lib/orgScope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import OrgFoundForm from "@/components/OrgFoundForm";


async function getOrg(slug: string) {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return null;
  const { data: org } = await sb
    .from("organizations")
    .select("slug, name, type, city, state_id, verified, public_listing, finder_held_enabled")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  return org && org.verified ? org : null;
}

export async function foundMetadata(slug: string): Promise<Metadata> {
  const org = await getOrg(slug);
  return {
    title: org ? `Hand in a found item | ${org.name}` : "Hand in a found item | ReportLost",
    // Page utilitaire, atteinte par QR code : rien à indexer.
    robots: { index: false, follow: false },
  };
}

export default async function FoundPage({ slug, scope }: { slug: string; scope: OrgScope }) {
  const org = await getOrg(slug);
  if (!org) notFound();
  if (scopeOfType(org.type) !== scope) permanentRedirect(publicPath(org, "/found"));

  return (
    <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="rounded-2xl bg-gradient-to-r from-[#26723e] to-[#2ea052] px-5 py-5 text-white">
        <p className="text-sm text-emerald-100">
          {org.name}{org.city ? ` · ${org.city}${org.state_id ? `, ${org.state_id}` : ""}` : ""}
        </p>
        <h1 className="text-2xl font-bold">Hand in a found item</h1>
        <p className="mt-1 text-sm text-emerald-50">
          Describe the item below. You then bring it to the front desk with the code shown on the
          next screen, and the desk confirms it has the item.
        </p>
      </div>

      <OrgFoundForm orgSlug={org.slug} orgName={org.name} listHref={publicPath(org)} publicListing={!!org.public_listing} allowKeep={org.finder_held_enabled !== false} />
    </main>
  );
}
