// lib/Apivision.ts
// client-side helper: upload image to Supabase storage, then call server /api/apivision
import { supabase } from '@/lib/supabaseClient';
import { Buffer } from 'buffer';

export type VisionResult = {
  imageUrl: string;
  labels: string[];
  logos: string[];
  objects: string[];
  ocrText: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
}

export async function uploadImageAndAnalyze(file: File): Promise<VisionResult> {
  // 1) prepare filename
  const safeName = sanitizeFileName(file.name || 'upload.jpg');
  const fileName = `found-${Date.now()}-${safeName}`;

  // 2) upload to Supabase storage
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }

    // 3) get public URL
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl || '';

    if (!publicUrl) {
      throw new Error('No publicUrl returned from Supabase');
    }

    // 4) quick HEAD check to ensure URL is accessible (helps diagnostiquer 400/403/404)
    try {
      const head = await fetch(publicUrl, { method: 'HEAD' });
      if (!head.ok) {
        // don't fail hard — keep going, but log useful info
        console.warn('Public URL HEAD returned non-ok', head.status, publicUrl);
      }
    } catch (headErr) {
      console.warn('HEAD check for publicUrl failed (network?):', headErr);
    }

    // 5) call server endpoint that proxies the Google Vision API
    const callVision = async (payload: Record<string, string>) =>
      fetch('/api/apivision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

    let res = await callVision({ image_url: publicUrl });

    // if Vision cannot access the public URL (private bucket, DNS, ...),
    // fall back to sending the base64 payload.
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      console.warn('Vision API via image_url failed, falling back to base64', res.status, bodyText);

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      res = await callVision({ image: base64 });
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('Vision API proxy returned non-ok', res.status, body);
      throw new Error(`Vision API proxy error: ${res.status} ${body}`);
    }

    const json = await res.json().catch((e) => {
      console.error('Failed to parse Vision proxy JSON:', e);
      throw new Error('Invalid JSON from Vision proxy');
    });

    // 7) normalize results
    const labels = Array.isArray(json.labels) ? json.labels : [];
    const logos = Array.isArray(json.logos) ? json.logos : [];
    const objects = Array.isArray(json.objects) ? json.objects : [];
    const text = typeof json.text === 'string' ? json.text : '';

    return {
      imageUrl: publicUrl,
      labels,
      logos,
      objects,
      ocrText: text,
    };
  } catch (err: any) {
    console.error('uploadImageAndAnalyze error:', err);
    // rethrow so caller can show message
    throw err;
  }
}
