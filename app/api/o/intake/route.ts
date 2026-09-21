// app/api/o/intake/route.ts — dépôt PUBLIC d'un objet trouvé, par la personne
// qui l'a trouvé (QR code affiché dans l'établissement).
//
// Rien n'entre dans l'inventaire ici : la ligne va dans org_intakes et attend
// que l'accueil confirme avoir l'objet en main. Un formulaire public ne doit
// pas pouvoir remplir un inventaire, ni sa page publique, à lui seul.
//
// Pas de lecture par IA sur ce chemin : c'est le seul appel payant du portail,
// on ne l'ouvre pas à un formulaire sans connexion.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomInt } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isIsoDate } from "@/lib/orgItems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// La photo arrive déjà compressée par le navigateur (≈ 300 Ko). Au-delà de
// 3 Mo, ce n'est pas notre formulaire qui l'envoie.
const MAX_PHOTO_BYTES = 3_000_000;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Garde-fous contre le remplissage : par établissement, pas par visiteur —
// l'adresse IP d'un campus est la même pour tout le monde.
const MAX_PENDING = 60;
const MAX_PER_HOUR = 25;

const clean = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid form." }, { status: 400 });

    // Honeypot anti-bot : champ caché qui doit rester vide
    if (clean(form.get("website"), 200)) return NextResponse.json({ ok: true, code: "0000" });

    const slug = clean(form.get("org_slug"), 80).toLowerCase();
    const title = clean(form.get("title"), 120);
    const description = clean(form.get("description"), 1000);
    const foundLocation = clean(form.get("found_location"), 200);
    const foundAt = clean(form.get("found_at"), 10);
    const finderName = clean(form.get("finder_name"), 80);
    const finderEmail = clean(form.get("finder_email"), 160);
    // desk = l'objet sera remis à l'accueil ; finder = la personne le garde et
    // laisse son e-mail pour que le propriétaire puisse le récupérer.
    const heldBy = clean(form.get("held_by"), 10) === "finder" ? "finder" : "desk";

    if (!slug || title.length < 2) {
      return NextResponse.json({ error: "Please say what the item is." }, { status: 400 });
    }
    const today = new Date(Date.now() + 86400000).toISOString().slice(0, 10); // marge fuseaux
    if (!isIsoDate(foundAt) || foundAt > today) {
      return NextResponse.json({ error: "Please enter the date the item was found." }, { status: 400 });
    }
    if (heldBy === "finder" && !finderEmail) {
      return NextResponse.json(
        { error: "Please leave your email: it is the only way the owner can get the item back from you." },
        { status: 400 }
      );
    }
    if (finderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finderEmail)) {
      return NextResponse.json({ error: "This email address does not look valid." }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "unavailable" }, { status: 500 });

    const { data: org } = await sb
      .from("organizations")
      .select("id, verified, finder_held_enabled")
      .eq("slug", slug)
      .maybeSingle();
    if (!org || !org.verified) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (heldBy === "finder" && org.finder_held_enabled === false) {
      return NextResponse.json({ error: "Please hand the item to the front desk." }, { status: 400 });
    }

    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const [{ count: pending }, { count: recent }] = await Promise.all([
      // Compté par type : des signalements gardés par leur trouveur, qui restent
      // ouverts longtemps, ne doivent pas bloquer les remises à l'accueil.
      sb.from("org_intakes").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("status", "pending").eq("held_by", heldBy),
      sb.from("org_intakes").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", hourAgo),
    ]);
    if ((pending || 0) >= MAX_PENDING || (recent || 0) >= MAX_PER_HOUR) {
      return NextResponse.json(
        { error: "The desk cannot take online drop-offs right now. Please hand the item to the front desk directly." },
        { status: 429 }
      );
    }

    // Photo (facultative), envoyée par le serveur : le formulaire public n'a
    // aucun droit d'écriture direct sur le stockage.
    let photoUrl: string | null = null;
    const photo = form.get("photo");
    if (photo && typeof photo !== "string" && photo.size > 0) {
      const ext = PHOTO_TYPES[photo.type];
      if (!ext) return NextResponse.json({ error: "The photo must be a JPEG, PNG or WebP image." }, { status: 400 });
      if (photo.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "The photo is too large." }, { status: 400 });
      const path = `org_items/intake/${randomUUID()}.${ext}`;
      const buf = Buffer.from(await photo.arrayBuffer());
      const { error: upErr } = await sb.storage.from("images").upload(path, buf, { contentType: photo.type, upsert: false });
      // Une photo qui ne passe pas ne doit pas faire perdre le dépôt.
      if (!upErr) photoUrl = sb.storage.from("images").getPublicUrl(path).data?.publicUrl || null;
    }

    // Code court, unique parmi les dépôts en attente de cet établissement.
    let code = "";
    for (let i = 0; i < 8; i++) {
      const c = String(randomInt(1000, 10000));
      const { count } = await sb
        .from("org_intakes")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "pending")
        .eq("code", c);
      if (!count) { code = c; break; }
    }
    if (!code) code = String(randomInt(100000, 1000000));

    const { error } = await sb.from("org_intakes").insert({
      org_id: org.id,
      code,
      title,
      description: description || null,
      found_location: foundLocation || null,
      found_at: foundAt,
      photo_url: photoUrl,
      finder_name: finderName || null,
      finder_email: finderEmail || null,
      held_by: heldBy,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, code, held_by: heldBy });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
