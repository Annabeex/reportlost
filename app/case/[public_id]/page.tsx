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
        "id, public_id, created_at, title, description, city, state_id, date, first_name, email, contribution, case_followup"
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
            "id, public_id, created_at, title, description, city, state_id, date, first_name, email, contribution, case_followup"
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

  const blocks = Array.isArray((data as any).case_followup)
    ? (data as any).case_followup
    : [];
  const publicId = String(data.public_id || "");

  // Sous-titre : "Item … • Location … • Date of loss …"
  const subtitleParts = [
    data.title || data.description ? `Item: ${data.title || data.description}` : null,
    data.city || data.state_id
      ? `Location: ${[data.city, data.state_id].filter(Boolean).join(" (")}${
          data.state_id ? ")" : ""
        }`
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

        <section className="mt-4">
          {isEdit ? (
            <CaseFollowupEditor
              publicId={publicId}
              firstName={data.first_name || ""}
              userEmail={data.email || ""}
            />
          ) : (
            <CaseFollowup blocks={blocks} publicId={publicId} hideEditButton />
          )}
        </section>
      </div>
    </div>
  );
}
