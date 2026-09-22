"use client";
// Inventaire : stats, filtres, objets, statuts. Écran commun aux deux portails.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { setActiveOrgId } from "@/components/OrgSwitcher";
import PortalNav from "@/components/portal/PortalNav";
import RetentionSetting from "@/components/portal/RetentionSetting";
import OrgProfile from "@/components/portal/OrgProfile";
import { DISPOSITIONS, LEAVING_STATUSES, type Disposition } from "@/lib/orgDisposition";
import { usePortal, portalFetch } from "@/lib/portal";
import { scopeOfType, portalBase, publicPath } from "@/lib/orgScope";
import { deadlineTracking } from "@/lib/orgRetention";

type Intake = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  found_location: string | null;
  found_at: string;
  photo_url: string | null;
  finder_name: string | null;
  finder_email: string | null;
  /** desk = sera remis à l'accueil ; finder = gardé par la personne qui l'a trouvé. */
  held_by?: string | null;
  public_visible?: boolean;
  public_label?: string | null;
  created_at: string;
};

/** Déclaration de perte adressée directement à l'établissement (page publique). */
type LostReport = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  lost_location: string | null;
  lost_at: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

/** Dépôt annoncé « je le dépose à l'accueil » et encore attendu (moins de 48 h). */
const stillExpected = (i: Intake) =>
  i.held_by !== "finder" && Date.now() - new Date(i.created_at).getTime() < 48 * 3600_000;

// Au-delà, le navigateur peine — surtout sur un téléphone. Le reste s'affiche
// à la demande ; la recherche, elle, porte toujours sur tout l'inventaire.
const PAGE_SIZE = 120;

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

