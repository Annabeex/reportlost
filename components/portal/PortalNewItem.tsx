"use client";
// components/portal/PortalNewItem.tsx
//
// « Log a New Found Item », d'après la maquette validée : deux modes annoncés
// en haut (scan automatique / saisie manuelle), puis la photo à gauche et la
// fiche à droite. On doit comprendre l'écran sans l'avoir jamais vu.
//
// ⚠️ L'enregistrement passe par portalFetch : sans l'en-tête x-org-id, un
// compte qui gère deux structures déposait l'objet dans la mauvaise.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { setActiveOrgId } from "@/components/OrgSwitcher";
import PortalNav from "@/components/portal/PortalNav";
import { usePortal, portalFetch } from "@/lib/portal";
import { scopeOfType, portalBase } from "@/lib/orgScope";
import { orgRetention, retentionDeadline, deadlineTracking } from "@/lib/orgRetention";
import { compressImage } from "@/lib/imageCompress";

const CARD = "rounded-2xl border border-gray-200 bg-white";
const FIELD =
  "w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-4 py-3 text-[15px] text-gray-900 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100";

function fmtLong(d: string) {
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function fmtShort(d: string) {
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
function fmtBytes(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`;
}

export default function PortalNewItem() {
  const router = useRouter();
  const { scope, base } = usePortal();
  const today = new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [org, setOrg] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [cross, setCross] = useState(0);
  const [pending, setPending] = useState(0);

  const [form, setForm] = useState({
    title: "",
    description: "",
    found_at: today,
    found_location: "",
    storage_location: "",
    photo_url: "",
    public_label: "",
    public_visible: true,
  });
  // Ce que l'IA a proposé : sert uniquement à afficher « (suggested) » en face
  // du bon champ. Dès que l'agent corrige, la mention disparaît.
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});
  const [photoMeta, setPhotoMeta] = useState<{ bytes: number; at: string } | null>(null);
  const [readMs, setReadMs] = useState<number | null>(null);
  // Plafond mensuel du scan : le compteur ne s'affiche qu'après un scan, pour
  // ne pas ajouter une requête à chaque ouverture de la page.
  const [quota, setQuota] = useState<{ used: number; quota: number } | null>(null);
  const [quotaMsg, setQuotaMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const api = useCallback(
    (url: string, init?: RequestInit) => portalFetch(scope, url, init),
    [scope]
  );

  const load = useCallback(async () => {
    try {
      const me = await api("/api/org/me");
      if (me.status === 401) { router.push(`${base}/login`); return; }
      const mj = await me.json();
      if (!mj.org) {
        const all = Array.isArray(mj.allOrgs) ? mj.allOrgs : [];
        const elsewhere = all.filter((o: any) => scopeOfType(o.type) !== scope);
        router.push(
          elsewhere.length
            ? `${portalBase(scopeOfType(elsewhere[0].type))}/items/new`
            : `${base}/onboarding`
        );
        return;
      }
      setOrg(mj.org);
      setOrgs(Array.isArray(mj.orgs) ? mj.orgs : []);
      const all = Array.isArray(mj.allOrgs) ? mj.allOrgs : [];
      setCross(all.filter((o: any) => scopeOfType(o.type) !== scope).length);

      // Le compteur de la file d'attente, en arrière-plan : son absence ne
      // doit pas retarder l'affichage du formulaire.
      api("/api/org/matches?status=new")
        .then((res) => res.json())
        .then((mj2) => setPending(Array.isArray(mj2.matches) ? mj2.matches.length : 0))
        .catch(() => {});
    } catch {
      router.push(`${base}/login`);
    }
  }, [api, base, router, scope]);

  useEffect(() => { load(); }, [load]);

  // ✨ Lecture de la photo : l'IA ne remplit que les champs encore vides,
  // elle n'écrase jamais ce que l'agent a déjà tapé.
  const analyze = async (photoUrl: string) => {
    setAnalyzing(true);
    setReadMs(null);
    const started = Date.now();
    try {
      const r = await api("/api/org/analyze-item", {
        method: "POST",
        body: JSON.stringify({ image_url: photoUrl }),
      });
      const j = await r.json();
      if (r.status === 402) {
        // Plafond atteint : on bascule en saisie manuelle plutôt que de laisser
        // l'agent devant un bouton qui ne fera plus rien.
        setQuota({ used: Number(j?.used || 0), quota: Number(j?.quota || 0) });
        setQuotaMsg(String(j?.message || "Automatic scan is unavailable this month."));
        setMode("manual");
        return;
      }
      if (!r.ok) return; // silencieux : l'agent remplit à la main comme avant
      if (j?.quota) setQuota({ used: Number(j.used || 0), quota: Number(j.quota) });
      setForm((f) => {
        const next = { ...f };
        const marks: Record<string, boolean> = {};
        if (!f.title && j.title) { next.title = j.title; marks.title = true; }
        if (!f.description && j.description) { next.description = j.description; marks.description = true; }
        if (!f.public_label && j.public_label) { next.public_label = j.public_label; marks.public_label = true; }
        setSuggested((s) => ({ ...s, ...marks }));
        return next;
      });
      setReadMs(Date.now() - started);
    } catch {
      // silencieux
    } finally {
      setAnalyzing(false);
    }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;
    setUploading(true);
    setErr(null);
    try {
      // Réduite avant l'envoi : ≈ 300 Ko au lieu de plusieurs Mo. C'est ce
      // qui rend la saisie au téléphone rapide, et le stockage négligeable.
      const file = await compressImage(original);
      // Nom aléatoire : l'adresse de la photo ne doit pas se deviner.
      const ext = (file.name.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1] || "jpg").toLowerCase();
      const id = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `org_items/${id}.${ext}`;
      const { error } = await supabaseBrowser.storage.from("images").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabaseBrowser.storage.from("images").getPublicUrl(path);
      const publicUrl = data?.publicUrl || "";
      setForm((f) => ({ ...f, photo_url: publicUrl }));
      setPhotoMeta({
        bytes: file.size,
        at: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      });
      if (publicUrl && mode === "scan") analyze(publicUrl);
    } catch (e: any) {
      setErr(`Photo upload failed: ${e?.message || e}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // « Save and log another » : un carton d'objets se vide sans repasser par
  // l'inventaire. Le lieu et la date restent, ce sont souvent les mêmes.
  const againRef = useRef(false);
  const [saved, setSaved] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api("/api/org/items", { method: "POST", body: JSON.stringify(form) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      if (againRef.current) {
        againRef.current = false;
        setSaved(`${j.org_ref || "Item"} saved · ${form.title}`);
        setForm((f) => ({ ...f, title: "", description: "", photo_url: "", public_label: "" }));
        setSuggested({});
        setPhotoMeta(null);
        setReadMs(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push(`${base}/dashboard`);
    } catch (e: any) {
      if (String(e?.message) === "no-session") { router.push(`${base}/login`); return; }
      setErr(String(e?.message || e));
    } finally {
      againRef.current = false;
      setBusy(false);
    }
  };

  const set = (k: string) => (e: any) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSuggested((s) => (s[k] ? { ...s, [k]: false } : s));
  };

  const clearPhoto = () => {
    setForm((f) => ({ ...f, photo_url: "" }));
    setPhotoMeta(null);
    setReadMs(null);
  };

  if (!org) return <div className="p-10 text-gray-500">Loading…</div>;

  const retention = orgRetention(org);
  const tracking = deadlineTracking(org);
  const hold = retentionDeadline(org, form.found_at);
  const Suggest = ({ on }: { on?: boolean }) =>
    on ? <span className="font-normal text-gray-400"> (suggested)</span> : null;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <PortalNav
        current="new"
        pending={pending}
        orgs={orgs}
        activeId={String(org?.id || "")}
        crossPortal={cross}
        onChangeOrg={(id) => { setActiveOrgId(scope, id); setOrg(null); load(); }}
      />

      <form onSubmit={submit} className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Log a New Found Item</h1>

        {saved && (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14.5px] font-semibold text-emerald-900">
            {saved}
          </div>
        )}

        {/* Deux chemins, annoncés d'emblée. Une photo suffit le plus souvent ;
            la saisie manuelle reste là pour ce qui ne se photographie pas. */}
        <div className={`mt-6 grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 ${CARD}`}>
          {([
            ["scan", "Automatic scan", "◎"],
            ["manual", "Manual form", "▤"],
          ] as const).map(([v, label, icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setMode(v);
                if (v === "scan" && form.photo_url && readMs === null && !analyzing) {
                  analyze(form.photo_url);
                }
              }}
              className={`flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-[16px] font-bold transition ${
                mode === v ? "bg-[#16a34a] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span aria-hidden className="text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {quotaMsg && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
            <b>Monthly scan limit reached</b> ({quota?.used}/{quota?.quota}). {quotaMsg}
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* ── Photo ─────────────────────────────────────────────────── */}
          <section className={`${CARD} flex flex-col overflow-hidden`}>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[17px] font-bold">
                Photo
                {mode === "manual" && <span className="font-normal text-gray-400"> (optional)</span>}
              </h2>
              {analyzing ? (
                <span className="rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold tracking-wide text-green-800">
                  READING…
                </span>
              ) : readMs !== null ? (
                <span className="flex items-center gap-2.5">
                  {quota && (
                    <span className="text-[12.5px] text-gray-400">
                      {quota.used}/{quota.quota} scans this month
                    </span>
                  )}
                  <span className="rounded-full bg-green-100 px-3.5 py-1.5 text-[13px] font-bold tracking-wide text-green-800">
                    READ · {(readMs / 1000).toFixed(1)} S
                  </span>
                </span>
              ) : null}
            </div>

            <input
              ref={fileRef}
              id="org-photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={upload}
              className="hidden"
            />

            {form.photo_url ? (
              <>
                <div className="relative bg-[#eef0f3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.photo_url} alt="" className="h-[260px] w-full object-contain sm:h-[420px]" />
                  {analyzing && <div className="rl-scan-beam" />}
                </div>
                <div className="mt-auto flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold text-gray-900">
                      {photoMeta ? `Scanned at the desk, ${photoMeta.at}` : "Photo attached"}
                    </div>
                    <div className="truncate text-[13.5px] text-gray-500">
                      {photoMeta ? `${fmtBytes(photoMeta.bytes)} · ` : ""}kept with the item record
                    </div>
                  </div>
                  <div className="flex flex-none gap-2">
                    <label
                      htmlFor="org-photo"
                      className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Replace
                    </label>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="rounded-lg px-3 py-2.5 text-[14px] text-gray-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <label
                htmlFor="org-photo"
                className="m-5 mt-0 flex h-[220px] cursor-pointer sm:h-[420px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-[#f7f8fa] text-center hover:border-[#2ea052] hover:bg-[#f2fbf5]"
              >
                <span className="text-[42px]">📷</span>
                <span className="mt-3 text-[17px] font-bold text-gray-800">
                  {uploading ? "Uploading…" : "Take a photo or drop a file"}
                </span>
                <span className="mt-1.5 max-w-[320px] text-[14px] text-gray-500">
                  {mode === "scan"
                    ? "The item is read and the fields on the right fill themselves. You correct anything that is wrong."
                    : "Optional. The photo stays private, it is used to verify ownership claims."}
                </span>
              </label>
            )}
          </section>

          {/* ── Fiche ─────────────────────────────────────────────────── */}
          <section className={`${CARD} flex flex-col gap-4 p-5`}>
            <div>
              <label className="mb-1.5 block text-[15px] font-bold text-gray-900">
                Item type<Suggest on={suggested.title} />
              </label>
              <input
                required
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Backpack"
                className={FIELD}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[15px] font-bold text-gray-900">
                Detailed description<Suggest on={suggested.description} />
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                placeholder="Colour, brand, contents… keep one detail private for verification"
                className={FIELD}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[15px] font-bold text-gray-900">Found location</label>
              <input
                value={form.found_location}
                onChange={set("found_location")}
                placeholder={scope === "campus" ? "Bobst Library, 5th Floor" : "Lobby desk"}
                className={FIELD}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[15px] font-bold text-gray-900">Storage location</label>
              <input
                value={form.storage_location}
                onChange={set("storage_location")}
                placeholder="Shelf B3, locker A1…"
                className={FIELD}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <input
                type="checkbox"
                checked={form.public_visible}
                onChange={(e) => setForm((f) => ({ ...f, public_visible: e.target.checked }))}
                className="mt-0.5 h-4 w-4 flex-none accent-emerald-600"
              />
              <span className="text-[14px]">
                <span className="font-bold">List on our public page</span>
                <span className="block text-[13px] leading-relaxed text-gray-600">
                  Only a generic label, the date and the drop-off location are shown. Details and photo
                  stay private, they are used to verify ownership claims.
                </span>
              </span>
            </label>

            {form.public_visible && (
              <div>
                <label className="mb-1.5 block text-[15px] font-bold text-gray-900">
                  Shown publicly as<Suggest on={suggested.public_label} />
                </label>
                <input
                  value={form.public_label}
                  onChange={set("public_label")}
                  maxLength={60}
                  placeholder='Keep it generic, e.g. "Phone" or "Wallet"'
                  className={FIELD}
                />
              </div>
            )}

            {/* Ce que le système décide tout seul. L'agent le voit avant de
                valider, il ne le découvre pas après coup. */}
            <dl className="rounded-xl border border-gray-200 bg-[#f7f8fa] px-4 text-[15px]">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 py-3.5">
                <dt className="text-gray-600">Reference</dt>
                <dd className="font-bold text-gray-400">assigned on save</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-gray-600">Found on</dt>
                <dd className="flex items-center gap-2">
                  <span className="hidden font-bold sm:inline">{fmtLong(form.found_at)}</span>
                  <input
                    type="date"
                    required
                    max={today}
                    value={form.found_at}
                    onChange={set("found_at")}
                    aria-label="Date found"
                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13.5px] font-semibold"
                  />
                </dd>
              </div>
              {tracking && (
              <div className="flex items-center justify-between gap-3 border-t border-gray-200 py-3.5">
                <dt className="text-gray-600">Eligible for transfer</dt>
                <dd className="text-right">
                  <span className="font-bold">{fmtShort(hold)}</span>{" "}
                  <span className="font-semibold text-gray-500">({retention.days} days)</span>
                  {/* D'où vient ce chiffre : sans la source, un délai faux
                      passe inaperçu. */}
                  <span
                    className={`block text-[12.5px] font-semibold ${
                      retention.confirmed ? "text-gray-400" : "text-amber-700"
                    }`}
                  >
                    {retention.confirmed ? retention.label : "provisional · set your policy in Inventory"}
                  </span>
                </dd>
              </div>
              )}
            </dl>

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || uploading}
              onClick={() => { againRef.current = false; }}
              className="mt-auto rounded-xl bg-[#16a34a] px-6 py-4 text-[17px] font-bold text-white shadow-sm hover:bg-[#15913f] disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save item"}
            </button>
            <button
              type="submit"
              disabled={busy || uploading}
              onClick={() => { againRef.current = true; }}
              className="rounded-xl border border-[#16a34a] bg-white px-6 py-3.5 text-[16px] font-bold text-[#15803d] hover:bg-[#f2fbf5] disabled:opacity-60"
            >
              Save and log another
            </button>
            <button
              type="button"
              onClick={() => router.push(`${base}/dashboard`)}
              className="text-[14px] text-gray-500 underline"
            >
              Cancel
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
