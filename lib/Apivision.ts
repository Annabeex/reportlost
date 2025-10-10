// lib/Apivision.ts
import { supabase } from "@/lib/supabase";
import { Buffer } from "buffer";

/**
 * Result shape returned to UI
 */
export type VisionResult = {
  imageUrl: string;
  labels: string[];
  logos: string[];
  objects: string[];
  ocrText: string;
};

/**
 * Sanitize file names to avoid encoding / special character issues
 */
function sanitizeFileName(original: string) {
  const extMatch = original.match(/(\.[a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1] : "";
  const base = original.replace(ext, "");
  const slug = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  return `${slug}${ext}`;
}

/**
 * Upload a file to the "images" bucket and return the public URL.
 * Throws on error; caller should catch.
 */
async function uploadToStorage(file: File): Promise<string> {
  const safeName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  // Keep a predictable folder for found items
  const path = `found/${safeName}`;

  // upload
  const { error: uploadError } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    console.error("Supabase upload error object:", uploadError);
    throw uploadError;
  }

  // get public URL (use the client SDK's getPublicUrl)
  const { data: urlData, error: urlError } = supabase.storage.from("images").getPublicUrl(path);
  if (urlError) {
    console.error("Supabase getPublicUrl error:", urlError);
    throw urlError;
  }
  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) {
    throw new Error("No publicUrl returned after upload");
  }
  return publicUrl;
}

/**
 * Upload image (if needed), call the server Vision endpoint, return aggregated result.
 *
 * Behavior:
 *  - Uploads the file to storage and returns the publicUrl even if Vision fails.
 *  - Calls internal endpoint `/api/apivision` with base64 of the file (server-side calls Google).
 *  - Throws on severe failures (upload or non-ok /api/apivision), so caller can show error UI.
 */
export async function uploadImageAndAnalyze(file: File): Promise<VisionResult> {
  // 1) upload to storage so we always have a public URL
  let imageUrl = "";
  try {
    imageUrl = await uploadToStorage(file);
  } catch (uploadErr) {
    console.error("uploadImageAndAnalyze — upload failed:", uploadErr);
    // propagate so caller can show error; we could alternatively continue without url,
    // but safer to fail early so UI can notify the user.
    throw uploadErr;
  }

  // 2) prepare base64 for Vision API
  let base64 = "";
  try {
    const buffer = await file.arrayBuffer();
    base64 = Buffer.from(buffer).toString("base64");
  } catch (err) {
    console.error("Failed to convert file to base64:", err);
    // still return imageUrl with empty analysis to avoid blocking user entirely?
    // Here we choose to throw so caller sees the failure.
    throw err;
  }

  // 3) call server-side Vision route (it will call Google Vision with service key)
  try {
    const res = await fetch("/api/apivision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("/api/apivision returned non-ok:", res.status, text);
      // throw an error with details for easier debugging
      throw new Error(`Vision API endpoint failed: ${res.status} ${text}`);
    }

    const json = await res.json().catch((e) => {
      console.error("/api/apivision returned invalid JSON:", e);
      return null;
    });

    if (!json) {
      throw new Error("Vision API returned invalid response");
    }

    // Normalize shapes (server may return arrays or undefined)
    const labels = Array.isArray(json.labels) ? json.labels : (json.labels ? [String(json.labels)] : []);
    const logos = Array.isArray(json.logos) ? json.logos : (json.logos ? [String(json.logos)] : []);
    const objects = Array.isArray(json.objects) ? json.objects : (json.objects ? [String(json.objects)] : []);
    const ocrText = typeof json.text === "string" ? json.text : (json.ocr_text || json.fullText || "");

    return {
      imageUrl,
      labels,
      logos,
      objects,
      ocrText,
    };
  } catch (err) {
    console.error("uploadImageAndAnalyze — Vision call failed:", err);
    // We decide to *propagate* the error so caller can show "analysis failed".
    // The caller already has imageUrl so it can still submit without analysis if desired.
    throw err;
  }
}
