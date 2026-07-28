"use client";
// Tableau de bord établissement : stats, filtres, inventaire, statuts.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Item = {
  id: string;
  org_ref: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  date: string | null;
  dropoff_location: string | null;
  storage_location: string | null;
  status: string | null;
  legal_deadline: string | null;
  created_at: string;
  public_visible?: boolean;
  public_label?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  stored: "In storage",
  claim_pending: "Claim pending",
  returned: "Returned",
  disposed: "Disposed",
};
const STATUS_STYLE: Record<string, string> = {
  stored: "bg-emerald-50 text-emerald-800",
  claim_pending: "bg-blue-50 text-blue-800",
  returned: "bg-gray-100 text-gray-600",
  disposed: "bg-gray-100 text-gray-500",
};

function daysLeft(deadline?: string | null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

// Image de catégorie du site (fallback quand pas de photo), déduite du titre
const CAT_IMAGES: [RegExp, string][] = [
  [/wallet|purse|billfold/i, "wallet.jpg"],
  [/phone|iphone|samsung|android/i, "phone.jpg"],
  [/key/i, "keys.jpg"],
  [/bag|backpack|luggage|suitcase/i, "bag-suitcase.jpg"],
  [/ring|bracelet|necklace|jewel|watch|earring/i, "jewelry.jpg"],
  [/laptop|macbook|computer|tablet|ipad|camera|headphone|airpod|earbud|drive|usb|charger|kindle/i, "electronic-devices.jpg"],
  [/glasses|sunglass/i, "glasses.jpg"],
  [/passport|license|document|card|id\b/i, "documents.jpg"],
  [/cat\b|dog\b|pet/i, "pets.jpg"],
  [/jacket|coat|hoodie|sweater|scarf|hat\b|cap\b|glove|shirt|shoe|cloth/i, "clothes.jpg"],
];
function catImage(title?: string | null) {
  for (const [re, img] of CAT_IMAGES) if (re.test(title || "")) return `/images/categories/${img}`;
  return "/images/categories/others.jpg";
}

export default function OrgDashboardPage() {
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>("stored");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const authFetch = async (url: string, init?: RequestInit) => {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session) throw new Error("no-session");
    return fetch(url, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    });
  };

  const load = async () => {
    try {
      const me = await authFetch("/api/org/me");
      if (me.status === 401) { router.push("/org/login"); return; }
      const mj = await me.json();
      if (!mj.org) { router.push("/org/onboarding"); return; }
      setOrg(mj.org);
      const r = await authFetch("/api/org/items");
      const j = await r.json();
      setItems(Array.isArray(j.items) ? j.items : []);
      setLoading(false); // ⚠️ uniquement quand on a une org : sinon on reste
      // en "Loading…" pendant la redirection (org.name planterait le rendu)
    } catch {
      router.push("/org/login");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const setStatus = async (id: string, status: string) => {
    const r = await authFetch(`/api/org/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (r.ok) setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    else alert("Update failed");
  };

  const toggleItemVisibility = async (id: string, next: boolean) => {
    const r = await authFetch(`/api/org/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ public_visible: next }),
    });
    if (r.ok) setItems((prev) => prev.map((it) => (it.id === id ? { ...it, public_visible: next } : it)));
    else alert("Update failed");
  };

  const togglePublicListing = async () => {
    const next = !org.public_listing;
    const r = await authFetch("/api/org/settings", {
      method: "PATCH",
      body: JSON.stringify({ public_listing: next }),
    });
    if (r.ok) setOrg((o: any) => ({ ...o, public_listing: next }));
    else alert("Update failed");
  };

  const stats = useMemo(() => {
    const stored = items.filter((i) => i.status === "stored" || i.status === "claim_pending");
    return {
      stored: items.filter((i) => i.status === "stored").length,
      claims: items.filter((i) => i.status === "claim_pending").length,
      urgent: stored.filter((i) => { const d = daysLeft(i.legal_deadline); return d !== null && d <= 7; }).length,
      returned: items.filter((i) => i.status === "returned").length,
    };
  }, [items]);

  const visible = useMemo(() => {
    let arr = filter === "all" ? items : items.filter((i) => i.status === filter);
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter((i) => `${i.org_ref} ${i.title} ${i.description} ${i.storage_location}`.toLowerCase().includes(q));
    return arr;
  }, [items, filter, query]);

  if (loading || !org) return <main className="p-10 text-gray-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{org.name}</h1>
          <p className="text-sm text-gray-500">
            {org.verified && org.public_listing ? (
              <a href={`/o/${org.slug}`} target="_blank" rel="noopener" className="underline hover:text-emerald-700">
                reportlost.org/o/{org.slug} ↗
              </a>
            ) : (
              <>reportlost.org/o/{org.slug}</>
            )}
            {org.state_id ? ` · ${org.state_id} holding rules applied` : ""}
          </p>
        </div>
        <button type="button" onClick={togglePublicListing}
          title="When off, your public page and all items are hidden from visitors"
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${org.public_listing ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-gray-300 bg-gray-50 text-gray-500"}`}>
          {org.public_listing ? "🌐 Public page: on" : "🔒 Public page: off"}
        </button>
        <a href={`/api/org/poster?slug=${org.slug}`} target="_blank" rel="noopener"
          title="Print this poster for your front desk: visitors scan the QR code to file their lost item report"
          className="rounded-lg border border-[#2ea052] bg-white px-3 py-2.5 text-sm font-medium text-[#226638] hover:bg-[#f2fbf5]">
          🖨️ QR poster
        </a>
        <Link href="/org/items/new"
          className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2.5 font-semibold text-white shadow">
          + Log a found item
        </Link>
        <button type="button" className="text-sm text-gray-500 underline"
          onClick={async () => { await supabaseBrowser.auth.signOut(); router.push("/org/login"); }}>
          Sign out
        </button>
      </div>

      {!org.verified && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your account is pending review by our team. You can already log items; your public page will
          go live once approved (usually within 24 hours).
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3"><div className="text-2xl font-semibold">{stats.stored}</div><div className="text-xs text-gray-500">Items in storage</div></div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3"><div className="text-2xl font-semibold text-blue-700">{stats.claims}</div><div className="text-xs text-gray-500">Claims pending</div></div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3"><div className="text-2xl font-semibold text-amber-600">{stats.urgent}</div><div className="text-xs text-gray-500">Deadline under 7 days</div></div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3"><div className="text-2xl font-semibold text-emerald-700">{stats.returned}</div><div className="text-xs text-gray-500">Returned</div></div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[["stored", "In storage"], ["claim_pending", "Claims"], ["returned", "Returned"], ["disposed", "Disposed"], ["all", "All"]].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setFilter(v)}
            className={`rounded-full px-3 py-1 text-xs border ${filter === v ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            {l}
          </button>
        ))}
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, title, shelf…"
          className="ml-auto w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>

      <div className="mt-3">
        {visible.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-500">
            No items here yet. Log your first found item, it takes 30 seconds.
          </div>
        )}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((it) => {
            const d = daysLeft(it.legal_deadline);
            return (
              <div key={it.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="relative h-24 bg-gray-50">
                  <img src={it.image_url || catImage(it.title)} alt="" className="h-full w-full object-cover" />
                  <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[it.status || "stored"]}`}>
                    {STATUS_LABEL[it.status || "stored"]}
                  </span>
                  {d !== null && (it.status === "stored" || it.status === "claim_pending") && d <= 7 && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      {d > 0 ? `${d}d left` : "disposal ok"}
                    </span>
                  )}
                </div>
                <div className="px-2.5 pt-2">
                  <div className="truncate text-sm font-medium text-gray-900" title={it.title || ""}>{it.title || "—"}</div>
                  <div className="truncate text-[11px] text-gray-400"
                    title={`Found ${it.date || "—"}${it.dropoff_location ? ` · ${it.dropoff_location}` : ""}${it.storage_location ? ` · 📍 ${it.storage_location}` : ""}`}>
                    {it.org_ref || ""}{it.date ? ` · ${it.date}` : ""}{it.storage_location ? ` · 📍 ${it.storage_location}` : ""}
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-1.5 px-2.5 py-2">
                  <select
                    value={it.status || "stored"}
                    onChange={(e) => setStatus(it.id, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-1.5 py-1 text-[11px]"
                    title="Change status"
                  >
                    <option value="stored">In storage</option>
                    <option value="claim_pending">Claim pending</option>
                    <option value="returned">Returned</option>
                    <option value="disposed">Disposed</option>
                  </select>
                  {(it.status === "stored" || it.status === "claim_pending") && (
                    <button type="button"
                      onClick={() => toggleItemVisibility(it.id, !(it.public_visible !== false))}
                      title={it.public_visible !== false
                        ? `Shown on your public page as "${it.public_label || it.title}" — click to hide`
                        : "Hidden from your public page — click to show"}
                      className={`rounded-lg border px-2 py-1 text-[11px] ${it.public_visible !== false ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-gray-300 bg-gray-50 text-gray-400"}`}>
                      {it.public_visible !== false ? "👁" : "🚫"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
