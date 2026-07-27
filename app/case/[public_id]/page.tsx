// app/case/[public_id]/page.tsx
import React from "react";
import { redirect, notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  },
};

// ✅ imports dynamiques
const CaseFollowup = nextDynamic(
  () => import("@/components/CaseFollowup").then((m) => m.default || m),
  {
    ssr: true,
    loading: () => (
      <div className="text-sm text-gray-500">Loading follow-up…</div>
    ),
  }
);

const CaseFollowupEditor = nextDynamic(
  () => import("@/components/CaseFollowupEditor").then((m) => m.default || m),
  {
    ssr: false, // éditeur côté client
    loading: () => <div className="text-sm text-gray-500">Loading editor…</div>,
  }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type SupabaseLostRow = {
  id: string;
  public_id: string | null;
  created_at: string;
  description?: string | null;
  title?: string | null; // ⬅️ pour le sous-titre
  city?: string | null;
  state_id?: string | null;
  date?: string | null; // ⬅️ pour le sous-titre
  first_name?: string | null; // pour le bouton Send (éditeur)
  email?: string | null;
  contribution?: number | null;
  paid?: boolean | null;
  primary_category?: string | null;
  case_token?: string | null;
  case_followup?: any;
};

// -------- utils --------
function toQS(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) return "";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (Array.isArray(v)) {
      if (v[0] != null) qs.set(k, String(v[0]));
    } else if (typeof v === "string") {
      qs.set(k, v);
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}
const DIGITS_ONLY = /^[0-9]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const norm = (s: string) =>
  (s || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

// -------- page --------
export default async function Page({
  params,
  searchParams,
}: {
  params: { public_id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const incoming = norm(params.public_id);
  const qs = toQS(searchParams);

  // 0) Supabase admin
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <div className="font-semibold mb-1">Server configuration error</div>
            <div>
              Missing Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
            </div>
          </div>
        </div>
      </div>
    );
  }

  let data: SupabaseLostRow | null = null;

  // 1) lookup par public_id (string)
  try {
    const r1 = await supabase
      .from("lost_items")
      .select(
        "id, public_id, created_at, title, description, city, state_id, date, first_name, email, contribution, paid, primary_category, case_token, case_followup, case_followup_updated_at"
      )
      .eq("public_id", incoming)
      .limit(1)
      .maybeSingle();

    if (!r1.error) data = (r1.data as SupabaseLostRow) ?? null;
    else console.warn("lookup public_id(string) error:", r1.error);
  } catch (e) {
    console.warn("lookup public_id(string) threw:", e);
  }

  // 1.b) si la colonne public_id est INTEGER
  if (!data && DIGITS_ONLY.test(incoming)) {
    try {
      const num = Number(incoming);
      if (Number.isFinite(num)) {
        const rNum = await supabase
          .from("lost_items")
          .select(
            "id, public_id, created_at, title, description, city, state_id, date, first_name, email, contribution, paid, primary_category, case_token, case_followup, case_followup_updated_at"
          )
          .eq("public_id", num)
          .limit(1)
          .maybeSingle();

        if (!rNum.error) data = (rNum.data as SupabaseLostRow) ?? null;
        else console.warn("lookup public_id(number) error:", rNum.error);
      }
    } catch (e) {
      console.warn("lookup public_id(number) threw:", e);
    }
  }

  // 2) fallback : si on t’appelle par UUID, redirige vers /case/{public_id}
  if (!data && UUID_RE.test(incoming)) {
    try {
      const r3 = await supabase
        .from("lost_items")
        .select("public_id")
        .eq("id", incoming)
        .limit(1)
        .maybeSingle();

      const pub = (r3.data as { public_id?: string | number | null } | null)
        ?.public_id;
      if (!r3.error && pub != null && pub !== "") {
        redirect(`/case/${String(pub)}${qs}`);
      }
    } catch (e) {
      console.warn("lookup id(UUID) threw:", e);
    }
  }

  if (!data) notFound();

  // Mode édition via ?edit=1|true|yes
  const isEdit =
    (typeof searchParams?.edit === "string" &&
      ["1", "true", "yes"].includes(String(searchParams.edit).toLowerCase())) ||
    (Array.isArray(searchParams?.edit) &&
      ["1", "true", "yes"].includes(
        String(searchParams.edit[0] || "").toLowerCase()
      ));

  // 🔒 Vue publique : exige le jeton secret (?t=...) du dossier.
  // Sans lui, aucune donnée n'est affichée (les IDs à 5 chiffres sont énumérables).
  // Le mode édition (?edit=1) reste protégé par le Basic Auth du middleware.
  const providedToken =
    typeof searchParams?.t === "string"
      ? searchParams.t
      : Array.isArray(searchParams?.t)
      ? String(searchParams.t[0] || "")
      : "";
  const tokenOk = !!data.case_token && providedToken === data.case_token;

  if (!isEdit && !tokenOk) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="text-3xl">🔒</div>
          <h1 className="mt-3 text-xl font-bold text-gray-900">This page is private</h1>
          <p className="mt-3 text-sm text-gray-600">
            To protect your personal information, your case page can only be opened through the
            secure link included in our emails. Please use the most recent link we sent you.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Lost the link? Write to{" "}
            <a href="mailto:support@reportlost.org" className="text-emerald-700 underline">
              support@reportlost.org
            </a>{" "}
            from the email address used for your report and we will resend it.
          </p>
        </div>
      </div>
    );
  }

  const blocks = Array.isArray((data as any).case_followup)
    ? (data as any).case_followup
    : [];
  const publicId = String(data.public_id || "");

  // Sous-titre : "Item … • Location … • Date of loss …"
  const cityClean = String(data.city || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  const subtitleParts = [
    data.title || data.description ? `Item: ${data.title || data.description}` : null,
    cityClean || data.state_id
      ? `Location: ${cityClean}${data.state_id ? ` (${data.state_id})` : ""}`
      : null,
    data.date ? `Date of loss: ${data.date}` : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {/* ← Grosse flèche triangulaire dans un rond — visible UNIQUEMENT en mode édition */}
      {isEdit && (
        <div className="max-w-4xl mx-auto mb-2">
          <a
            href="/admin"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition"
            title="Back to admin"
            aria-label="Back to admin"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="10.5"
                fill="none"
                stroke="currentColor"
                className="text-gray-500"
              />
              <path
                d="M14.8 7.6L9.5 12l5.3 4.4V7.6z"
                fill="currentColor"
                className="text-gray-700"
              />
            </svg>
          </a>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Report ID: {publicId}
          </h1>
          {subtitleParts.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">{subtitleParts.join(" • ")}</p>
          )}
        </div>

        {/* Statut du dossier : la valeur du service rendue visible */}
        {Number(data.contribution || 0) > 0 && (
          <section className="rounded-2xl border border-emerald-200 bg-white px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <strong>
                  {Number(data.contribution) >= 30
                    ? "Pet Priority search"
                    : Number(data.contribution) >= 25
                    ? "Maximum search"
                    : "Extended search"}
                </strong>
                &nbsp;active
              </span>
              {data.created_at && (
                <span>
                  🔎 Automated web monitoring until{" "}
                  <strong>
                    {new Date(
                      new Date(data.created_at).getTime() +
                        (Number(data.contribution) >= 25 ? 365 : 180) * 86400000
                    ).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </strong>
                </span>
              )}
              <span>
                ✉️ Questions? Just reply to any of our emails, your case number travels with it.
              </span>
            </div>
          </section>
        )}

        {/* Planche de stickers QR : incluse à partir de l'offre Maximum (25$) */}
        {Number(data.contribution || 0) >= 25 && (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-indigo-900">
                <div className="font-semibold">🎁 Your QR sticker sheet is included with this plan</div>
                <p className="mt-1">
                  Print it and tag your valuables: anyone who finds a tagged item can scan the code and
                  reach you instantly through our protected relay, your personal details stay private.
                </p>
              </div>
              <a
                href={`/api/sticker-sheet?public_id=${encodeURIComponent(publicId)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                ⬇️ Download my sticker sheet (PDF)
              </a>
            </div>
          </section>
        )}

        {/* Affiche gratuite pour les animaux */}
        {String(data.primary_category || "").toLowerCase() === "pets" && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-amber-900">
                <div className="font-semibold">🐕 Print a lost pet poster (free)</div>
                <p className="mt-1">
                  Posters around the neighborhood remain one of the fastest ways to find a pet, make one in
                  2 minutes with your pet&rsquo;s photo and a scannable QR code.
                </p>
              </div>
              <a
                href="/lost-pet-poster"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Make my poster →
              </a>
            </div>
          </section>
        )}

        <section className="mt-4">
          {isEdit ? (
            <CaseFollowupEditor
              publicId={publicId}
              firstName={data.first_name || ""}
              userEmail={data.email || ""}
              caseToken={data.case_token || ""}
              lostId={String(data.id || "")}
            />
          ) : (
            <CaseFollowup
              blocks={blocks}
              publicId={publicId}
              hideEditButton
              firstName={data.first_name || null}
              itemTitle={data.title || null}
              updatedAt={(data as any).case_followup_updated_at || null}
            />
          )}
        </section>
      </div>
    </div>
  );
}
