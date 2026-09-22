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
import { randomInt } from "node:crypto";
import { uploadOrgPhoto } from "@/lib/orgPhotos";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMailDirect } from "@/lib/mailer";
import { isIsoDate, guessPublicLabel } from "@/lib/orgItems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Garde-fous contre le remplissage : par établissement, pas par visiteur —
// l'adresse IP d'un campus est la même pour tout le monde.
const MAX_PENDING = 300; // un dépôt reste ouvert jusqu'à 6 mois
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
    // L'e-mail est demandé dans les DEUX cas (décision d'Anna) : quelqu'un qui
    // annonce « je le dépose à l'accueil » et ne vient pas garde l'objet de
    // fait. Sans son adresse, le propriétaire n'a plus aucun moyen de le récupérer.
    if (!finderEmail) {
      return NextResponse.json(
        { error: "Please leave your email: if the item is not handed in, it is the only way the owner can get it back." },
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
      .select("id, name, verified, finder_held_enabled")
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

    // Photo (facultative). Envoyée par le serveur dans le bucket PRIVÉ : le
    // formulaire public n'a aucun droit d'écriture sur le stockage, et la photo
    // n'est visible que du bureau de l'établissement.
    let photoUrl: string | null = null;
    const photo = form.get("photo");
    if (photo && typeof photo !== "string" && photo.size > 0) {
      const up = await uploadOrgPhoto(sb, org.id, photo, "intake");
      // Une photo refusée ne doit pas faire perdre le dépôt : il part sans elle.
      if ("ref" in up) photoUrl = up.ref;
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
      // Tant que l'accueil n'a pas l'objet en main, il est chez la personne qui
      // l'a trouvé, qu'elle ait prévu de le déposer ou non : les deux cas sont
      // listés de la même façon, jusqu'à la confirmation de l'accueil.
      // Listé tout de suite sur la page publique, sans
      // attendre l'accueil (décision d'Anna : sinon l'objet n'est visible de
      // personne tant qu'un agent n'y pense pas). Seule une CATÉGORIE tirée
      // d'une liste fixe est publiée, jamais le texte saisi pour décrire
      // l'objet. L'agent peut masquer une ligne avec « Public: off ».
      public_visible: true,
      public_label: guessPublicLabel(title),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Accusé de réception au trouveur : la référence, et ce qui se passe ensuite.
    // Reprend l'écran de confirmation, pour qu'il reste sous la main.
    const body =
      heldBy === "finder"
        ? `Hello${finderName ? ` ${finderName}` : ""},

Your report is recorded. The ${org.name} lost and found office now knows you have this item: ${title}.

Reference: ${code}

When someone describes the item correctly, the office gives them your email address (${finderEmail}) so you can arrange the handover. Your contact is never shown publicly.

You can still bring the item to the front desk at any time: give the reference above and the desk finds your report, nothing to fill in again.`
        : `Hello${finderName ? ` ${finderName}` : ""},

Thank you. Your description of the item (${title}) is recorded by the ${org.name} lost and found office.

Drop-off code: ${code}

Bring the item to the front desk and show this code. The desk finds your description with it and confirms it has the item. Until then, the item is listed as still being with you, under a generic category only, and your email address stays private. If it is never handed in, the office may give your email to the owner once their description is checked.`;
    await sendMailDirect({
      to: finderEmail,
      subject: `${org.name} lost and found: your reference ${code}`,
      text: `${body}

ReportLost.org, on behalf of ${org.name}`,
      fromName: "ReportLost",
      noBcc: true,
    }).catch(() => false);

    return NextResponse.json({ ok: true, code, held_by: heldBy });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
