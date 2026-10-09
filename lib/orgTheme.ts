// lib/orgTheme.ts
//
// Couleur des écrans publics, par portail.
//
//   campus  → vert, la couleur historique de ReportLost
//   agency  → bleu, pour les commissariats, les mairies et les transports
//
// Un responsable de property room n'a pas les mêmes repères visuels qu'un
// bureau de campus : le bleu est la couleur des services de police aux
// États-Unis, et une page verte se lit comme une page commerciale.
//
// Les valeurs sont des CHAÎNES COMPLÈTES de classes Tailwind, jamais
// construites par interpolation : le compilateur ne lit que ce qui apparaît
// littéralement dans le source, et `bg-[${couleur}]` ne produirait aucune
// règle CSS.

import type { OrgScope } from "@/lib/orgScope";

export type OrgTheme = {
  /** Pastille ronde de l'en-tête. */
  dot: string;
  /** Bandeau pleine largeur sous l'en-tête. */
  band: string;
  bandText: string;
  bandMuted: string;
  /** Les grands chiffres du bandeau. */
  bandStrong: string;
  /** Bouton principal (« I lost something »). */
  cta: string;
  /** Encart « You found something? » de la colonne de droite. */
  sideCard: string;
  sideTitle: string;
  sideBody: string;
  /** Champs de formulaire : bordure et anneau au focus. */
  field: string;
  /** Bouton d'envoi des formulaires. */
  submit: string;
  /** Bouton « This is mine » et son formulaire déplié. */
  claimButton: string;
  claimPanel: string;
  claimSubmit: string;
  /** Confirmation : pastille et code de référence. */
  doneBadge: string;
  codeText: string;
  /** Choix « je dépose / je garde » du formulaire d'objet trouvé. */
  choiceOn: string;
  accentControl: string;
  accentLink: string;
};

export const ORG_THEME: Record<OrgScope, OrgTheme> = {
  campus: {
    dot: "bg-[#2ea052]",
    band: "border-[#1d5c33] bg-gradient-to-r from-[#1f5f34] to-[#2ea052]",
    bandText: "text-emerald-50",
    bandMuted: "text-emerald-100",
    bandStrong: "text-white",
    cta: "bg-gradient-to-r from-[#26723e] to-[#2ea052]",
    sideCard: "border-[#2ea052] bg-[#f2fbf5] hover:bg-[#e9f8ef]",
    sideTitle: "text-[#1f5f34]",
    sideBody: "text-[#2a6b41]",
    field: "focus:border-emerald-500 focus:ring-emerald-100",
    submit: "bg-[#16a34a] hover:bg-[#15913f]",
    claimButton: "border-[#2ea052] text-[#226638] hover:bg-[#f2fbf5]",
    claimPanel: "border-emerald-200 bg-emerald-50/50",
    claimSubmit: "bg-gradient-to-r from-[#26723e] to-[#2ea052]",
    doneBadge: "bg-emerald-100 text-emerald-800",
    codeText: "text-[#14532d]",
    choiceOn: "border-emerald-500 bg-emerald-50/60",
    accentControl: "accent-emerald-600",
    accentLink: "text-emerald-700",
  },
  agency: {
    // Le bleu de reportlost.org, celui des cartes d'annonces de la page
    // d'accueil (blue-800 sur blue-50) : la page d'un commissariat doit avoir
    // l'air de venir du même site, pas d'un thème inventé pour l'occasion.
    dot: "bg-blue-600",
    // Bandeau CLAIR, pas un dégradé marine : c'est le rapport de ton site,
    // du texte bleu sur un fond très clair. Une grande surface bleu foncé
    // écrase la page et ne ressemble à rien d'administratif.
    band: "border-blue-200 bg-blue-50",
    bandText: "text-blue-900",
    bandMuted: "text-blue-700",
    bandStrong: "text-blue-800",
    cta: "bg-gradient-to-r from-blue-800 to-blue-600",
    sideCard: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    sideTitle: "text-blue-800",
    sideBody: "text-blue-700",
    field: "focus:border-blue-500 focus:ring-blue-100",
    submit: "bg-blue-700 hover:bg-blue-800",
    claimButton: "border-blue-500 text-blue-800 hover:bg-blue-50",
    claimPanel: "border-blue-200 bg-blue-50/60",
    claimSubmit: "bg-gradient-to-r from-blue-800 to-blue-600",
    doneBadge: "bg-blue-100 text-blue-900",
    codeText: "text-blue-900",
    choiceOn: "border-blue-500 bg-blue-50/60",
    accentControl: "accent-blue-600",
    accentLink: "text-blue-700",
  },
};

export const themeOf = (scope: OrgScope): OrgTheme => ORG_THEME[scope] || ORG_THEME.campus;
