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

function matches(it: PublicItem, q: string) {
  const label = it.label.toLowerCase();
  const hay = `${label} ${it.place || ""} ${fmtDate(it.date)} ${it.date || ""}`.toLowerCase();
  if (hay.includes(q)) return true;
  const syn = SYNONYMS[label] || [];
  return syn.some((s) => s.includes(q) || q.includes(s));
}

export default function OrgPublicItems({
  orgSlug,
  orgName,
  items,
  reports,
}: {
  orgSlug: string;
  orgName: string;
  items: PublicItem[];
  reports: PublicItem[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shownItems = useMemo(() => (q ? items.filter((i) => matches(i, q)) : items), [items, q]);
  const shownReports = useMemo(() => (q ? reports.filter((i) => matches(i, q)) : reports), [reports, q]);
  const total = items.length + reports.length;

  const row = (it: PublicItem) => (
    <div key={`${it.kind}-${it.id}`} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-gray-900">{it.label}</span>
        <span className="text-sm text-gray-500">
          found {fmtDate(it.date)}
          {it.place ? ` at ${it.place}` : ""}
        </span>
        <span className="ml-auto" />
        <OrgClaimForm orgSlug={orgSlug} itemId={it.id} label={it.label} kind={it.kind} />
      </div>
    </div>
  );

  return (
    <>
      {total > 0 && (
        <div className="mt-6">
          <label htmlFor="pub-search" className="sr-only">Search the items</label>
          <input
            id="pub-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: keys, backpack, library, September 14…"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          {q && (
            <p className="mt-1.5 text-[13px] text-gray-500">
              {shownItems.length + shownReports.length === 0
                ? "Nothing matches. Items are listed by category only, so try a broader word, or report your loss below."
                : `${shownItems.length + shownReports.length} of ${total} items`}
            </p>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center text-gray-500">
          No items listed at the moment. Check back soon, new finds are added regularly.
        </div>
      ) : (
        <div className="mt-4 space-y-2">{shownItems.map(row)}</div>
      )}

      {reports.length > 0 && (q ? shownReports.length > 0 : true) && (
        <section className="mt-8">
          <h2 className="text-[17px] font-bold text-gray-900">Not at the desk yet</h2>
          <p className="mt-1 text-sm text-gray-600">
            These items are still with the person who found them, who left a contact with the {orgName}{" "}
            office. Describe the item precisely: if your description matches, the office puts you in touch.
          </p>
          <div className="mt-3 space-y-2">{shownReports.map(row)}</div>
        </section>
      )}
    </>
  );
}
