// lib/Apivision.ts
import { supabase } from "@/lib/supabase";

export type VisionResult = {
  imageUrl: string;
  labels: string[];
  logos: string[];
  objects: string[];
  ocrText: string;
};

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

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
  const imageUrl = urlData?.publicUrl || "";

  // 2) call server /api/apivision with image_url (preferred)
  try {
    const res = await fetch("/api/apivision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("apivision returned non-ok:", res.status, body);
      throw new Error("Vision API failed");
    }
    const json = await res.json();
    return {
      imageUrl,
      labels: json.labels || [],
      logos: json.logos || [],
      objects: json.objects || [],
      ocrText: json.text || "",
    };
  } catch (err) {
    // fallback: if server-based vision fails, still return imageUrl so user can submit
    console.error("Vision analyze failed, returning imageUrl only:", err);
    return { imageUrl, labels: [], logos: [], objects: [], ocrText: "" };
  }
}
