// app/api/poster/[id]/route.tsx
// Poster social "WANTED" en PNG (carré 1080x1080, format publication Instagram).
// L'IA nettoie titre + lieu + couleur de catégorie, le template met en forme.
// Police Montserrat chargée (repli police système si indisponible).
// URL : /api/poster/{public_id}

import { ImageResponse } from "next/og";

export const runtime = "edge";

const COLORS: Record<string, string> = {
  jewelry: "#ffd6a5",
  watch: "#ffd6a5",
  electronics: "#a0c4ff",
  bag: "#ffadad",
  wallet: "#caffbf",
  documents: "#fdffb6",
  keys: "#bdb2ff",
  other: "#a0c4ff",
};

function fallbackColorKey(text: string): string {
  const c = (text || "").toLowerCase();
  if (/watch/.test(c)) return "watch";
  if (/ring|bracelet|necklace|jewel|earring|gold|silver|pendant/.test(c)) return "jewelry";
  if (/wallet|billfold/.test(c)) return "wallet";
  if (/bag|purse|handbag|backpack|coin|pouch/.test(c)) return "bag";
  if (/key|fob/.test(c)) return "keys";
  if (/passport|document|book|paper|card|id|folder|notebook/.test(c)) return "documents";
  if (/phone|iphone|laptop|tablet|airpod|electronic|camera|headphone|charger/.test(c)) return "electronics";
  return "other";
}

