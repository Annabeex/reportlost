// app/case/[public_id]/page.tsx

import React from "react";
import { redirect, notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import ReportDetailsPanel from "@/components/ReportDetailsPanel";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// ✅ imports dynamiques (évite un crash si composants absents / différenciation SSR)
const CaseFollowup = nextDynamic(
  () => import("@/components/CaseFollowup").then((m) => m.default || m),
  {
    ssr: true,
    loading: () => <div className="text-sm text-gray-500">Loading follow-up…</div>,
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
  public_id?: string | null;
  report_public_id?: string | null;
  created_at: string;
  description?: string | null;
  object_photo?: string | null;
  city?: string | null;
  state_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const norm = (s: string) => (s || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

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

  // 0) client Supabase admin — ne pas throw : afficher un panneau d’erreur
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <div className="font-semibold mb-1">Server configuration error</div>
            <div>Missing Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).</div>
          </div>
        </div>
      </div>
    );
  }

  let data: SupabaseLostRow | null = null;

  // 1) public_id (string)
  try {
    const r1 = await supabase
      .from("lost_items")
      .select(
        "id, public_id, report_public_id, created_at, description, city, state_id, email, contribution, case_followup"
      )
      .eq("public_id", incoming)
      .limit(1)
      .maybeSingle();

    if (!r1.error) data = (r1.data as SupabaseLostRow) ?? null;
    else console.warn("lookup public_id(string) error:", r1.error);
  } catch (e) {
    console.warn("lookup public_id(string) threw:", e);
  }

  // 1.b) public_id (number) si colonne INTEGER
  if (!data && DIGITS_ONLY.test(incoming)) {
    try {
      const num = Number(incoming);
      if (Number.isFinite(num)) {
        const rNum = await supabase
          .from("lost_items")
          .select(
            "id, public_id, report_public_id, created_at, description, city, state_id, email, contribution, case_followup"
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

  // 2) fallback ancien report_public_id -> redirect
  if (!data) {
    try {
      const r2 = await supabase
        .from("lost_items")
        .select("public_id")
        .eq("report_public_id", incoming)
        .limit(2);

      if (!r2.error && Array.isArray(r2.data) && r2.data.length === 1) {
        const pub = (r2.data[0] as { public_id?: string | number | null })?.public_id;
        if (pub !== null && pub !== undefined && pub !== "") {
          redirect(`/case/${String(pub)}${qs}`); // pas de "return"
        }
      }
    } catch (e) {
      console.warn("lookup report_public_id threw:", e);
    }
  }

  // 3) fallback id(UUID) -> redirect
  if (!data && UUID_RE.test(incoming)) {
    try {
      const r3 = await supabase
        .from("lost_items")
        .select("public_id")
        .eq("id", incoming)
        .limit(1)
        .maybeSingle();

      if (!r3.error && r3.data?.public_id) {
        const pub = (r3.data as { public_id?: string | number })?.public_id;
        redirect(`/case/${String(pub)}${qs}`); // pas de "return"
      }
    } catch (e) {
      console.warn("lookup id(UUID) threw:", e);
    }
  }

  // si toujours rien
  console.log("🔎 DEBUG CASE PAGE:", { incoming, data });

  if (!data) notFound();

  const report = {
    caseId: data.public_id || data.report_public_id || data.id,
    dateReported: data.created_at,
    itemTitle: data.description || "—",
    itemType: undefined,
    city: data.city || "—",
    state: data.state_id || "—",
    anonymousEmail: data.email || undefined,
    notificationEmail: data.email || undefined,
    supportPhone: undefined,
  };

  // mode édition via ?edit=1|true|yes
  const isEdit =
    (typeof searchParams?.edit === "string" &&
      ["1", "true", "yes"].includes(String(searchParams.edit).toLowerCase())) ||
    (Array.isArray(searchParams?.edit) &&
      ["1", "true", "yes"].includes(String(searchParams.edit[0] || "").toLowerCase()));

  const blocks = Array.isArray((data as any).case_followup) ? (data as any).case_followup : [];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Report ID: {data.public_id}</h1>
        </div>

        <ReportDetailsPanel report={report} />

        <section className="mt-4">
          {isEdit ? (
            <CaseFollowupEditor publicId={String(data.public_id || "")} />
          ) : (
            <CaseFollowup blocks={blocks} />
          )}
        </section>
      </div>
    </div>
  );
}
