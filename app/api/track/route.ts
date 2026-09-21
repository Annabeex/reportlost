// app/api/track/route.ts
// Compteur d'usage anonyme (liste blanche d'événements, aucune donnée personnelle).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "poster_png",
  "poster_pdf",
  "visit_organic",
  "visit_social",
  "visit_ai",
  "visit_direct",
  "visit_referral",
  // Visite confirmee humaine (premier defilement, toucher, clic ou touche)
  "visit_human",
  // Entonnoir du formulaire de dépôt (diagnostic conversion)
  "form_view",
  "form_step1_done",
  "form_step2_done",
  "form_contribution_view",
  "form_completed_free",
]);

// ⚠️ Googlebot EXÉCUTE le JavaScript : il déclenchait donc VisitTracker et
// form_view comme un visiteur humain. Effet mesuré : les semaines de forte
// exploration affichaient 600 à 900 « ouvertures de formulaire » avec un taux
// d'étape 1 qui s'effondrait à 5 %, contre 20 % les semaines calmes. Toute
// mesure de conversion était donc du bruit. Le filtre est côté serveur : un
// robot ne se déclare pas dans le JavaScript, mais il se déclare dans son
// user-agent.
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|headlesschrome|puppeteer|playwright|phantomjs|lighthouse|pagespeed|inspectiontool|googleother|mediapartners|feedfetcher|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|vkshare|w3c_validator|whatsapp|telegram|discord|slackbot|skypeuripreview|applebot|petalbot|yandex|duckduckbot|baiduspider|semrush|ahrefs|mj12|dotbot|screaming frog|gptbot|oai-searchbot|chatgpt-user|claudebot|perplexitybot|amazonbot|bytespider/i;

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") || "";

    // Un user-agent vide n'est pas un navigateur : c'est un script ou un
    // aspirateur. On répond 200 pour ne rien casser côté client, sans écrire.
    if (!ua || BOT_UA.test(ua)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    const body = await req.json();
    const event = String(body?.event || "");
    if (!ALLOWED.has(event)) return NextResponse.json({ ok: false }, { status: 400 });

    // Page d'arrivee : chemin du site uniquement. Jamais de query string (elle
    // peut transporter ce que la personne a tape), jamais d'URL externe.
    let path: string | null = null;
    const rawPath = typeof body?.path === "string" ? body.path : "";
    if (rawPath.startsWith("/") && !rawPath.startsWith("//")) {
      path = rawPath.split("?")[0].split("#")[0].slice(0, 160);
    }
    const SOURCES = new Set(["organic", "social", "ai", "direct", "referral"]);
    const src = SOURCES.has(String(body?.src)) ? String(body.src) : null;

    const sb = getSupabaseAdmin();
    if (sb) {
      const row: Record<string, any> = { event };
      if (path) row.path = path;
      if (src) row.src = src;
      const { error } = await sb.from("events").insert(row);
      // Si les colonnes path/src n'existent pas encore en base, on retombe sur
      // l'ancien format plutot que de perdre la visite.
      if (error && (path || src)) await sb.from("events").insert({ event });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }); // jamais bloquant côté client
  }
}