function clean(v: unknown, max = 60): string {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.0.18/files/montserrat-latin-${weight}-normal.woff`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// Un "lieu" qui ressemble à un objet (pochette, sac, étui…) ne doit jamais
// finir après "AT" sur le poster : mieux vaut pas de lieu qu'un lieu absurde.
function looksLikeObject(place: string): boolean {
  return /pouch|bag|purse|wallet|case|sleeve|box|holder|phone|charger|watch|ring|bracelet|necklace|keys?\b|backpack|suitcase|luggage|cover|strap/i.test(
    place
  );
}

async function aiClean(row: any): Promise<{ title: string; colorKey: string; place: string }> {
  let rawPlace = clean(row.place_type_other || row.place_type || "", 50);
  if (looksLikeObject(rawPlace)) rawPlace = "";
  const fallback = {
    title: clean(row.primary_category || row.title || "Item", 20),
    colorKey: fallbackColorKey(`${row.primary_category} ${row.categories} ${row.title} ${row.description}`),
    place: rawPlace,
  };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback;
  const raw = [row.title, row.description, row.primary_category].filter(Boolean).join(" — ").slice(0, 400);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
        max_tokens: 160,
        system: "You label a lost item for a poster. Reply ONLY with JSON.",
        messages: [
          {
            role: "user",
            content: `Lost item: "${raw}". Place where lost (raw): "${rawPlace}".
Return JSON:
{"title":"the OBJECT TYPE ONLY, 1-2 words max, Title Case (e.g. 'Camera','Wallet','Gold Bracelet','Baby Book') — never brand+model+type together, it must fit big on a poster",
 "place":"a very short natural PHYSICAL LOCATION, 1-4 words (e.g. 'the beach','Central Park','a taxi') or '' if unknown. If the raw place text describes an object or container (a pouch, a bag, a case...) and not a location, return '' — never put an object after 'at'",
 "colorKey":"one of: jewelry, watch, electronics, bag, wallet, documents, keys, other"}`,
          },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const m = String(data?.content?.[0]?.text ?? "").match(/\{[\s\S]*\}/);
    if (!m) return fallback;
    const j = JSON.parse(m[0]);
    return {
      title: clean(j.title || fallback.title, 18),
      colorKey: COLORS[j.colorKey] ? j.colorKey : fallback.colorKey,
      place: typeof j.place === "string" && !looksLikeObject(j.place) ? clean(j.place, 32) : "",
    };
  } catch {
    return fallback;
  }
}

// ── Photo ────────────────────────────────────────────────────────────────────
// next/og (satori + resvg) ne décode que PNG, JPEG et GIF. Une WebP, une AVIF,
// une HEIC — ou une URL qui répond du JSON — ne déclenche aucune erreur : elle
// laisse un rectangle blanc de la taille du bloc photo au milieu du poster.
// On va donc chercher l'image nous-mêmes, on vérifie sa SIGNATURE BINAIRE (le
// Content-Type annoncé ment régulièrement) et on ne la passe au rendu que si
// elle est réellement décodable. Sinon on retombe sur le séparateur décoratif :
// un poster sans photo vaut mieux qu'un poster troué.
function sniffImage(bytes: Uint8Array): string {
  const at = (i: number, ...sig: number[]) => sig.every((v, k) => bytes[i + k] === v);
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "png";
  if (at(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "webp";
  if (at(4, 0x66, 0x74, 0x79, 0x70)) return "heic/avif";
  return "unknown";
}

function toBase64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let bin = "";
  // Par tranches : String.fromCharCode(...b) explose la pile au-delà de ~100 Ko.
  for (let i = 0; i < b.length; i += 0x8000) {
    bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

const MAX_PHOTO_BYTES = 6_000_000; // au-delà, le rendu edge dépasse sa mémoire

type PhotoResult = { dataUrl: string; kind: string; bytes: number; status: number };

async function loadPhoto(src: string): Promise<PhotoResult> {
  const empty = { dataUrl: "", kind: "none", bytes: 0, status: 0 };
  if (!src) return empty;
  try {
    const r = await fetch(src, { cache: "force-cache" });
    if (!r.ok) return { ...empty, kind: "http-error", status: r.status };
    const buf = await r.arrayBuffer();
    if (buf.byteLength > MAX_PHOTO_BYTES) {
      return { dataUrl: "", kind: "too-large", bytes: buf.byteLength, status: r.status };
    }
    const kind = sniffImage(new Uint8Array(buf));
    if (kind !== "png" && kind !== "jpeg" && kind !== "gif") {
      return { dataUrl: "", kind, bytes: buf.byteLength, status: r.status };
    }
    return {
      dataUrl: `data:image/${kind};base64,${toBase64(buf)}`,
      kind,
      bytes: buf.byteLength,
      status: r.status,
    };
  } catch {
    return { ...empty, kind: "fetch-failed" };
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const ink = "#26323f";
  const muted = "#64748b";

  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const id = params.id;

    // L'URL peut porter soit le public_id a 5 chiffres, soit l'UUID interne :
    // l'editeur de compte rendu insere "IMAGE:/api/poster/<uuid>". Sans ce
    // aiguillage, la requete sur public_id ne trouvait rien et le poster
    // retombait sur "WANTED ITEM" avec un faux alias construit sur l'UUID.
    const SELECT =
      "select=title,description,primary_category,categories,city,state_id,place_type,place_type_other,date,public_id,object_photo";
    const isPublicId = /^\d{5}$/.test(id);
    const column = isPublicId ? "public_id" : "id";

    let row: any = null;
    if (url && key) {
      const fetchBy = async (col: string) => {
        const qs = `${SELECT}&${col}=eq.${encodeURIComponent(id)}&limit=1`;
        const r = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
          headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
          cache: "no-store",
        });
        if (!r.ok) return null;
        return (await r.json())?.[0] || null;
      };
      row = await fetchBy(column);
      // filet : si l'identifiant ne ressemblait pas a ce qu'on croyait
      if (!row) row = await fetchBy(isPublicId ? "id" : "public_id");
    }
    if (!row) row = { title: "Item", public_id: isPublicId ? id : "" };

    const [{ title, colorKey, place }, f500, f600, f800] = await Promise.all([
      aiClean(row),
      loadFont(500),
      loadFont(600),
      loadFont(800),
    ]);
    const accent = COLORS[colorKey] || COLORS.other;

    // Ville : retire un éventuel "(XX)" déjà présent pour ne pas doubler l'État
    const cityRaw = clean(row.city || "", 30).replace(/\s*\([^)]*\)\s*$/, "").trim();
    const state = clean(row.state_id || "", 4);
    const where =
      `IN ${cityRaw.toUpperCase()}${state ? ` (${state})` : ""}` + (place ? ` AT ${place.toUpperCase()}` : "");
    const date = clean(row.date || "", 20);
    // L'alias relais n'a de sens qu'avec un public_id : jamais construit sur un UUID.
    const publicId = String(row.public_id || (isPublicId ? id : "")).trim();
    const email = publicId ? `item${publicId}@reportlost.org` : "support@reportlost.org";
    const photoSrc =
      typeof row.object_photo === "string" && /^https?:\/\//.test(row.object_photo) ? row.object_photo : "";
    const photoInfo = await loadPhoto(photoSrc);
    const photo = photoInfo.dataUrl;

    // ?debug=1 : dit en une ligne pourquoi la photo n'est pas sur le poster,
    // sans avoir à deviner devant un rectangle blanc.
    if (new URL(req.url).searchParams.get("debug") === "1") {
      return Response.json({
        public_id: publicId,
        object_photo: photoSrc || null,
        http_status: photoInfo.status || null,
        detected_format: photoInfo.kind,
        bytes: photoInfo.bytes || null,
        rendered: Boolean(photo),
        note:
          photoInfo.kind === "webp" || photoInfo.kind === "heic/avif"
            ? "Format non décodable par le générateur : reconvertir la photo en JPEG."
            : undefined,
      });
    }

    const titleSize = title.length > 14 ? 72 : title.length > 9 ? 94 : 118;
    const photoH = title.length > 9 ? 260 : 320;

    const fonts: any[] = [];
    if (f500) fonts.push({ name: "Montserrat", data: f500, weight: 500, style: "normal" });
    if (f600) fonts.push({ name: "Montserrat", data: f600, weight: 600, style: "normal" });
    if (f800) fonts.push({ name: "Montserrat", data: f800, weight: 800, style: "normal" });
    const fam = fonts.length ? "Montserrat" : "sans-serif";

    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1080px",
            display: "flex",
            padding: "40px",
            fontFamily: fam,
            // Cadre coloré sur tout le tour : dégradé léger du plein vers le
            // pâle, jamais blanc (le coin bas-droit paraissait "vide").
            background: `linear-gradient(135deg, ${hexToRgba(accent, 0.55)} 0%, ${hexToRgba(accent, 0.22)} 55%, ${hexToRgba(accent, 0.38)} 100%)`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: "#ffffff",
              borderRadius: "52px",
              padding: "52px 56px",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 24px 70px rgba(30,41,59,0.08)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "46px", letterSpacing: "10px", color: ink, fontWeight: 600 }}>WANTED</div>
              <div
                style={{
                  fontSize: `${titleSize}px`,
                  fontWeight: 800,
                  color: ink,
                  lineHeight: 1.03,
                  textAlign: "center",
                  marginTop: "10px",
                }}
              >
                {title.toUpperCase()}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: "30px",
                  maxWidth: "840px",
                  background: hexToRgba(accent, 0.55),
                  color: ink,
                  borderRadius: "44px",
                  padding: "18px 40px",
                  fontSize: "34px",
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {where}
              </div>
            </div>

            {/* Visuel : photo si dispo, sinon un séparateur décoratif (compo équilibrée) */}
            {photo ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "42px 0" }}>
                <img
                  src={photo}
                  width={440}
                  height={photoH}
                  style={{ width: "440px", height: `${photoH}px`, objectFit: "cover", borderRadius: "28px" }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", margin: "60px 0" }}>
                <div
                  style={{ display: "flex", width: "150px", height: "10px", borderRadius: "10px", background: hexToRgba(accent, 0.85) }}
                />
              </div>
            )}

            {/* Footer */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {date ? <div style={{ fontSize: "36px", color: muted, marginBottom: "20px", fontWeight: 500 }}>{date}</div> : null}
              <div style={{ fontSize: "27px", color: muted, fontWeight: 500 }}>If found, please send an email:</div>
              <div style={{ fontSize: "44px", color: ink, fontWeight: 600, marginTop: "10px" }}>{email}</div>
              <div style={{ display: "flex", fontSize: "50px", color: ink, marginTop: "28px", fontWeight: 600 }}>®</div>
              <div style={{ fontSize: "30px", color: muted, marginTop: "4px", fontWeight: 500 }}>reportlost.org</div>
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1080, ...(fonts.length ? { fonts } : {}) }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1080px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            color: "#26323f",
            fontSize: "56px",
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          reportlost.org
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  }
}
