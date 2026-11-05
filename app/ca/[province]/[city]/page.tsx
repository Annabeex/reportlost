// app/ca/[province]/[city]/page.tsx
// 🇨🇦 Page ville canadienne, anglais : /ca/on/toronto.
// Affichée seulement si un guide existe dans ca_city_guides (lang 'en').
// Indexable UNIQUEMENT si le guide est publié (règle Canada : pas de guide publié,
// pas d'indexation). Un brouillon est visible en noindex, pour relecture.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isCaProvince } from "@/lib/canada/canadaData";
import type { CaCityGuide, CaCityRow } from "@/lib/ca/cityGuide";
import { loadCaCityRow } from "@/lib/ca/caCityRow";
import CaCityGuideView from "@/components/ca/CaCityGuide";

export const revalidate = 3600;

type Params = { params: { province: string; city: string } };
type Row = { guide: CaCityGuide; status: string; updated_at: string | null };

async function loadGuide(provinceParam: string, cityParam: string): Promise<Row | null> {
  const province = String(provinceParam || "").trim().toUpperCase();
  const city = decodeURIComponent(String(cityParam || "")).trim().toLowerCase();
  if (!isCaProvince(province) || !city) return null;
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return null;
  const { data, error } = await sb
    .from("ca_city_guides")
    .select("guide, status, updated_at")
    .eq("province_id", province)
    .eq("city_ascii", city)
    .eq("lang", "en")
    .maybeSingle();
  if (error || !data) return null;
  return data as Row;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const row = await loadGuide(params.province, params.city);
  if (!row) return {};
  const g = row.guide;
  const url = `https://reportlost.org/ca/${g.province.toLowerCase()}/${g.citySlug}`;
  return {
    title: g.metaTitle,
    description: g.metaDescription,
    alternates: { canonical: url },
    robots: row.status === "published" ? undefined : { index: false, follow: true },
    openGraph: { title: g.metaTitle, description: g.metaDescription, url, siteName: "ReportLost", type: "website" },
  };
}

export default async function CaCityPage({ params }: Params) {
  const row = await loadGuide(params.province, params.city);
  if (!row) notFound();

  // Photo et coordonnées : absentes = la page s'affiche quand même, sans elles.
  let city: CaCityRow | null = null;
  const sb = getSupabaseAdmin({ fresh: false });
  if (sb) city = await loadCaCityRow(sb, row.guide.province, row.guide.citySlug, row.guide.cityName);

  return <CaCityGuideView guide={row.guide} city={city} />;
}
