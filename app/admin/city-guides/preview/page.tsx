// app/admin/city-guides/preview/page.tsx
// Aperçu (protégé par Basic Auth) d'un guide ville, brouillon compris,
// avec la VRAIE structure de la page publique (les blocs existants sont
// représentés par des repères gris à leur position réelle).
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CityGuideTitle, CityGuideExtra } from "@/components/CityGuide";
import type { CityGuide } from "@/lib/cityGuides";

export const dynamic = "force-dynamic";

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 text-sm font-medium text-gray-500">
      {label}
    </div>
  );
}

export default async function CityGuidePreview({
  searchParams,
}: {
  searchParams: { state?: string; city?: string };
}) {
  const state = (searchParams.state || "").toUpperCase();
  const city = (searchParams.city || "").toLowerCase();

  const sb = getSupabaseAdmin();
  if (!sb) return <main className="p-8">Supabase non configuré.</main>;

  const [{ data }, { data: cityRow }] = await Promise.all([
    sb.from("city_guides").select("guide, status").eq("state_id", state).eq("city_slug", city).maybeSingle(),
    sb.from("us_cities").select("image_url, city_ascii").eq("state_id", state).ilike("city_ascii", city).maybeSingle(),
  ]);

  if (!data?.guide) {
    return <main className="p-8 text-gray-600">Aucun guide trouvé pour {city} ({state}).</main>;
  }

  const guide = data.guide as CityGuide;
  const cityImage = (cityRow?.image_url as string) || null;

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <p className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-800">
          👁 Aperçu admin, statut : <strong>{data.status}</strong>. Les blocs gris existent déjà sur la page
          publique (ils ne font pas partie du guide), ils sont montrés ici à leur position réelle.
        </p>
        <CityGuideTitle guide={guide} />
        <Placeholder label="🔍 Bloc existant : signalements récents + carte des commissariats" />
        <Placeholder label="📝 Bloc existant : le formulaire de signalement (les boutons du guide y ramènent)" />
        <CityGuideExtra
          guide={guide}
          cityImage={cityImage}
          cityImageAlt={cityRow?.city_ascii ? `View of ${cityRow.city_ascii}` : null}
        />
      </div>
    </main>
  );
}
