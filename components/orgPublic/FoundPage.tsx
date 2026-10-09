// components/orgPublic/FoundPage.tsx (servie sous /campus/<slug>/found et
// /lost-property/<slug>/found) — « j'ai trouvé un objet » : page ouverte par le
// QR code affiché dans l'établissement. La personne décrit l'objet elle-même,
// puis le remet à l'accueil avec un code. L'accueil n'a plus qu'à confirmer.
//
// Accessible dès que l'établissement est vérifié, même si sa page publique
// d'objets est coupée : ce sont deux choix indépendants.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { portalBase, scopeOfType, publicPath, type OrgScope } from "@/lib/orgScope";
import { themeOf } from "@/lib/orgTheme";
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

  const t = themeOf(scope);
  const lieu = [org.city, org.state_id].filter(Boolean).join(", ");

  // Le formulaire reste en colonne étroite : on arrive ici par le QR code du
  // comptoir, donc sur un téléphone, et une seule colonne est ce qui se remplit
  // le plus vite. En revanche l'en-tête et le pied de page sont ceux de la page
  // publique : la navbar de reportlost.org n'est plus affichée ici, et sans
  // repère la personne ne saurait plus chez qui elle dépose.
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 flex-none rounded-full ${t.dot}`} aria-hidden="true" />
              <p className="truncate text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
                {org.name}{lieu ? ` · ${lieu}` : ""}
              </p>
            </div>
            <h1 className="mt-0.5 text-[20px] font-bold leading-tight text-gray-900 sm:text-[23px]">
              Hand in a found item
            </h1>
          </div>
          {org.public_listing && (
            <Link
              href={publicPath(org)}
              className="flex-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              See the items held
            </Link>
          )}
        </div>
      </header>

      <div className={`border-b ${t.band}`}>
        <div className="mx-auto max-w-6xl px-5 py-6">
          <p className={`max-w-2xl text-[15.5px] leading-relaxed ${t.bandText}`}>
            Describe the item below. You then bring it to the front desk with the code shown on the next
            screen, and the desk confirms it has the item{org.finder_held_enabled !== false ? " — or you can keep it and leave a contact instead" : ""}.
          </p>
        </div>
      </div>

      {/* OrgFoundForm apporte son propre encadré blanc : pas de carte ici,
          sinon deux bordures imbriquées. */}
      <main className="mx-auto max-w-xl px-5 pb-10 pt-3">
        <OrgFoundForm
          scope={scope}
          orgSlug={org.slug}
          orgName={org.name}
          listHref={publicPath(org)}
          publicListing={!!org.public_listing}
          allowKeep={org.finder_held_enabled !== false}
        />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-[12.5px] text-gray-500">
          <p>
            Lost and found service of {org.name}{lieu ? `, ${lieu}` : ""}.{" "}
            <Link href="/privacy/institutions" className="underline hover:text-gray-700">Privacy notice</Link>
          </p>
          <p>
            Powered by ReportLost.org ·{" "}
            <Link href={`${portalBase(scopeOfType(org.type))}/login`} className="underline hover:text-gray-700">
              Create a page for your office
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
