// reportlost.org/q/<code> — adresse courte encodée dans le QR code « Lost something? »
// (voir lib/orgPosterPdf.ts : une adresse courte donne un QR code moins dense).
// Redirection TEMPORAIRE, exprès : si l'établissement change de nom, l'affiche
// déjà imprimée continue de mener au bon endroit.
import { notFound, redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { publicPath } from "@/lib/orgScope";

export const dynamic = "force-dynamic";

export default async function ShortLink({ params }: { params: { code: string } }) {
  const code = String(params.code || "").trim().toLowerCase();
  if (!/^[a-z0-9]{4,8}$/.test(code)) notFound();
  const sb = getSupabaseAdmin();
  const { data: org } = sb
    ? await sb.from("organizations").select("slug, type").eq("short_code", code).maybeSingle()
    : { data: null };
  if (!org) notFound();
  redirect(publicPath(org));
}
