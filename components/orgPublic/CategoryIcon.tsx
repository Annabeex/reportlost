// components/orgPublic/CategoryIcon.tsx
//
// Petit repère visuel par catégorie, sur la liste publique des objets.
//
// Trait seul, monochrome, jamais de couleur : la page sert à reconnaître son
// objet dans une liste, pas à être décorée. Une pastille colorée par catégorie
// ferait croire à un statut, et le vrai statut (détenu au bureau / encore chez
// le trouveur) est déjà porté par les deux sections de la page.
//
// Les icônes héritent de `currentColor` : la couleur vient du conteneur, donc
// du thème du portail (vert campus, bleu commissariat).

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const ICONS: Record<string, JSX.Element> = {
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M10.5 18.6h3" />
    </>
  ),
  tablet: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="2" />
      <path d="M10.5 18h3" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2.5 19h19" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 15v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.4" y="14" width="4" height="6.2" rx="1.6" />
      <rect x="17.6" y="14" width="4" height="6.2" rx="1.6" />
    </>
  ),
  camera: (
    <>
      <rect x="2.5" y="7" width="19" height="12.5" rx="2" />
      <circle cx="12" cy="13.2" r="3.4" />
      <path d="M8.5 7 10 4.5h4L15.5 7" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v4M15 3v4" />
      <path d="M6 7h12v3a6 6 0 0 1-12 0V7Z" />
      <path d="M12 16v5" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <rect x="8" y="5.5" width="8" height="3.4" rx="0.8" />
      <path d="M8.6 13h.01M12 13h.01M15.4 13h.01M8.6 17h.01M12 17h.01M15.4 17h.01" />
    </>
  ),
  wallet: (
    <>
      <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
      <circle cx="17" cy="14.6" r="1.1" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 14.5h4" />
    </>
  ),
  keys: (
    <>
      <circle cx="7.4" cy="7.4" r="3.6" />
      <path d="M10 10l8.6 8.6" />
      <path d="M15.4 15.4l2.2-2.2M17.8 17.8l2.2-2.2" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="14.6" r="5.4" />
      <path d="M8.8 9.7 12 5.2l3.2 4.5" />
      <path d="M8.8 9.7h6.4" />
    </>
  ),
  watch: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M9.2 7.3 9.6 3h4.8l.4 4.3M9.2 16.7 9.6 21h4.8l.4-4.3" />
      <path d="M12 9.8V12l1.6 1.2" />
    </>
  ),
  glasses: (
    <>
      <circle cx="6.4" cy="13.2" r="3.5" />
      <circle cx="17.6" cy="13.2" r="3.5" />
      <path d="M9.9 13.2h4.2" />
      <path d="M2.9 10.8 5 7.6M21.1 10.8 19 7.6" />
    </>
  ),
  backpack: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9.5Z" />
      <path d="M9.6 8.2V6.6a2.4 2.4 0 0 1 4.8 0v1.6" />
      <path d="M9 14.2h6" />
    </>
  ),
  bag: (
    <>
      <path d="M4.6 8h14.8l-1.2 11.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L4.6 8Z" />
      <path d="M8.8 8V6.2a3.2 3.2 0 0 1 6.4 0V8" />
    </>
  ),
  luggage: (
    <>
      <rect x="4.5" y="7" width="15" height="13" rx="2" />
      <path d="M9.5 7V4.8a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M9.6 11v5M14.4 11v5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h7.6L19 8.3V21H6V3Z" />
      <path d="M13.6 3v5.3H19" />
      <path d="M9 13.4h6M9 16.8h6" />
    </>
  ),
  bottle: (
    <>
      <path d="M10 2.6h4v2.2l1.4 2.1A4 4 0 0 1 16 9.1v10.4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9.1a4 4 0 0 1 .6-2.2L10 4.8V2.6Z" />
      <path d="M8 11.2h8" />
    </>
  ),
  umbrella: (
    <>
      <path d="M2.6 12.2a9.4 9.4 0 0 1 18.8 0Z" />
      <path d="M12 12.2v6.4a2.6 2.6 0 0 0 5.2 0" />
    </>
  ),
  hanger: (
    <>
      <path d="M12 7.6a2.2 2.2 0 1 1 2.2-2.2" />
      <path d="M12 7.6v2L3.6 15.6a1.5 1.5 0 0 0 .9 2.7h15a1.5 1.5 0 0 0 .9-2.7L12 9.6" />
    </>
  ),
  bike: (
    <>
      <circle cx="5.8" cy="16.4" r="3.6" />
      <circle cx="18.2" cy="16.4" r="3.6" />
      <path d="M5.8 16.4 10 8h4.6l3.6 8.4" />
      <path d="M8.6 8h4.2" />
    </>
  ),
  toy: (
    <>
      <circle cx="12" cy="13.6" r="5.4" />
      <circle cx="7.2" cy="7.7" r="2.5" />
      <circle cx="16.8" cy="7.7" r="2.5" />
    </>
  ),
  tag: (
    <>
      <path d="M11.4 3H21v9.6l-9.3 9.3a1.8 1.8 0 0 1-2.5 0l-7.1-7.1a1.8 1.8 0 0 1 0-2.5L11.4 3Z" />
      <circle cx="17" cy="7" r="1.3" />
    </>
  ),
};

