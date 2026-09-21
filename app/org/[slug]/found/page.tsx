// Ancienne adresse des pages publiques (/o/<slug>/found). Conservée pour les liens
// déjà partis dans des mails : elle renvoie à /campus/<slug> ou /at/<slug>.
import { notFound, permanentRedirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { publicPath } from "@/lib/orgScope";

export const dynamic = "force-dynamic";

export default async function LegacyRedirect({ params }: { params: { slug: string } }) {
  const sb = getSupabaseAdmin();
  const { data: org } = sb
    ? await sb.from("organizations").select("slug, type").eq("slug", String(params.slug).toLowerCase()).maybeSingle()
    : { data: null };
  if (!org) notFound();
  permanentRedirect(publicPath(org, "/found"));
}
