// lib/Apivision.ts  (client-side util)
import { supabase } from "@/lib/supabase";

export type VisionResult = {
  imageUrl: string;
  labels: string[];
  logos: string[];
  objects: string[];
  ocrText: string;
};

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  // conversion safe pour navigateur (gère gros fichiers par chunk)
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(slice) as any);
  }
  return btoa(binary);
}

export async function uploadImageAndAnalyze(file: File): Promise<VisionResult> {
  // 1) upload dans Supabase Storage
  const fileName = `found-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const { error: uploadError } = await supabase.storage.from("images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw uploadError;
  }
  const { data: pubData } = await supabase.storage.from("images").getPublicUrl(fileName);
  const imageUrl = pubData?.publicUrl || "";

  // 2) base64 (n'utilise pas Buffer pour éviter problèmes de bundling)
  const buffer = await file.arrayBuffer();
  const base64 = await arrayBufferToBase64(buffer);

  // 3) appel API interne
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s
  let res: Response;
  try {
    res = await fetch("/api/apivision", {
      method: "POST",
      body: JSON.stringify({ image: base64 }),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error("Network error calling /api/apivision:", err);
    throw new Error("Vision API network error");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("/api/apivision returned non-ok:", res.status, body);
    throw new Error("Erreur API Vision");
  }

  const json = await res.json().catch((e) => {
    console.error("/api/apivision returned invalid json:", e);
    return null;
  });

  if (!json) throw new Error("Invalid response from Vision API");

  // Normalisation defensive
  const labels = Array.isArray(json.labels) ? json.labels.map(String) : [];
  const logos = Array.isArray(json.logos) ? json.logos.map(String) : [];
  const objects = Array.isArray(json.objects) ? json.objects.map(String) : [];
  const text = typeof json.text === "string" ? json.text : (json.ocrText ?? "") ?? "";

  return {
    imageUrl,
    labels,
    logos,
    objects,
    ocrText: text,
  };
}