export default function PortalDashboard() {
  const router = useRouter();
  const { scope, base, words } = usePortal();
  const [org, setOrg] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [cross, setCross] = useState(0);
  const [pending, setPending] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>("stored");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [exporting, setExporting] = useState(false);
  // Dépôts par QR code : décrits par la personne qui a trouvé l'objet, en
  // attente que l'accueil confirme l'avoir en main.
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [shelf, setShelf] = useState<Record<string, string>>({});
  const [intakeBusy, setIntakeBusy] = useState("");
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  // Fiche ouverte : le journal de l'objet, dont les réclamations reçues.
  const [detail, setDetail] = useState<
    { item: Item; events: { id: number; type: string; note: string | null; actor_email: string | null; created_at: string }[] | null } | null
  >(null);
  // Sortie d'un objet : on ne l'enregistre pas sans savoir OÙ il est parti.
  // C'est cette ligne qu'on relira à quelqu'un qui se manifeste des mois après.
  const [leaving, setLeaving] = useState<
    { id: string; status: string; disposition: Disposition; to: string; busy?: boolean } | null
  >(null);

  const api = useCallback(
    (url: string, init?: RequestInit) => portalFetch(scope, url, init),
    [scope]
  );

  const load = useCallback(async () => {
    try {
      const me = await api("/api/org/me");
      if (me.status === 401) { router.push(`${base}/login`); return; }
      const mj = await me.json();

      // Aucune organisation DANS CE PORTAIL. Si le compte en gère dans
      // l'autre, on l'y envoie plutôt que de lui proposer d'en créer une
      // deuxième : c'est presque toujours qu'il s'est trompé d'adresse.
      if (!mj.org) {
        const all = Array.isArray(mj.allOrgs) ? mj.allOrgs : [];
        const elsewhere = all.filter((o: any) => scopeOfType(o.type) !== scope);
        router.push(
          elsewhere.length
            ? `${portalBase(scopeOfType(elsewhere[0].type))}/dashboard`
            : `${base}/onboarding`
        );
        return;
      }

      setOrg(mj.org);
      setRole(String(mj.role || ""));
      setOrgs(Array.isArray(mj.orgs) ? mj.orgs : []);
      const all = Array.isArray(mj.allOrgs) ? mj.allOrgs : [];
      setCross(all.filter((o: any) => scopeOfType(o.type) !== scope).length);

      const r = await api("/api/org/items");
      const j = await r.json();
      setItems(Array.isArray(j.items) ? j.items : []);
      setLoading(false); // ⚠️ uniquement quand on a une org : sinon on reste
      // en "Loading…" pendant la redirection (org.name planterait le rendu)

      // Le compteur de la file d'attente, en arrière-plan : son absence ne
      // doit pas retarder l'affichage de l'inventaire.
      api("/api/org/matches?status=new")
        .then((res) => res.json())
        .then((mj2) => setPending(Array.isArray(mj2.matches) ? mj2.matches.length : 0))
        .catch(() => {});
      api("/api/org/intakes")
        .then((res) => res.json())
        .then((ij) => setIntakes(Array.isArray(ij.intakes) ? ij.intakes : []))
        .catch(() => {});
      api("/api/org/lost-reports")
        .then((res) => res.json())
        .then((lj) => setLostReports(Array.isArray(lj.reports) ? lj.reports : []))
        .catch(() => {});
    } catch {
      router.push(`${base}/login`);
    }
  }, [api, base, router, scope]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string, extra?: Record<string, any>) => {
    const r = await api(`/api/org/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...(extra || {}) }),
    });
    if (r.ok) setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    else alert("Update failed");
    return r.ok;
  };

  // Un objet qui sort du bureau ouvre la fiche de sortie ; un retour en stock
  // s'enregistre directement.
  const onStatusPicked = (id: string, status: string) => {
    if (!LEAVING_STATUSES.has(status)) return void setStatus(id, status);
    setLeaving({
      id,
      status,
      disposition: status === "returned" ? "returned_owner" : "transferred_police",
      to: "",
    });
  };

  const toggleItemVisibility = async (id: string, next: boolean) => {
    const r = await api(`/api/org/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ public_visible: next }),
    });
    if (r.ok) setItems((prev) => prev.map((it) => (it.id === id ? { ...it, public_visible: next } : it)));
    else alert("Update failed");
  };

  const togglePublicListing = async () => {
    const next = !org.public_listing;
    const r = await api("/api/org/settings", {
      method: "PATCH",
      body: JSON.stringify({ public_listing: next }),
    });
    if (r.ok) setOrg((o: any) => ({ ...o, public_listing: next }));
    else alert("Update failed");
  };

  const toggleDeadlines = async () => {
    const next = !deadlineTracking(org);
    const r = await api("/api/org/settings", {
      method: "PATCH",
      body: JSON.stringify({ deadline_tracking: next }),
    });
    if (r.ok) {
      setOrg((o: any) => ({ ...o, deadline_tracking: next }));
      if (!next && filter === "overdue") setFilter("stored");
    } else alert("Update failed");
  };

  const toggleAutoMatch = async () => {
    const next = org.auto_match === false;
    const r = await api("/api/org/settings", { method: "PATCH", body: JSON.stringify({ auto_match: next }) });
    if (r.ok) setOrg((o: any) => ({ ...o, auto_match: next }));
    else alert("Update failed");
  };

  const toggleFinderHeld = async () => {
    const next = org.finder_held_enabled === false;
    const r = await api("/api/org/settings", {
      method: "PATCH",
      body: JSON.stringify({ finder_held_enabled: next }),
    });
    if (r.ok) setOrg((o: any) => ({ ...o, finder_held_enabled: next }));
    else alert("Update failed");
  };

  // Signalement gardé par son trouveur : l'afficher ou non sur la page publique.
  const publishReport = async (it: Intake, next: boolean) => {
    const r = await api(`/api/org/intakes/${encodeURIComponent(it.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ action: next ? "publish" : "unpublish" }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) { alert(j?.error || "Update failed"); return; }
    setIntakes((prev) => prev.map((x) => (x.id === it.id ? { ...x, public_visible: next, public_label: j?.public_label || x.public_label } : x)));
  };

  const openDetail = async (item: Item) => {
    setDetail({ item, events: null });
    try {
      const r = await api(`/api/org/items/${encodeURIComponent(item.id)}`);
      const j = await r.json();
      setDetail((d) => (d && d.item.id === item.id ? { item, events: Array.isArray(j.events) ? j.events : [] } : d));
    } catch {
      setDetail((d) => (d && d.item.id === item.id ? { item, events: [] } : d));
    }
  };

  const closeLostReport = async (r: LostReport) => {
    if (!confirm(`Close the report ${r.code} (${r.title})? Use this once the owner has the item back, or when the report is no longer relevant. It stops being compared with your inventory.`)) return;
    const res = await api("/api/org/lost-reports", { method: "PATCH", body: JSON.stringify({ id: r.id, action: "close" }) });
    if (res.ok) setLostReports((prev) => prev.filter((x) => x.id !== r.id));
    else alert("Update failed");
  };

  const resolveIntake = async (it: Intake, action: "confirm" | "reject") => {
    const kept = !stillExpected(it);
    if (action === "reject" && !confirm(
      kept
        ? `Remove the report "${it.title}"? Use this once the owner has the item back, or when the report is no longer valid. The finder's contact and photo are deleted.`
        : `Delete the drop-off ${it.code} (${it.title})? Use this when the item was never handed in.`
    )) return;
    setIntakeBusy(it.id);
    try {
      const r = await api(`/api/org/intakes/${encodeURIComponent(it.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ action, storage_location: shelf[it.id] || "" }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok && r.status !== 409) { alert(j?.error || "Update failed"); return; }
      setIntakes((prev) => prev.filter((x) => x.id !== it.id));
      if (action === "confirm") {
        const ri = await api("/api/org/items");
        const ji = await ri.json();
        setItems(Array.isArray(ji.items) ? ji.items : []);
      }
    } finally {
      setIntakeBusy("");
    }
  };

  // Le téléchargement passe par fetch : la route exige le jeton de session,
  // qu'un simple lien <a href> n'enverrait pas.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const status = ["stored", "claim_pending", "returned", "disposed"].includes(filter) ? `?status=${filter}` : "";
      const r = await api(`/api/org/items/export${status}`);
      if (!r.ok) throw new Error();
      const name = (r.headers.get("content-disposition") || "").match(/filename="([^"]+)"/)?.[1] || "lost-and-found.csv";
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const stats = useMemo(() => {
    const stored = items.filter((i) => i.status === "stored" || i.status === "claim_pending");
    return {
      stored: items.filter((i) => i.status === "stored").length,
      claims: items.filter((i) => i.status === "claim_pending").length,
      overdue: stored.filter((i) => { const d = daysLeft(i.legal_deadline); return d !== null && d <= 0; }).length,
      returned: items.filter((i) => i.status === "returned").length,
    };
  }, [items]);

  // Deux natures de dépôts par QR code : ceux qui attendent à l'accueil, et
  // ceux que leur trouveur a gardés (l'établissement ne stocke rien, il sait
  // seulement qui a l'objet).
  // Un dépôt annoncé « je le dépose à l'accueil » reste deux jours dans le
  // bandeau du haut, là où l'agent l'attend. Passé ce délai, la personne n'est
  // pas venue : l'objet est de fait chez elle, et la fiche rejoint les objets
  // gardés par leur trouveur — sans encombrer le haut du tableau de bord.
  const deskIntakes = useMemo(() => intakes.filter(stillExpected), [intakes]);
  const finderReports = useMemo(() => intakes.filter((i) => !stillExpected(i)), [intakes]);
  // Hors du filtre dédié, ils ne remontent que si la recherche les trouve.
  const shownReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter !== "finder" && !q) return [];
    if (!q) return finderReports;
    return finderReports.filter((i) =>
      `${i.code} ${i.title} ${i.description || ""} ${i.found_location || ""} ${i.finder_name || ""} ${i.finder_email || ""}`.toLowerCase().includes(q)
    );
  }, [finderReports, filter, query]);

  // Déclarations de perte reçues : même règle, filtre dédié ou recherche.
  const shownLostReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter !== "reports" && !q) return [];
    if (!q) return lostReports;
    return lostReports.filter((r) =>
      `${r.code} ${r.title} ${r.description || ""} ${r.lost_location || ""} ${r.name} ${r.email}`.toLowerCase().includes(q)
    );
  }, [lostReports, filter, query]);

  const visible = useMemo(() => {
    if (filter === "finder" || filter === "reports") return [];
    let arr =
      filter === "all" ? items
      : filter === "overdue"
        ? items.filter((i) => {
            if (i.status !== "stored" && i.status !== "claim_pending") return false;
            const d = daysLeft(i.legal_deadline);
            return d !== null && d <= 0;
          })
        : items.filter((i) => i.status === filter);
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter((i) => `${i.org_ref} ${i.title} ${i.description} ${i.storage_location}`.toLowerCase().includes(q));
    return arr;
  }, [items, filter, query]);

  // Un changement de filtre ou de recherche repart du début de la liste.
  useEffect(() => { setShown(PAGE_SIZE); }, [filter, query]);
  // Le dernier signalement vient d'être retiré : le filtre n'a plus lieu d'être.
  useEffect(() => {
    if (filter === "finder" && !loading && finderReports.length === 0) setFilter("stored");
    if (filter === "reports" && !loading && lostReports.length === 0) setFilter("stored");
  }, [filter, loading, finderReports.length, lostReports.length]);

  if (loading || !org) return <div className="p-10 text-gray-500">Loading…</div>;

  const isAdmin = role === "admin";
  const tracking = deadlineTracking(org);
  const pill = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium ${on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-gray-300 bg-gray-50 text-gray-500"}`;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <PortalNav
        current="inventory"
        pending={pending}
        orgs={orgs}
        activeId={String(org?.id || "")}
        crossPortal={cross}
        onChangeOrg={(id) => { setActiveOrgId(scope, id); setLoading(true); load(); }}
      />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="flex items-center gap-1.5 text-2xl font-bold text-gray-900">
              <span className="truncate">{org.name}</span>
              <OrgProfile
                        org={org}
                        canEdit={isAdmin}
                        onSave={async (patch) => {
                          const r = await api("/api/org/settings", { method: "PATCH", body: JSON.stringify(patch) });
                          const j = await r.json().catch(() => null);
                          if (!r.ok) throw new Error(j?.error || `Error ${r.status}`);
                          setOrg((o: any) => ({ ...o, ...patch, public_email: patch.public_email || null }));
                        }}
                      />
            </h1>
            <p className="text-sm text-gray-500">
              {org.verified ? (
                <a href={publicPath(org)} target="_blank" rel="noopener" className="underline hover:text-emerald-700">
                  reportlost.org{publicPath(org)} ↗
                </a>
              ) : (
                <>reportlost.org{publicPath(org)} · live once your account is approved</>
              )}
            </p>
          </div>
          {org.verified && (
            <a href={publicPath(org)} target="_blank" rel="noopener"
              title={org.public_listing ? "What students see: your listed items, the claim and report forms" : "Your list is off: students see only the lost item report form"}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              View public page ↗
            </a>
          )}
          <Link href={`${base}/items/new`}
            className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2.5 font-semibold text-white shadow">
            + Log a found item
          </Link>
          {/* Tout ce qui ne sert pas dix fois par jour est rangé ici. */}
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
              Tools ▾
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg">
              <a href={`/api/org/poster?slug=${org.slug}`} target="_blank" rel="noopener"
                title="One PDF: a full-page poster, a half-page poster and four cards to cut out. Each carries both QR codes, lost and found"
                className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50">
                QR posters and cards (PDF)
              </a>
              <a href={`/api/org/poster?slug=${org.slug}&paper=a4`} target="_blank" rel="noopener"
                className="block px-4 py-2 text-[12.5px] text-gray-400 hover:bg-gray-50">
                Same, A4 paper
              </a>
              <button type="button" onClick={exportCsv} disabled={exporting}
                className="block w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                {exporting ? "Preparing the file…" : !STATUS_LABEL[filter] ? "Export all items (CSV)" : `Export “${STATUS_LABEL[filter]}” (CSV)`}
              </button>
              {isAdmin && (
                <Link href={`${base}/import`} className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50">
                  Import items from another system
                </Link>
              )}
              <button type="button"
                className="block w-full border-t border-gray-100 px-4 py-2.5 text-left text-gray-500 hover:bg-gray-50"
                onClick={async () => { await supabaseBrowser.auth.signOut(); router.push(`${base}/login`); }}>
                Sign out
              </button>
            </div>
          </details>
        </div>

        {/* Réglages de l'établissement : deux interrupteurs, rien de plus. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={togglePublicListing} disabled={!isAdmin}
            title="When off, your public page and all items are hidden from visitors"
            className={pill(!!org.public_listing)}>
            {org.public_listing ? "Public page: on" : "Public page: off"}
          </button>
          <button type="button" onClick={toggleDeadlines} disabled={!isAdmin} aria-pressed={tracking}
            title="When on, each item in storage shows whether its holding period is over"
            className={pill(tracking)}>
            {tracking ? "Holding deadlines: on" : "Holding deadlines: off"}
          </button>
          <button type="button" onClick={toggleFinderHeld} disabled={!isAdmin} aria-pressed={org.finder_held_enabled !== false}
            title="When on, a person who found an item can keep it and leave an email instead of bringing it to the desk"
            className={pill(org.finder_held_enabled !== false)}>
            {org.finder_held_enabled !== false ? "Items kept by finders: accepted" : "Items kept by finders: refused"}
          </button>
          <button type="button" onClick={toggleAutoMatch} disabled={!isAdmin} aria-pressed={org.auto_match !== false}
            title="When on, each lost item report is compared with your inventory and possible matches wait in To review. When off, nothing is suggested"
            className={pill(org.auto_match !== false)}>
            {org.auto_match !== false ? "Automatic matching: on" : "Automatic matching: off"}
          </button>
        </div>

        {tracking && (
          <RetentionSetting
            org={org}
            canEdit={isAdmin}
            onSave={async (days) => {
              const r = await api("/api/org/settings", {
                method: "PATCH",
                body: JSON.stringify({ retention_days: days }),
              });
              const j = await r.json().catch(() => null);
              if (!r.ok) throw new Error(j?.error || `Error ${r.status}`);
              setOrg((o: any) => ({ ...o, retention_days: days }));
              // Les dates limites ont changé côté serveur : on relit l'inventaire
              // plutôt que d'afficher des compteurs périmés.
              const ri = await api("/api/org/items");
              const ji = await ri.json();
              setItems(Array.isArray(ji.items) ? ji.items : []);
              return Number(j?.recomputed || 0);
            }}
          />
        )}

        {!org.verified && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your account is pending review by our team. You can already log items; your public page will
            go live once approved (usually within 24 hours).
          </div>
        )}

        {/* Dépôts par QR code : n'apparaît que s'il y en a. */}
        {deskIntakes.length > 0 && (
          <section className="mt-5 rounded-2xl border border-blue-200 bg-white">
            <div className="flex flex-wrap items-baseline gap-x-2 border-b border-blue-100 px-4 py-3">
              <h2 className="text-[15px] font-bold text-gray-900">Handed in via QR code</h2>
              <span className="text-[13px] text-gray-500">
                {deskIntakes.length} to confirm · the finder shows you a code, you confirm once the item is in your hands
              </span>
            </div>
            {deskIntakes.map((it) => (
              <div key={it.id} className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.photo_url || catImage(it.title)} alt="" width={56} height={56} className="h-14 w-14 flex-none rounded-lg object-cover" />
                <span className="flex-none rounded-lg bg-blue-50 px-2.5 py-1.5 font-mono text-[17px] font-bold tracking-wider text-blue-900">{it.code}</span>
                <div className="min-w-0 flex-1 basis-40">
                  <div className="truncate text-[14.5px] font-semibold text-gray-900" title={it.description || ""}>{it.title}</div>
                  <div className="truncate text-[12.5px] text-gray-500">
                    found {it.found_at}{it.found_location ? ` · ${it.found_location}` : ""}
                    {it.finder_name || it.finder_email ? ` · by ${[it.finder_name, it.finder_email].filter(Boolean).join(", ")}` : ""}
                  </div>
                </div>
                <input
                  value={shelf[it.id] || ""}
                  onChange={(e) => setShelf((m) => ({ ...m, [it.id]: e.target.value }))}
                  placeholder="Storage location"
                  aria-label={`Storage location for drop-off ${it.code}`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] sm:w-40"
                />
                <button type="button" disabled={intakeBusy === it.id} onClick={() => resolveIntake(it, "confirm")}
                  className="rounded-lg bg-[#16a34a] px-3.5 py-2 text-[13.5px] font-bold text-white disabled:opacity-60">
                  {intakeBusy === it.id ? "…" : "Confirm receipt"}
                </button>
                <button type="button" disabled={intakeBusy === it.id} onClick={() => resolveIntake(it, "reject")}
                  className="text-[13px] text-gray-400 underline hover:text-red-600">
                  Never received
                </button>
              </div>
            ))}
          </section>
        )}

        <div className={`mt-5 grid grid-cols-2 gap-3 ${tracking ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3"><div className="text-2xl font-semibold">{stats.stored}</div><div className="text-xs text-gray-500">Items in storage</div></div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3"><div className="text-2xl font-semibold text-blue-700">{stats.claims}</div><div className="text-xs text-gray-500">Claims pending</div></div>
          {tracking && (
            <button type="button" onClick={() => setFilter("overdue")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-amber-300">
              <div className={`text-2xl font-semibold ${stats.overdue ? "text-amber-600" : "text-gray-900"}`}>{stats.overdue}</div>
              <div className="text-xs text-gray-500">Holding period over</div>
            </button>
          )}
          <div className={`rounded-xl border border-gray-200 bg-white px-4 py-3 ${tracking ? "" : "col-span-2 md:col-span-1"}`}><div className="text-2xl font-semibold text-emerald-700">{stats.returned}</div><div className="text-xs text-gray-500">Returned</div></div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {[
            ["stored", "In storage"], ["claim_pending", "Claims"],
            ...(tracking ? [["overdue", "Holding period over"]] : []),
            ["returned", "Returned"], ["disposed", "Disposed"], ["all", "All"],
            // Absent tant qu'il n'y en a aucun : rien à montrer, rien à encombrer.
            ...(finderReports.length ? [["finder", `Kept by finder · ${finderReports.length}`]] : []),
            ...(lostReports.length ? [["reports", `Lost reports · ${lostReports.length}`]] : []),
          ].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 text-xs border ${filter === v ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
              {l}
            </button>
          ))}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, title, shelf…"
            className="ml-auto w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <div className="mt-3">
          {shownReports.length > 0 && (
            <section className="mb-4 overflow-hidden rounded-2xl border border-violet-200 bg-white">
              <div className="border-b border-violet-100 bg-violet-50/60 px-4 py-2.5 text-[13.5px] text-violet-900">
                <b>Not at your desk.</b> Each of these items is still with the person who found it. Check a
                claimant&apos;s description against the report, then put them in touch.
              </div>
              {shownReports.map((it) => (
                <div key={it.id} className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.photo_url || catImage(it.title)} alt="" width={56} height={56} className="h-14 w-14 flex-none rounded-lg object-cover" />
                  <span className="flex-none rounded-lg bg-violet-50 px-2 py-1 font-mono text-[14px] font-bold tracking-wider text-violet-900" title="Reference given to the finder">{it.code}</span>
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="truncate text-[14.5px] font-semibold text-gray-900" title={it.description || ""}>{it.title}</div>
                    <div className="truncate text-[12.5px] text-gray-500">
                      found {it.found_at}{it.found_location ? ` · ${it.found_location}` : ""}
                      {it.description ? ` · ${it.description}` : ""}
                    </div>
                    <div className="truncate text-[12.5px] text-gray-700">
                      {it.held_by === "finder" ? "Kept by" : "Planned to hand it in, still with"} {it.finder_name || "the finder"} ·{" "}
                      <a href={`mailto:${it.finder_email}`} className="underline">{it.finder_email}</a>
                    </div>
                  </div>
                  <button type="button" onClick={() => publishReport(it, !it.public_visible)}
                    title={it.public_visible
                      ? `Listed on your public page as "${it.public_label || "Item"}", without the finder's contact. Click to hide`
                      : "Not on your public page. Click to list it (generic category, date and place only)"}
                    className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] ${it.public_visible ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-gray-300 bg-gray-50 text-gray-500"}`}>
                    {it.public_visible ? "Public: on" : "Public: off"}
                  </button>
                  <input
                    value={shelf[it.id] || ""}
                    onChange={(e) => setShelf((m) => ({ ...m, [it.id]: e.target.value }))}
                    placeholder="Storage location"
                    aria-label={`Storage location for ${it.title}`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13.5px] sm:w-36"
                  />
                  <button type="button" disabled={intakeBusy === it.id} onClick={() => resolveIntake(it, "confirm")}
                    title="The finder brought the item in after all: it enters your inventory"
                    className="rounded-lg border border-[#16a34a] bg-white px-3 py-2 text-[13px] font-bold text-[#15803d] disabled:opacity-60">
                    {intakeBusy === it.id ? "…" : "Now at the desk"}
                  </button>
                  <button type="button" disabled={intakeBusy === it.id} onClick={() => resolveIntake(it, "reject")}
                    className="text-[13px] text-gray-400 underline hover:text-red-600">
                    Remove
                  </button>
                </div>
              ))}
            </section>
          )}
          {shownLostReports.length > 0 && (
            <section className="mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-white">
              <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-2.5 text-[13.5px] text-amber-900">
                <b>Reported lost to your office.</b> Filed from your public page. Each report is compared with
                your inventory, now and every time an item is logged: matches appear in To review.
              </div>
              {shownLostReports.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
                  <span className="flex-none rounded-lg bg-amber-50 px-2 py-1 font-mono text-[13.5px] font-bold text-amber-900">{r.code}</span>
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="truncate text-[14.5px] font-semibold text-gray-900">{r.title}</div>
                    <div className="text-[12.5px] leading-snug text-gray-500">
                      lost {r.lost_at}{r.lost_location ? ` · ${r.lost_location}` : ""}
                      {r.description ? ` · ${r.description}` : ""}
                    </div>
                    <div className="truncate text-[12.5px] text-gray-700">
                      {r.name} · <a href={`mailto:${r.email}`} className="underline">{r.email}</a>{r.phone ? ` · ${r.phone}` : ""}
                    </div>
                  </div>
                  <button type="button" onClick={() => closeLostReport(r)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
                    Close report
                  </button>
                </div>
              ))}
            </section>
          )}
          {filter === "reports" && shownLostReports.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-500">No report matches.</div>
          )}
          {filter === "finder" && shownReports.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-500">No report matches.</div>
          )}
          {filter !== "finder" && filter !== "reports" && visible.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-500">
              {items.length === 0 ? "No items logged yet." : "No items in this view."}
            </div>
          )}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.slice(0, shown).map((it) => {
              const d = daysLeft(it.legal_deadline);
              return (
                <div key={it.id} className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                {leaving?.id === it.id && (
                  // ⚠️ bg-white/98 n'existe pas dans Tailwind (l'échelle s'arrête à 95) :
                  // la classe était ignorée et le panneau s'affichait SANS fond,
                  // par-dessus la carte. Fond plein.
                  <div className="absolute inset-0 z-10 flex flex-col gap-2 overflow-auto rounded-xl bg-white p-3">
                    <div className="text-[12.5px] font-bold text-gray-900">Where did it go?</div>
                    <select
                      value={leaving.disposition}
                      onChange={(e) =>
                        setLeaving((l) => (l ? { ...l, disposition: e.target.value as Disposition } : l))
                      }
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-[12px]"
                    >
                      {DISPOSITIONS.map((d) => (
                        <option key={d.v} value={d.v}>{d.label}</option>
                      ))}
                    </select>
                    <input
                      autoFocus
                      value={leaving.to}
                      onChange={(e) => setLeaving((l) => (l ? { ...l, to: e.target.value } : l))}
                      placeholder={DISPOSITIONS.find((d) => d.v === leaving.disposition)?.hint || ""}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-[12px]"
                    />
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        type="button"
                        disabled={leaving.busy}
                        onClick={async () => {
                          setLeaving((l) => (l ? { ...l, busy: true } : l));
                          const ok = await setStatus(it.id, leaving.status, {
                            disposition: leaving.disposition,
                            disposed_to: leaving.to.trim(),
                          });
                          if (ok) setLeaving(null);
                          else setLeaving((l) => (l ? { ...l, busy: false } : l));
                        }}
                        className="rounded-lg bg-[#16a34a] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
                      >
                        {leaving.busy ? "…" : "Record"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeaving(null)}
                        className="text-[12px] text-gray-500 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                  <div className="relative h-24 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image_url || catImage(it.title)} alt="" className="h-full w-full object-cover" />
                    <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[it.status || "stored"]}`}>
                      {STATUS_LABEL[it.status || "stored"]}
                    </span>
                    {/* Échéance : uniquement si l'établissement a activé le suivi.
                        Dépassée en ambre, sinon un simple décompte gris. */}
                    {tracking && d !== null && (it.status === "stored" || it.status === "claim_pending") && (
                      <span
                        title={`Holding period ends ${it.legal_deadline}`}
                        className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${d <= 0 ? "bg-amber-100 text-amber-900" : "bg-white/90 text-gray-600"}`}>
                        {d <= 0 ? "Hold over" : `${d}d left`}
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
                  {it.status === "claim_pending" ? (
                    <button type="button" onClick={() => openDetail(it)}
                      className="mx-2.5 mt-2 rounded-lg bg-blue-600 px-2 py-1.5 text-[12px] font-bold text-white hover:bg-blue-700">
                      See the claims
                    </button>
                  ) : (
                    <button type="button" onClick={() => openDetail(it)}
                      className="mx-2.5 mt-1 self-start text-[11px] text-gray-400 underline hover:text-gray-700">
                      History
                    </button>
                  )}
                  <div className="mt-auto flex items-center gap-1.5 px-2.5 py-2">
                    <select
                      value={it.status || "stored"}
                      onChange={(e) => onStatusPicked(it.id, e.target.value)}
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
          {detail && (
            <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
              onClick={() => setDetail(null)}>
              <div role="dialog" aria-modal="true" aria-label={`History of ${detail.item.org_ref || "item"}`}
                className="max-h-[88vh] w-full max-w-xl overflow-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detail.item.image_url || catImage(detail.item.title)} alt="" width={72} height={72}
                    className="h-[72px] w-[72px] flex-none rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-gray-500">{detail.item.org_ref}</div>
                    <div className="text-[17px] font-bold leading-snug text-gray-900">{detail.item.title}</div>
                    {detail.item.description && (
                      <p className="mt-1 text-[13.5px] leading-relaxed text-gray-600">{detail.item.description}</p>
                    )}
                    <div className="mt-1 text-[12.5px] text-gray-500">
                      found {detail.item.date}{detail.item.dropoff_location ? ` · ${detail.item.dropoff_location}` : ""}
                      {detail.item.storage_location ? ` · stored: ${detail.item.storage_location}` : ""}
                    </div>
                  </div>
                  <button type="button" onClick={() => setDetail(null)} aria-label="Close"
                    className="flex-none rounded-lg px-2 py-1 text-[20px] leading-none text-gray-400 hover:text-gray-700">×</button>
                </div>

                {detail.item.status === "claim_pending" && (
                  <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13.5px] leading-relaxed text-blue-900">
                    Compare each claimant&apos;s description with your own notes and photo above. Write to them to
                    ask for one more detail if needed. The item stays on your public list while you review, so
                    several people may claim it: only one description will fit.
                  </p>
                )}

                <div className="mt-4 space-y-2.5">
                  {detail.events === null && <p className="text-sm text-gray-500">Loading…</p>}
                  {detail.events?.length === 0 && <p className="text-sm text-gray-500">No history recorded for this item.</p>}
                  {detail.events?.map((ev) => {
                    const claim = ev.type === "claim_received";
                    return (
                      <div key={ev.id} className={`rounded-xl border px-4 py-3 ${claim ? "border-blue-200 bg-white" : "border-gray-200 bg-[#f7f8fa]"}`}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className={`text-[13px] font-bold ${claim ? "text-blue-800" : "text-gray-700"}`}>
                            {claim ? "Claim received" : ev.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[12px] text-gray-400">
                            {new Date(ev.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        {ev.note && <p className="mt-1 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-gray-700">{ev.note}</p>}
                        {claim && ev.actor_email && (
                          <a
                            href={`mailto:${ev.actor_email}?subject=${encodeURIComponent(`Your claim at ${org.name} (${detail.item.org_ref || ""})`)}`}
                            className="mt-2 inline-block rounded-lg border border-blue-300 px-3 py-1.5 text-[13px] font-semibold text-blue-800 hover:bg-blue-50">
                            Write to {ev.actor_email}
                          </a>
                        )}
                        {!claim && ev.actor_email && <p className="mt-0.5 text-[12px] text-gray-400">by {ev.actor_email}</p>}
                      </div>
                    );
                  })}
                </div>

                {detail.item.status === "claim_pending" && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button"
                      onClick={() => { const it = detail.item; setDetail(null); onStatusPicked(it.id, "returned"); }}
                      className="rounded-xl bg-[#16a34a] px-4 py-2.5 text-[14px] font-bold text-white">
                      It is theirs: record the return
                    </button>
                    <button type="button"
                      onClick={async () => { const it = detail.item; if (await setStatus(it.id, "stored", { note: "No claim accepted, item back to In storage" })) setDetail(null); }}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50">
                      No valid claim: back to In storage
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {visible.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)}
              className="mx-auto mt-4 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Show {Math.min(PAGE_SIZE, visible.length - shown)} more · {visible.length - shown} not shown
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
