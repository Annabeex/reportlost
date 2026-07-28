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
    } catch {
      router.push("/org/login");
    } finally {
      setLoading(false);
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

  if (loading) return <main className="p-10 text-gray-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{org.name}</h1>
          <p className="text-sm text-gray-500">
            reportlost.org/o/{org.slug}
            {org.state_id ? ` · ${org.state_id} holding rules applied` : ""}
          </p>
        </div>
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

      <div className="mt-3 space-y-2">
        {visible.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-500">
            No items here yet. Log your first found item, it takes 30 seconds.
          </div>
        )}
        {visible.map((it) => {
          const d = daysLeft(it.legal_deadline);
          return (
            <div key={it.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                {it.image_url ? <img src={it.image_url} alt="" className="h-10 w-10 object-cover" /> : "📦"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{it.org_ref}</span>
                  <span className="truncate font-medium text-gray-900">{it.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[it.status || "stored"]}`}>
                    {STATUS_LABEL[it.status || "stored"]}
                  </span>
                  {d !== null && (it.status === "stored" || it.status === "claim_pending") && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${d <= 7 ? "bg-amber-100 text-amber-800 font-medium" : "text-gray-400"}`}>
                      {d > 0 ? `${d} days left` : "disposal allowed"}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-gray-500">
                  Found {it.date || "—"}{it.dropoff_location ? ` · ${it.dropoff_location}` : ""}{it.storage_location ? ` · 📍 ${it.storage_location}` : ""}
                </div>
              </div>
              <select
                value={it.status || "stored"}
                onChange={(e) => setStatus(it.id, e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                title="Change status"
              >
                <option value="stored">In storage</option>
                <option value="claim_pending">Claim pending</option>
                <option value="returned">Returned</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
          );
        })}
      </div>
    </main>
  );
}
