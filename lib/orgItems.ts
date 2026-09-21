// lib/orgItems.ts
//
// Création d'une fiche d'inventaire. Trois chemins y mènent — la saisie de
// l'agent, la confirmation d'un dépôt par QR code, l'import CSV — et les trois
// doivent produire exactement la même ligne : même référence, même échéance,
// même libellé public. D'où un seul endroit.

import type { SupabaseClient } from "@supabase/supabase-js";
import { retentionDeadline } from "@/lib/orgRetention";

type OrgLike = {
  id: string;
  city: string | null;
  type?: string | null;
  state_id?: string | null;
  retention_days?: number | null;
};

export const fmtRef = (n: number) => `F-${String(n).padStart(4, "0")}`;

/** Réserve n références d'un coup, de façon atomique (fonction SQL
 *  org_next_ref). Deux agents qui enregistrent à la même seconde ne peuvent
 *  plus recevoir le même numéro. */
export async function reserveRefs(sb: SupabaseClient, orgId: string, n = 1): Promise<string[]> {
  const count = Math.max(1, Math.floor(n));
  const { data, error } = await sb.rpc("org_next_ref", { p_org: orgId, p_n: count });
  if (error) throw new Error(`reference: ${error.message}`);
  const last = Number(Array.isArray(data) ? data[0] : data);
  if (!Number.isFinite(last) || last < count) throw new Error("reference: compteur illisible");
  return Array.from({ length: count }, (_, i) => fmtRef(last - count + 1 + i));
}

// Libellé public par défaut : une CATÉGORIE, jamais les premiers mots du titre.
// « Black leather wallet » donnait « Black leather » : la couleur et la matière
// sortaient sur la page publique, alors qu'elles servent à vérifier une
// réclamation.
const LABELS: [RegExp, string][] = [
  [/wallet|purse|billfold|card ?holder/i, "Wallet"],
  [/airpod|earbud|headphone|earphone/i, "Headphones"],
  [/phone|iphone|samsung|android|pixel/i, "Phone"],
  [/laptop|macbook|chromebook|notebook computer/i, "Laptop"],
  [/tablet|ipad|kindle|e-?reader/i, "Tablet"],
  [/charger|cable|adapter|power bank/i, "Charger"],
  [/usb|flash drive|hard drive/i, "USB drive"],
  [/camera|gopro/i, "Camera"],
  [/calculator/i, "Calculator"],
  [/\bkeys?\b|keychain|key ?(fob|ring|card)/i, "Keys"],
  [/backpack|rucksack/i, "Backpack"],
  [/suitcase|luggage/i, "Luggage"],
  [/\bbags?\b|handbag|tote|pouch|\bcase\b/i, "Bag"],
  [/watch/i, "Watch"],
  [/\brings?\b|bracelet|necklace|earring|jewel|pendant/i, "Jewelry"],
  [/sunglass|glasses|spectacle/i, "Glasses"],
  [/passport|licen[cs]e|student id|id card|\bid\b|document|certificate/i, "ID / document"],
  [/credit card|debit card|bank card|metrocard|transit card/i, "Card"],
  [/bottle|flask|thermos|tumbler|mug/i, "Water bottle"],
  [/umbrella/i, "Umbrella"],
  [/book|textbook|notebook|binder|folder/i, "Book / notebook"],
  [/jacket|coat|hoodie|sweater|sweatshirt|cardigan/i, "Jacket"],
  [/scarf|\bhats?\b|\bcaps?\b|beanie|glove/i, "Hat / scarf / gloves"],
  [/shoe|sneaker|boot/i, "Shoes"],
  [/shirt|pants|jeans|dress|skirt|cloth/i, "Clothing"],
  [/bike|bicycle|scooter|skateboard|helmet/i, "Bike / scooter gear"],
  [/toy|plush|teddy/i, "Toy"],
];

export function guessPublicLabel(title?: string | null): string {
  const t = String(title || "");
  for (const [re, label] of LABELS) if (re.test(t)) return label;
  return "Item";
}

export type NewItemInput = {
  title: string;
  found_at: string; // YYYY-MM-DD
  description?: string | null;
  photo_url?: string | null;
  found_location?: string | null;
  storage_location?: string | null;
  public_visible?: boolean;
  public_label?: string | null;
  intake_id?: string | null;
};

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max) || null;

export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
}

/** Ligne found_items prête à insérer. La référence est fournie par l'appelant
 *  (reserveRefs), parce qu'un import en réserve des centaines d'un coup. */
export function buildItemRow(org: OrgLike, ref: string, input: NewItemInput) {
  const title = String(input.title || "").trim().slice(0, 120);
  return {
    org_id: org.id,
    org_ref: ref,
    title,
    description: clean(input.description, 2000),
    image_url: clean(input.photo_url, 600),
    date: input.found_at,
    city: org.city,
    dropoff_location: clean(input.found_location, 200),
    storage_location: clean(input.storage_location, 120),
    status: "stored",
    // Politique de l'établissement si elle est réglée, loi de l'État pour la
    // police et les mairies, 30 jours provisoires sinon.
    legal_deadline: retentionDeadline(org, input.found_at),
    // Visibilité publique : libellé générique uniquement (jamais la description)
    public_visible: input.public_visible !== false,
    public_label: clean(input.public_label, 60) || guessPublicLabel(title),
    intake_id: input.intake_id || null,
    // Colonnes héritées des dépôts publics (analyse d'image) : NOT NULL en base
    labels: [] as string[],
    logos: [] as string[],
    objects: [] as string[],
    ocr_text: "",
  };
}
