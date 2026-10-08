"use client";
// components/OrgPublicItems.tsx — liste publique des objets d'un établissement,
// avec un champ de recherche. Le filtre se fait dans le navigateur : la page
// reste servie depuis le cache, et la recherche ne porte que sur ce qui est
// déjà public (catégorie, date, lieu). Rien de privé ne transite.
import { useMemo, useState } from "react";
import OrgClaimForm from "@/components/OrgClaimForm";

export type PublicItem = {
  id: string;
  label: string;
  date: string | null;
  place: string | null;
  /** "item" = détenu par l'établissement ; "report" = encore chez le trouveur */
  kind: "item" | "report";
};

// Un mot tapé peut viser une catégorie voisine : « earbuds » doit trouver
// « Headphones ». Liste courte, volontairement.
const SYNONYMS: Record<string, string[]> = {
  headphones: ["airpods", "earbuds", "earphones", "buds"],
  phone: ["iphone", "android", "samsung", "cell", "mobile"],
  laptop: ["macbook", "computer", "chromebook"],
  wallet: ["purse", "cardholder", "billfold"],
  keys: ["key", "keychain", "fob"],
  glasses: ["sunglasses", "spectacles"],
  "id / document": ["id", "card", "passport", "license", "student id"],
  "water bottle": ["bottle", "flask", "thermos", "hydroflask"],
  jacket: ["coat", "hoodie", "sweater", "sweatshirt"],
  "hat / scarf / gloves": ["hat", "cap", "beanie", "scarf", "gloves"],
  "book / notebook": ["book", "notebook", "textbook", "binder"],
  jewelry: ["ring", "necklace", "bracelet", "earring"],
  charger: ["cable", "adapter", "power bank"],
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function matches(it: PublicItem, q: string, showDate: boolean, showPlace: boolean) {
  const label = it.label.toLowerCase();
  const hay = `${label} ${showPlace ? it.place || "" : ""} ${showDate ? `${fmtDate(it.date)} ${it.date || ""}` : ""}`.toLowerCase();
  if (hay.includes(q)) return true;
  const syn = SYNONYMS[label] || [];
  return syn.some((s) => s.includes(q) || q.includes(s));
}

export default function OrgPublicItems({
  orgSlug,
  orgName,
  items,
  reports,
  showDate = true,
  showPlace = true,
}: {
  orgSlug: string;
  orgName: string;
  /** Réglages de l'établissement : la date et le lieu peuvent être masqués. */
  showDate?: boolean;
  showPlace?: boolean;
  items: PublicItem[];
  reports: PublicItem[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shownItems = useMemo(() => (q ? items.filter((i) => matches(i, q, showDate, showPlace)) : items), [items, q, showDate, showPlace]);
  const shownReports = useMemo(() => (q ? reports.filter((i) => matches(i, q, showDate, showPlace)) : reports), [reports, q, showDate, showPlace]);
  const total = items.length + reports.length;

  // Une ligne par objet, dans un seul bloc à filets : à pleine largeur c'est
  // plus lisible qu'une grille de cartes, et le formulaire de réclamation
  // s'ouvre dessous (w-full) sans écraser les champs.
  const row = (it: PublicItem) => (
    <div key={`${it.kind}-${it.id}`} className="border-b border-gray-100 px-4 py-3.5 last:border-b-0 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[15px] font-semibold text-gray-900">{it.label}</span>
        {(showDate || (showPlace && it.place)) && (
          <span className="text-[13.5px] text-gray-500">
            {showDate ? `found ${fmtDate(it.date)}` : "found"}
            {showPlace && it.place ? ` · ${it.place}` : ""}
          </span>
        )}
        <span className="ml-auto" />
        <OrgClaimForm orgSlug={orgSlug} itemId={it.id} label={it.label} kind={it.kind} />
      </div>
    </div>
  );

  const compte = shownItems.length + shownReports.length;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold text-gray-900">Items held at the office</h2>
            <span className="text-[13px] text-gray-500">
              {q ? `${compte} of ${total} shown` : `${items.length} listed`}
            </span>
          </div>
          {total > 0 && (
            <>
              <label htmlFor="pub-search" className="sr-only">Search the items</label>
              <input
                id="pub-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: keys, backpack, library, September 14…"
                autoComplete="off"
                className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-[15px] text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              {q && compte === 0 && (
                <p className="mt-2 text-[13px] text-gray-500">
                  Nothing matches. Items are listed by category only, so try a broader word — or report
                  your loss below.
                </p>
              )}
            </>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center text-[14.5px] text-gray-500">
            No items listed at the moment. Check back soon — new finds are added as they come in.
          </div>
        ) : (
          <div>{shownItems.map(row)}</div>
        )}
      </section>

      {reports.length > 0 && (q ? shownReports.length > 0 : true) && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-white">
          <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-4 sm:px-5">
            <h2 className="text-[17px] font-bold text-gray-900">Not at the desk yet</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-gray-600">
              These items are still with the person who found them, who left a contact with the {orgName}{" "}
              office. Describe the item precisely: if your description matches, the office puts you in touch.
            </p>
          </div>
          <div>{shownReports.map(row)}</div>
        </section>
      )}
    </>
  );
}
