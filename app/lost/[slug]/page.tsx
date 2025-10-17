import { notFound, redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import ShareButton from "@/components/ShareButton";

type PageProps = { params: { slug: string } };

export default async function LostReportPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin();
  if (!supabase) notFound();

  const wantedSlug = params.slug;

  // 1) lookup strict
  let { data, error } = await supabase
    .from("lost_items")
    .select(
      "id, slug, title, description, city, state_id, date, time_slot, transport_type, transport_type_other, place_type, place_type_other, object_photo, created_at"
    )
    .eq("slug", wantedSlug)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error);
    notFound();
  }

  // 2) fallback troncature 120 chars
  if (!data) {
    const truncated = wantedSlug.slice(0, 120).replace(/-+$/, "");
    if (truncated !== wantedSlug) {
      const { data: d2 } = await supabase
        .from("lost_items")
        .select(
          "id, slug, title, description, city, state_id, date, time_slot, transport_type, transport_type_other, place_type, place_type_other, object_photo, created_at"
        )
        .eq("slug", truncated)
        .maybeSingle();
      if (d2) redirect(`/lost/${d2.slug}`);
    }
  }

  if (!data) notFound();

  // 3) si trouvé mais slug ≠ URL → redirection canonique
  if (data.slug !== wantedSlug) {
    redirect(`/lost/${data.slug}`);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <p className="text-gray-600 mt-1">
        {data.city} {data.state_id ? `(${data.state_id})` : ""} • {data.date}
      </p>

      {data.object_photo && (
        <img
          src={data.object_photo}
          alt={data.title}
          className="mt-4 rounded-lg border"
        />
      )}

      <div className="prose mt-6">
        <p>{data.description}</p>
      </div>

      <div className="mt-8">
        <ShareButton title={data.title} />
      </div>
    </main>
  );
}
