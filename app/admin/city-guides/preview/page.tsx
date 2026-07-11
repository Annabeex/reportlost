// app/admin/city-guides/preview/page.tsx
// Aperçu (protégé par Basic Auth) d'un guide ville, brouillon compris,
// rendu avec les mêmes composants que la page publique.
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CityGuideTitle, CityGuideExtra } from "@/components/CityGuide";
import type { CityGuide } from "@/lib/cityGuides";

export const dynamic = "force-dynamic";

export default async function CityGuidePreview({
  searchParams,
}: {
  searchParams: { state?: string; city?: string };
}) {
  const state = (searchParams.state || "").toUpperCase();
  const city = (searchParams.city || "").toLowerCase();

  const sb = getSupabaseAdmin();
  const { data } = sb
    ? await sb
        .from("city_guides")
        .select("guide, status")
        .eq("state_id", state)
        .eq("city_slug", city)
        .maybeSingle()
    : { data: null as any };

  if (!data?.guide) {
    return <main className="p-8 text-gray-600">Aucun guide trouvé pour {city} ({state}).</main>;
  }

  const guide = data.guide as CityGuide;

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <p className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-800">
          👁 Aperçu admin — statut : <strong>{data.status}</strong>. Cette page n’est pas publique.
        </p>
        <CityGuideTitle guide={guide} />
        <CityGuideExtra guide={guide} />
      </div>
    </main>
  );
}
