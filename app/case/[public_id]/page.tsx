// app/case/[public_id]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import ReportDetailsPanel from "@/components/ReportDetailsPanel";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

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
};

export default async function Page({ params }: { params: { public_id: string } }) {
  const public_id = params.public_id;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("Missing Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    throw new Error("Supabase server client not configured");
  }

  // NOTE: pas de générique <T> inline (problème de parsing TSX),
  // on récupère la réponse brute puis on cast la data ensuite.
  const resp = await supabase
    .from("lost_items")
    .select("*")
    .eq("public_id", public_id)
    .limit(1)
    .maybeSingle();

  const error = (resp as any).error;
  const data = (resp as any).data as SupabaseLostRow | null;

  if (error) {
    console.error("Supabase lookup error for public_id", public_id, error);
    // on peut renvoyer une erreur ou continuer vers notFound
  }

  if (!data) {
    return notFound();
  }

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

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto">
        <ReportDetailsPanel report={report} />
      </div>
    </div>
  );
}
