// lib/cityImage.ts
// Photo d'illustration UNIQUE par ville, générée par IA (Gemini) et stockée dans
// Supabase Storage (bucket public "city-images"). Utilisée par la génération de
// guides et par le bouton "Générer l'image" de l'admin.
import type { SupabaseClient } from "@supabase/supabase-js";

export async function generateCityPhoto(
  sb: SupabaseClient,
  cityRow: { id: number | string; city_ascii: string; state_id: string; state_name?: string | null }
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  const prompt = `Photorealistic editorial photograph of ${cityRow.city_ascii}, ${
    cityRow.state_name || cityRow.state_id
  }, USA. A characteristic daytime view of the town: main street, downtown or typical landscape. Natural light, realistic colors, landscape orientation. No readable text or signs, no close-up people, no watermark.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    console.error("[city-image] Gemini", res.status, (await res.text().catch(() => "")).slice(0, 200));
    return null;
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p: any) => p?.inlineData?.data);
  if (!img) {
    console.error("[city-image] pas d'image dans la réponse Gemini");
    return null;
  }
  let buffer = Buffer.from(img.inlineData.data, "base64");
  let mime = img.inlineData.mimeType || "image/png";
  let ext = mime.includes("jpeg") ? "jpg" : "png";

  // 🗜️ Compression : le PNG Gemini fait 1 à 2,5 Mo ; en WebP 1200px q80 on tombe
  // à ~100 Ko sans différence visible à la taille d'affichage (~600px).
  try {
    const sharp = (await import("sharp")).default;
    buffer = await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    mime = "image/webp";
    ext = "webp";
  } catch (e) {
    console.error("[city-image] compression sharp échouée, upload brut:", e);
  }

  const path = `${cityRow.state_id.toLowerCase()}/${String(cityRow.city_ascii)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.${ext}`;

  let up = await sb.storage.from("city-images").upload(path, buffer, { contentType: mime, upsert: true });
  if (up.error && /not found/i.test(up.error.message || "")) {
    await sb.storage.createBucket("city-images", { public: true }).catch(() => {});
    up = await sb.storage.from("city-images").upload(path, buffer, { contentType: mime, upsert: true });
  }
  if (up.error) {
    console.error("[city-image] upload:", up.error.message);
    return null;
  }
  const { data: pub } = sb.storage.from("city-images").getPublicUrl(path);
  const url = pub?.publicUrl || null;
  if (url) {
    await sb
      .from("us_cities")
      .update({ image_url: url, image_alt: `View of ${cityRow.city_ascii}, ${cityRow.state_id}` })
      .eq("id", cityRow.id);
  }
  return url;
}
