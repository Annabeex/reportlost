// components/orgPublic/ListPage.tsx — page publique d'un établissement,
// servie sous /campus/<slug> et /lost-property/<slug> (voir publicPath dans
// lib/orgScope).
//
// Affichage STRICT MINIMUM par objet : libellé générique + date + lieu général.
// Jamais de description détaillée ni de photo (elles servent de preuve de
// propriété lors des réclamations).
//
// C'est la page qu'ouvre le QR code « Lost something? » : la liste d'abord,
// puis, si l'objet n'y est pas, une déclaration de perte adressée à CET
// établissement. Elle existe dès que l'établissement est vérifié ; s'il a coupé
// sa liste publique, la page reste, sans la liste, avec la déclaration.
//
// MISE EN PAGE. La page ne porte ni la navbar ni le pied de page de
// reportlost.org (voir components/SiteChrome.tsx) : pour le visiteur, c'est la
// page de SON commissariat ou de SON université, et un service municipal doit
// pouvoir la mettre en lien depuis son propre site sans avoir l'impression
// d'envoyer ses administrés chez un tiers. D'où un en-tête propre à
// l'établissement, des bandeaux pleine largeur, et sur grand écran deux
// colonnes : l'inventaire à gauche, les informations pratiques à droite. Les
// objets restent en lignes pleine largeur et non en grille, parce que le
// formulaire de réclamation s'ouvre sous l'objet et a besoin de la place.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import OrgPublicItems from "@/components/OrgPublicItems";
import OrgLostReportForm from "@/components/OrgLostReportForm";
import { portalBase, scopeOfType, publicPath, type OrgScope } from "@/lib/orgScope";

