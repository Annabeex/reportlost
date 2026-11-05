// lib/ca/caCityImage.ts
// 🇨🇦 COPIE CANADIENNE de lib/cityImage.ts (US, non modifié).
// Photo d'illustration UNIQUE par ville, générée par Gemini (API Google) et
// stockée dans Supabase Storage (bucket public "city-images", sous ca/<province>/).
// Écrit dans ca_cities.image_url / image_alt. Déclenchée à la main depuis
// /api/admin/ca-city-image-generate, jamais au rendu d'une page.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaCityRow } from "@/lib/ca/cityGuide";

export async function generateCaCityPhoto(sb: SupabaseClient, city: CaCityRow): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  const name = city.city;
  const prov = city.province_name || city.province_id;
  const prompt = `Photorealistic editorial photograph of ${name}, ${prov}, Canada. A characteristic daytime view of the city: downtown, main street, waterfront or typical landscape. Natural light, realistic colors, landscape orientation. No readable text or signs, no close-up people, no watermark.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    console.error("[ca-city-image] Gemini", res.status, (await res.text().catch(() => "")).slice(0, 200));
    return null;
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p: any) => p?.inlineData?.data);
  if (!img) {
    console.error("[ca-city-image] pas d'image dans la réponse Gemini");
    return null;
  }
  let buffer = Buffer.from(img.inlineData.data, "base64");
  let mime = img.inlineData.mimeType || "image/png";
  let ext = mime.includes("jpeg") ? "jpg" : "png";

  // Compression : WebP 1200 px q80 (~100 Ko), comme côté US.
  try {
    const sharp = (await import("sharp")).default;
    buffer = await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    mime = "image/webp";
    ext = "webp";
  } catch (e) {
    console.error("[ca-city-image] compression sharp échouée, upload brut:", e);
  }

  const slug = String(city.city_ascii || city.city)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const path = `ca/${city.province_id.toLowerCase()}/${slug}.${ext}`;

  let up = await sb.storage.from("city-images").upload(path, buffer, { contentType: mime, upsert: true });
  if (up.error && /not found/i.test(up.error.message || "")) {
    await sb.storage.createBucket("city-images", { public: true }).catch(() => {});
    up = await sb.storage.from("city-images").upload(path, buffer, { contentType: mime, upsert: true });
  }
  if (up.error) {
    console.error("[ca-city-image] upload:", up.error.message);
    return null;
  }
  const { data: pub } = sb.storage.from("city-images").getPublicUrl(path);
  // ?v= : l'URL change à chaque régénération, sinon le CDN garde l'ancienne image.
  const url = pub?.publicUrl ? `${pub.publicUrl}?v=${Date.now()}` : null;
  if (url) {
    await sb
      .from("ca_cities")
      .update({ image_url: url, image_alt: `View of ${name}, ${city.province_id}` })
      .eq("id", city.id);
  }
  return url;
}