/** Libellés produits par guessPublicLabel (lib/orgItems.ts). */
const PAR_LIBELLE: Record<string, string> = {
  "wallet": "wallet",
  "headphones": "headphones",
  "phone": "phone",
  "laptop": "laptop",
  "tablet": "tablet",
  "charger": "plug",
  "usb drive": "plug",
  "camera": "camera",
  "calculator": "calculator",
  "keys": "keys",
  "backpack": "backpack",
  "luggage": "luggage",
  "bag": "bag",
  "watch": "watch",
  "jewelry": "ring",
  "glasses": "glasses",
  "id / document": "document",
  "card": "card",
  "water bottle": "bottle",
  "umbrella": "umbrella",
  "book / notebook": "document",
  "jacket": "hanger",
  "hat / scarf / gloves": "hanger",
  "shoes": "hanger",
  "clothing": "hanger",
  "bike / scooter gear": "bike",
  "toy": "toy",
  "item": "tag",
};

// Un agent peut écrire son propre libellé public : on retombe sur le texte.
const PAR_TEXTE: [RegExp, string][] = [
  [/wallet|purse|billfold/i, "wallet"],
  [/airpod|earbud|headphone|earphone/i, "headphones"],
  [/phone|iphone|samsung|pixel/i, "phone"],
  [/laptop|macbook|chromebook/i, "laptop"],
  [/tablet|ipad|kindle/i, "tablet"],
  [/charger|cable|adapter|power ?bank|usb|drive/i, "plug"],
  [/camera|gopro/i, "camera"],
  [/calculator/i, "calculator"],
  [/\bkeys?\b|keychain|fob/i, "keys"],
  [/\brings?\b|bracelet|necklace|earring|jewel|pendant/i, "ring"],
  [/watch/i, "watch"],
  [/sunglass|glasses|spectacle/i, "glasses"],
  [/backpack|rucksack/i, "backpack"],
  [/suitcase|luggage/i, "luggage"],
  [/\bbags?\b|handbag|tote|pouch/i, "bag"],
  [/passport|licen[cs]e|id card|document|certificate|book|notebook|binder|folder/i, "document"],
  [/credit card|debit card|bank card|metrocard|transit card/i, "card"],
  [/bottle|flask|thermos|tumbler|mug/i, "bottle"],
  [/umbrella/i, "umbrella"],
  [/jacket|coat|hoodie|sweater|scarf|\bhats?\b|\bcaps?\b|glove|shoe|sneaker|boot|shirt|cloth/i, "hanger"],
  [/bike|bicycle|scooter|skateboard|helmet/i, "bike"],
  [/toy|plush|teddy/i, "toy"],
];

export function iconKey(label?: string | null): string {
  const t = String(label || "").trim();
  const exact = PAR_LIBELLE[t.toLowerCase()];
  if (exact) return exact;
  for (const [re, key] of PAR_TEXTE) if (re.test(t)) return key;
  return "tag";
}

export default function CategoryIcon({ label, size = 20, ...rest }: P & { label?: string | null }) {
  const key = iconKey(label);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {ICONS[key] || ICONS.tag}
    </svg>
  );
}