// Page de démonstration (slug « demo-… ») : elle doit s'ouvrir sans compte pour
// qui reçoit le lien, et ne JAMAIS apparaître dans Google — personne ne doit
// tomber sur un bureau d'objets trouvés fictif en cherchant le vrai.
const estDemo = (slug?: string | null) => /^demo(-|$)/.test(String(slug || "").toLowerCase());

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
    .select("id, slug, name, type, city, state_id, verified, public_listing, public_intro, public_hours, public_location, public_show_date, public_show_place")
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
    ...(data.listed && !estDemo(org.slug) ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function ListPage({ slug, scope }: { slug: string; scope: OrgScope }) {
  const data = await getData(slug);
  if (!data) notFound();
  // Une université ouverte sous /lost-property/… (ou l'inverse) est renvoyée à
  // sa vraie adresse.
  if (scopeOfType(data.org.type) !== scope) permanentRedirect(publicPath(data.org));
  const { org, items, reports, listed } = data;

  const lieu = [org.city, org.state_id].filter(Boolean).join(", ");
  const foundHref = publicPath(org, "/found");
  const held = items.length;
  const withFinder = reports.length;

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      {/* ── En-tête de l'établissement ──────────────────────────────────────
          Pleine largeur et collante : le nom reste visible pendant qu'on fait
          défiler la liste, et c'est lui qui donne la légitimité à la page. */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 flex-none rounded-full bg-[#2ea052]" aria-hidden="true" />
              <p className="truncate text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
                {TYPE_LABEL[org.type] || "Organization"}{lieu ? ` · ${lieu}` : ""}
              </p>
            </div>
            <h1 className="mt-0.5 truncate text-[20px] font-bold leading-tight text-gray-900 sm:text-[23px]">
              {org.name} — Lost &amp; Found
            </h1>
          </div>
          <nav className="flex flex-none flex-wrap items-center gap-2">
            <a
              href="#report"
              className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:brightness-105"
            >
              I lost something
            </a>
            <Link
              href={foundHref}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              I found something
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Bandeau d'explication, pleine largeur ─────────────────────────── */}
      <div className="border-b border-[#1d5c33] bg-gradient-to-r from-[#1f5f34] to-[#2ea052]">
        <div className="mx-auto max-w-6xl px-5 py-7">
          <p className="max-w-3xl text-[15.5px] leading-relaxed text-emerald-50">
            {org.public_intro
              ? org.public_intro
              : listed
              ? "Below is what this office currently holds, listed by category only. Recognize something? Claim it by describing it precisely — the details you give are checked against the office's own record before anything is handed over."
              : "This office does not publish the list of items it holds. Describe what you lost below: staff compare your report with the inventory, including items handed in later."}
          </p>
          {listed && (
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <div className="text-[26px] font-bold leading-none text-white">{held}</div>
                <div className="mt-1 text-[12.5px] font-medium text-emerald-100">
                  item{held === 1 ? "" : "s"} held at the office
                </div>
              </div>
              {withFinder > 0 && (
                <div>
                  <div className="text-[26px] font-bold leading-none text-white">{withFinder}</div>
                  <div className="mt-1 text-[12.5px] font-medium text-emerald-100">
                    still with the person who found {withFinder === 1 ? "it" : "them"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Corps : inventaire à gauche, informations pratiques à droite ──── */}
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0">
            {listed && (
              <OrgPublicItems
                orgSlug={org.slug}
                orgName={org.name}
                showDate={org.public_show_date !== false}
                showPlace={org.public_show_place !== false}
                items={items.map((it) => ({
                  id: String(it.id), kind: "item" as const,
                  label: it.public_label || it.title || "Item", date: it.date, place: it.dropoff_location,
                }))}
                reports={reports.map((r) => ({
                  id: String(r.id), kind: "report" as const,
                  label: r.public_label || "Item", date: r.found_at, place: r.found_location,
                }))}
              />
            )}

            {/* Le formulaire apporte son propre encadré blanc : le titre et
                l'explication restent dehors, sinon on obtient deux bordures
                imbriquées. */}
            <section id="report" className={`scroll-mt-24 ${listed ? "mt-10" : ""}`}>
              <h2 className="text-[19px] font-bold text-gray-900">
                {listed ? `Not in the list? Report it to ${org.name}` : `Report your lost item to ${org.name}`}
              </h2>
              <p className="mb-4 mt-1.5 text-[14px] leading-relaxed text-gray-600">
                Your report goes to the {org.name} lost and found office. It is compared with the items
                held there, including items handed in later. Nothing you write here is published.
              </p>
              <OrgLostReportForm orgSlug={org.slug} orgName={org.name} />
            </section>
          </main>

          {/* Colonne de droite : ce qu'on vient chercher quand on a reconnu son
              objet — où aller, quand, et comment déposer ce qu'on a trouvé. */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {(org.public_location || org.public_hours) && (
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
                {org.public_location && (
                  <div>
                    <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">Where to go</div>
                    <div className="mt-1 whitespace-pre-line text-[14.5px] leading-relaxed text-gray-900">{org.public_location}</div>
                  </div>
                )}
                {org.public_location && org.public_hours && <hr className="my-4 border-gray-100" />}
                {org.public_hours && (
                  <div>
                    <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">Opening hours</div>
                    <div className="mt-1 whitespace-pre-line text-[14.5px] leading-relaxed text-gray-900">{org.public_hours}</div>
                  </div>
                )}
              </div>
            )}

            <Link
              href={foundHref}
              className="block rounded-2xl border border-[#2ea052] bg-[#f2fbf5] px-5 py-4 hover:bg-[#e9f8ef]"
            >
              <div className="text-[15px] font-bold text-[#1f5f34]">You found something?</div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#2a6b41]">
                Describe it in two minutes. You can hand it in at the desk, or keep it and leave a contact
                so the office can put the owner in touch with you.
              </p>
              <span className="mt-2 inline-block text-[13.5px] font-semibold text-[#1f5f34] underline">
                Report a found item →
              </span>
            </Link>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-[13px] leading-relaxed text-gray-600">
              <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">How claims are checked</div>
              <p className="mt-1.5">
                Items are listed by category only. Descriptions, serial numbers and photos are never
                published — they are what the office uses to tell the real owner from someone guessing.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Pied de page propre à la page ──────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-[12.5px] text-gray-500">
          <p>
            Lost and found service of {org.name}
            {lieu ? `, ${lieu}` : ""}.{" "}
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
