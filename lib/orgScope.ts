// lib/orgScope.ts
//
// Deux portails, deux publics.
//
//   campus  → universités, écoles, collèges. Le public est étudiant, la durée
//             de conservation relève d'une politique interne, et le vocabulaire
//             parle de campus, de bibliothèque, de résidence.
//   agency  → police, mairie, transport, hôtel. Le public est un administré ou
//             un voyageur, et la conservation relève de la loi de l'État.
//
// Un même compte peut appartenir aux deux : un agent de sécurité municipale qui
// gère aussi le campus voisin. C'est le portail consulté qui détermine
// l'organisation active, jamais l'ordre des lignes en base.

export type OrgScope = "campus" | "agency";

const CAMPUS_TYPES = new Set(["university", "school", "college"]);

export function scopeOfType(type?: string | null): OrgScope {
  return CAMPUS_TYPES.has(String(type || "").toLowerCase()) ? "campus" : "agency";
}

export function isScope(v: unknown): v is OrgScope {
  return v === "campus" || v === "agency";
}

export function otherScope(scope: OrgScope): OrgScope {
  return scope === "campus" ? "agency" : "campus";
}

/** Racine des pages du portail correspondant. */
export function portalBase(scope: OrgScope): string {
  return scope === "campus" ? "/campus" : "/org";
}

/** Page publique d'un établissement :
 *    reportlost.org/campus/<slug>  université, collège, école
 *    reportlost.org/at/<slug>      police, mairie, transport, hôtel, autre
 *  (« ReportLost at Tucson Police » : l'adresse se lit comme une phrase.)
 *  Les anciennes formes /o/<slug> et /org/<slug> redirigent ici. */
export function publicBase(scope: OrgScope): string {
  return scope === "campus" ? "/campus" : "/at";
}
export function publicPath(org: { slug: string; type?: string | null }, sub = ""): string {
  return `${publicBase(scopeOfType(org.type))}/${org.slug}${sub}`;
}

/** Noms pris par les écrans du portail sous /campus et /org : un établissement
 *  ne peut pas s'appeler ainsi, son adresse publique tomberait sur le portail. */
export const RESERVED_SLUGS = new Set([
  "login", "dashboard", "items", "review", "team", "import", "onboarding",
  "settings", "new", "admin", "api", "found", "embed", "help",
]);

/** Types proposés à l'inscription, restreints au portail d'entrée : on ne crée
 *  pas un commissariat depuis /campus. */
export const ORG_TYPES: Record<OrgScope, { v: string; l: string }[]> = {
  campus: [
    { v: "university", l: "University" },
    { v: "college", l: "College" },
    { v: "school", l: "School district / high school" },
  ],
  agency: [
    { v: "police", l: "Police department" },
    { v: "city", l: "City hall / municipality" },
    { v: "transit", l: "Transit / airport" },
    { v: "hotel", l: "Hotel / venue / business" },
    { v: "other", l: "Other" },
  ],
};

/** Vocabulaire. Un bureau universitaire ne parle pas d'« administré », et un
 *  commissariat ne parle pas d'« étudiant ». Tout le texte propre au portail
 *  passe par ici : les écrans, eux, restent communs. */
export const WORDS: Record<OrgScope, {
  portal: string;
  brandSuffix: string;
  owner: string;
  owners: string;
  ownerThe: string;
  holdSource: string;
  signinTitle: string;
  signupTitle: string;
  loginSubtitle: string;
  setupTitle: string;
  setupSubtitle: string;
  orgLabel: string;
  orgPlaceholder: string;
  posterHint: string;
  reviewIntro: string;
  reportLabel: string;
  notifyCta: string;
}> = {
  campus: {
    portal: "Campus Lost & Found",
    brandSuffix: "for campus",
    owner: "student",
    owners: "students",
    ownerThe: "the student",
    holdSource: "your published policy",
    signinTitle: "Campus sign in",
    signupTitle: "Create your campus account",
    loginSubtitle:
      "Free lost and found management for universities, colleges and school districts.",
    setupTitle: "Set up your campus lost & found",
    setupSubtitle:
      "Free, no card required. Your public page goes live after a quick manual review by our team.",
    orgLabel: "Institution name",
    orgPlaceholder: "e.g. New York University",
    posterHint:
      "Print this poster for the front desk, the library and the residence halls: students scan the QR code to file their report",
    reviewIntro: "A student reported an item that looks like one you hold.",
    reportLabel: "THE STUDENT'S REPORT",
    notifyCta: "Notify the student",
  },
  agency: {
    portal: "Lost & Found",
    brandSuffix: "for organizations",
    owner: "owner",
    owners: "owners",
    ownerThe: "the owner",
    holdSource: "state law",
    signinTitle: "Organization sign in",
    signupTitle: "Create your organization account",
    loginSubtitle:
      "Free found property management for police departments, hotels, transit and venues.",
    setupTitle: "Set up your organization",
    setupSubtitle:
      "Free plan, no card required. Your public page goes live after a quick manual review by our team.",
    orgLabel: "Organization name",
    orgPlaceholder: "e.g. Tucson Police Department",
    posterHint:
      "Print this poster for your front desk: visitors scan the QR code to file their lost item report",
    reviewIntro: "Someone reported an item that looks like one you hold.",
    reportLabel: "THE OWNER'S REPORT",
    notifyCta: "Notify the owner",
  },
};
