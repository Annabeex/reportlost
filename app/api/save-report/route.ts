// app/api/save-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* small helper: promise timeout (10s) */
async function withTimeout<T>(p: Promise<T>, ms = 10_000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

/* 5 digits from uuid (fallback only) */
function refCode5FromId(input: string): string {
  const b = crypto.createHash("sha1").update(input).digest(); // 20 bytes
  const n = b.readUInt32BE(0);
  return String((n % 90000) + 10000).padStart(5, "0");
}

/* Prefer DB public_id if it's exactly 5 digits, else fallback from id */
function getReferenceCode(public_id: string | null | undefined, id: string): string {
  if (public_id && /^\d{5}$/.test(public_id)) return public_id;
  return refCode5FromId(id);
}

/* compute fingerprint (server-side, should match client) */
function computeFingerprint(obj: {
  title?: string | null;
  description?: string | null;
  city?: string | null;
  state_id?: string | null;
  date?: string | null;
  email?: string | null;
}) {
  const parts = [
    obj.title ?? "",
    obj.description ?? "",
    obj.city ?? "",
    (obj.state_id ?? "").toUpperCase(),
    obj.date ?? "",
    (obj.email ?? "").toLowerCase(),
  ];
  const raw = parts.join("|");
  return crypto.createHash("sha1").update(raw).digest("hex");
}


/* --- base URL helper (works in local / preview / prod) --- */
function getBaseUrl(req: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "127.0.0.1:3000";
  return `${proto}://${host}`;
}

/* call /api/send-mail on the same deployment */
async function sendMailViaApi(
  req: NextRequest,
  payload: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    fromName?: string;
    replyTo?: string;
  },
) {
  try {
    const base = getBaseUrl(req);
    const mailApiKey = process.env.MAIL_API_KEY;
    const reqFetch = fetch(`${base}/api/send-mail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(mailApiKey ? { Authorization: `Bearer ${mailApiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    const res = (await withTimeout(reqFetch, 10_000)) as Response; // ⏱️ timeout dur 10s
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("sendMailViaApi non-ok:", res.status, body);
    }
    return res.ok;
  } catch (e) {
    console.error("sendMailViaApi error", e);
    return false;
  }
}

/** déclenche la génération/maj du slug pour un report donné (fire & forget) */
async function triggerSlugGeneration(req: NextRequest, id: string) {
  try {
    const base = getBaseUrl(req);
    await fetch(`${base}/api/generate-report-slug?id=${encodeURIComponent(id)}`, {
      method: "GET",
      keepalive: true,
    });
  } catch (e) {
    console.warn("generate-report-slug failed (ignored):", e);

  }
}

/* --- Ajout MINIMAL: recheck avant envoi au client --- */
async function canSendUserMail(supabase: any, id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("lost_items")
      .select("mail_sent")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.warn("canSendUserMail check error (continue anyway):", error);
      return true; // on préfère envoyer plutôt que rater
    }
    return !data?.mail_sent;
  } catch (e) {
    console.warn("canSendUserMail exception (continue anyway):", e);
    return true; // on préfère envoyer plutôt que rater
  }
}

/* ---------- Auto-categorization (EN keywords + quelques alias FR) ---------- */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  keys: ["keys","key","keychain","fob","car key","house key","apartment key","office key"],
  wallet: ["wallet","cardholder","card holder","billfold"],
  electronics: [
    "phone","iphone","android","tablet","ipad","laptop","macbook","notebook pc",
    "earbuds","airpods","headphones","charger","power bank","smartwatch","apple watch"
  ],
  glasses: ["glasses","sunglasses","spectacles","eyeglasses","shades","frame","goggles","ray-ban"],
  documents: ["passport","id","id card","driver license","license","permit","document","paperwork","papers","envelope","visa"],
  jewelry: ["ring","bracelet","necklace","earring","earrings","watch","pendant","wedding band","bague"],
  clothes: ["jacket","coat","hoodie","sweater","jumper","scarf","cap","hat","beanie","gloves","raincoat","vest","t-shirt","shirt","jeans","pull"],
  bag: ["bag","backpack","rucksack","suitcase","carry-on","handbag","tote","duffel","messenger bag","purse","briefcase"],
  pets: ["cat","dog","kitten","puppy","bird","parrot","tortoise","rabbit","bunny","hamster","ferret"],
  other: ["umbrella","bottle","water bottle","notebook","book","sketchbook","tripod","speaker","camera strap","accessory"]
};

const BAG_ALIASES = new Set([
  "bag-or-suitcase","bag","purse","handbag","backpack","backpack-or-suitcase","luggage","suitcase"
]);

function normalizeCategorySlug(s: string) {
  const x = (s || "").toLowerCase();
  return BAG_ALIASES.has(x) ? "bag" : x;
}

function autoCategorize(title?: string | null, description?: string | null) {
  const hay = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  if (!hay.trim()) return { primary: null as string | null, list: null as string[] | null };

  const scores: Record<string, number> = {};
  for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kwRaw of CATEGORY_KEYWORDS[cat]) {
      const kw = kwRaw.toLowerCase();
      if (hay.includes(kw)) score++;
    }
    if (score > 0) scores[cat] = score;
  }

  const list = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  if (!list.length) return { primary: null, list: null };

  const primary = normalizeCategorySlug(list[0]);
  const unique = Array.from(new Set(list.map(normalizeCategorySlug)));
  return {
    primary,
    list: unique.slice(0, 3)
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });

    // ✅ compat: si le client envoie source_station, on le mappe vers station_slug (référence DB)
    if (body?.source_station && !body?.station_slug) {
      body.station_slug = String(body.source_station);
    }

    // supabase admin client (centralisé)
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Missing Supabase env vars" }, { status: 500 });
    }

    // minimal normalization
    const title = (body.title ?? "").trim() || null;
    const description = (body.description ?? "").trim() || null;
    const city = (body.city ?? "").trim() || null;
    const state_id = (body.state_id ?? "").toUpperCase() || null;
    const date = body.date ?? null;
    const email = (body.email ?? "").toLowerCase() || null;

    // === Ajout: whitelist & sanitation des champs, avec coercition bool ===
    const toNull = (v: any) => (v === "" || v === undefined ? null : v);

    const toBoolOrNull = (v: any) => {
      if (v === true || v === false) return v;
      if (v === "true") return true;
      if (v === "false") return false;
      return v == null ? null : Boolean(v);
    };

    const allowedKeys = new Set<string>([
      // existants
      "title",
      "description",
      "city",
      "state_id",
      "date",
      "time_slot",
      "loss_neighborhood",
      "loss_street",
      "departure_place",
      "arrival_place",
      "departure_time",
      "arrival_time",
      "travel_number",
      "email",
      "first_name",
      "last_name",
      "phone",
      "address",
      "contribution",
      "consent",
      "phone_description",
      "object_photo",
      // NOUVEAUX champs (déjà utilisés côté client)
      "transport_answer",
      "transport_type",
      "transport_type_other",
      "place_type",
      "place_type_other",
      "airline_name",
      "metro_line_known",
      "metro_line",
      "train_company",
      "rideshare_platform",
      "taxi_company",
      "circumstances",
      "preferred_contact_channel",
      "research_report_opt_in",

      // ✅ référence partenaire (DB)
      "station_slug",

      // ✅ Catégorisation (schéma actuel)
      "primary_category",   // text
      "categories",         // text[]

      // identifiants/fingerprint
      "fingerprint",
      "report_id",
      "report_public_id",
    ]);

    // keep original payload for email templating but sanitize before DB operations
    const otherRaw = { ...(body || {}) };
    const other: Record<string, any> = {};

    // on copie uniquement les champs whitelists avec sanitation légère
    for (const k of Object.keys(otherRaw)) {
      if (!allowedKeys.has(k)) continue;
      let val = otherRaw[k];

      if (k === "metro_line_known" || k === "research_report_opt_in") {
        val = toBoolOrNull(val);
      } else if (k === "categories") {
        // accepte string | string[]
        if (Array.isArray(val)) {
          val = val
            .map((s: any) => String(s ?? "").trim().toLowerCase())
            .filter(Boolean);
          if (!val.length) val = null;
        } else if (typeof val === "string") {
          const arr = val
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          val = arr.length ? arr : null;
        } else {
          val = null;
        }
      } else if (
        typeof val === "string" &&
        !["email", "state_id", "time_slot", "preferred_contact_channel"].includes(k)
      ) {
        val = val.trim();
      }
      other[k] = toNull(val);
    }

    // valeur par défaut pour respecter NOT NULL
    if (!other.preferred_contact_channel) other.preferred_contact_channel = "email";

    // sécurité: ne jamais remonter ces champs vers l'update payload
    delete other.report_id;
    delete other.report_public_id;
    delete (other as any).category; // si un vieux client envoie "category", on l'ignore

    // Catégorisation automatique si aucune info n'est fournie par le client/admin
    if (!other.primary_category && !other.categories) {
      const auto = autoCategorize(title, description);
      if (auto.primary) {
        other.primary_category = auto.primary;
      }
      if (auto.list && auto.list.length) {
        other.categories = auto.list;
      }
    }
    // Si on a une primary mais pas de tableau, on alimente categories
    if (!other.categories && other.primary_category) {
      other.categories = [other.primary_category];
    }

// --- fingerprint + payload DB ---
const fingerprint = computeFingerprint({ title, description, city, state_id, date, email });
const updatePayload = { ...other, fingerprint, state_id };


    // helper for an existing row (shared for found & lost)
    const handleExistingRow = async (
      existing: { id: string; public_id: string | null; mail_sent: boolean; created_at?: string | null },
    ) => {
      const createdAt = existing.created_at || new Date().toISOString();

      // attempt update
      const { error: updErr } = await supabase.from("lost_items").update(updatePayload).eq("id", existing.id);
      if (updErr) {
        console.error("Supabase update(existing) failed:", updErr);
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      // NEW: trigger slug generation (non bloquant)
      await triggerSlugGeneration(req, existing.id);

      // send confirmation to user only once (avec recheck)
      let mail_sent = !!existing.mail_sent;
      if (!mail_sent && (other.email || email)) {
        try {
          const shouldSend = await canSendUserMail(supabase, existing.id);
          if (shouldSend) {
            const base = getBaseUrl(req);
            const contributeUrl = `${base}/report?go=contribute&rid=${existing.id}`;

            // reference code from DB public_id (5 digits) or fallback
            const ref5 = getReferenceCode(existing.public_id, existing.id);
            const referenceLine = `Reference code: ${ref5}\n`;
            const stationLine = other.station_slug ? `- Submitted via: ${other.station_slug}\n` : "";

            const text = `Hello ${other.first_name || ""},

We have saved your lost item report draft on reportlost.org.

To publish it and start the search, please complete the secure payment (you can choose your search level on the next page).

Your report details:
- Item: ${other.title || ""}
- Date: ${other.date || ""}
- City: ${other.city || ""}
${stationLine}${referenceLine}
${contributeUrl}

Payments are processed securely by Stripe (PCI DSS v4.0). Once the payment is confirmed, your report will be published and alerts will be activated.

Thank you for using ReportLost.`;

            const site = getBaseUrl(req);
            const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">✅ Publish your report to start the search</p>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55;background:#fff">
    <p style="margin:0 0 12px">Hello <b>${other.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">
      We have saved your lost item report <em>draft</em> on
      <a href="${site}" style="color:#2C7A4A;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">
      To publish it and start the search, please complete the secure payment.
      You will be able to choose your search level on the next page.
    </p>

    <p style="margin:0 0 8px"><b>Your report details</b></p>
    <ul style="margin:0 16px 18px;padding-left:18px">
      <li><b>Item:</b> ${other.title || ""}</li>
      <li><b>Date:</b> ${other.date || ""}</li>
      <li><b>City:</b> ${other.city || ""}</li>
      ${other.station_slug ? `<li><b>Submitted via:</b> ${other.station_slug}</li>` : ""}
      <li><b>Reference code:</b> ${ref5}</li>
    </ul>

    <p style="margin:0 0 18px">
      <a href="${contributeUrl}"
         style="display:inline-block;background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
        Proceed to secure payment
      </a>
    </p>

    <p style="margin:0 0 8px;font-size:13px;color:#374151">
      Payments are processed securely by Stripe (PCI DSS v4.0). Once the payment is confirmed, your report will be published and alerts will be activated.
    </p>
  </div>
</div>`;

            const okUser = await sendMailViaApi(req, {
              to: other.email || email || "",
              subject: "Publish your report to start the search",
              text,
              html,
            });

            if (okUser) {
              try {
                await supabase.from("lost_items").update({ mail_sent: true }).eq("id", existing.id);
                mail_sent = true;
                console.log("✅ Confirmation email sent and mail_sent persisted for", existing.id);
              } catch (e) {
                console.warn("Could not persist mail_sent flag for existing row:", e);
              }
            } else {
              console.error("❌ Confirmation email sending failed for", existing.id);
            }
          } else {
            console.log("⏭️ Mail already sent earlier, skipping for", existing.id);
          }
        } catch (err) {
          console.error("❌ Email confirmation deposit failed for existing row:", err);
        }
      }

      // --- Support notification (fire & forget robuste) ---
      (() => {
        try {
          const subjectBase = `Lost item : ${other.title || "Untitled"}`;
          const subject = other.city ? `${subjectBase} à ${other.city}` : subjectBase;
          const dateAndSlot = [other.date, other.time_slot].filter(Boolean).join(" ");
          const reference = getReferenceCode(existing.public_id, existing.id);
          const bodyText = `Report: ${existing.id}
City: ${other.city || ""}
State: ${state_id || ""}
Reference: ${reference}

🕒 ${createdAt}

Lost item : ${other.title || ""}
Description : ${other.description || ""}
Date of lost : ${dateAndSlot}

If you think you found it, please contact : support@reportlost.org reference (${reference})

Contribution : ${other.contribution ?? 0}`;

          sendMailViaApi(req, {
            to: "support@reportlost.org",
            subject,
            text: bodyText,
          })
            .then((ok) =>
              console.log(ok ? "📨 Support email sent (existing)" : "❌ Support email failed (existing)"),
            )
            .catch((err) => console.error("❌ Support email throw (existing):", err));
        } catch (err) {
          console.error("❌ Email notification to support failed for existing row:", err);
        }
      })();

      return NextResponse.json(
        {
          ok: true,
          action: "updated",
          id: existing.id,
          public_id: existing.public_id,
          mail_sent,
          created_at: createdAt,
        },
        { status: 200 },
      );
    };

    const clientProvidedId = body.report_id ? String(body.report_id) : null;

    // 1) If client provided an id -> try update that specific row
    if (clientProvidedId) {
      const { data: existing, error: e1 } = await supabase
        .from("lost_items")
        .select("id, public_id, mail_sent, created_at")
        .eq("id", clientProvidedId)
        .maybeSingle();

      if (e1) {
        console.error("Supabase error checking clientProvidedId:", e1);
      } else if (existing) {
        const { error: upErr } = await supabase.from("lost_items").update(updatePayload).eq("id", clientProvidedId);
        if (upErr) {
          console.error("Supabase update (clientProvidedId) failed:", upErr);
          return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
        }

        // NEW: trigger slug generation (non bloquant)
        await triggerSlugGeneration(req, clientProvidedId);

        // send user confirmation if not already done (avec recheck)
        if (!existing.mail_sent && (other.email || email)) {
          try {
            const shouldSend = await canSendUserMail(supabase, clientProvidedId);
            if (shouldSend) {
              const base = getBaseUrl(req);
              const contributeUrl = `${base}/report?go=contribute&rid=${clientProvidedId}`;

              const ref5 = getReferenceCode(existing.public_id, clientProvidedId);
              const referenceLine = `Reference code: ${ref5}\n`;

              const text = `Hello ${other.first_name || ""},

We have saved your lost item report draft on reportlost.org.

To publish it and start the search, please complete the secure payment (you can choose your search level on the next page).

Your report details:
- Item: ${other.title || ""}
- Date: ${other.date || ""}
- City: ${other.city || ""}
${referenceLine}
${contributeUrl}

Payments are processed securely by Stripe (PCI DSS v4.0). Once the payment is confirmed, your report will be published and alerts will be activated.

Thank you for using ReportLost.`;

              const site = getBaseUrl(req);
              const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">✅ Publish your report to start the search</p>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55;background:#fff">
    <p style="margin:0 0 12px">Hello <b>${other.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">
      We have saved your lost item report <em>draft</em> on
      <a href="${site}" style="color:#2C7A4A;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">
      To publish it and start the search, please complete the secure payment.
      You will be able to choose your search level on the next page.
    </p>

    <p style="margin:0 0 8px"><b>Your report details</b></p>
    <ul style="margin:0 16px 18px;padding-left:18px">
      <li><b>Item:</b> ${other.title || ""}</li>
      <li><b>Date:</b> ${other.date || ""}</li>
      <li><b>City:</b> ${other.city || ""}</li>
      <li><b>Reference code:</b> ${ref5}</li>
    </ul>

    <p style="margin:0 0 18px">
      <a href="${contributeUrl}"
         style="display:inline-block;background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
        Proceed to secure payment
      </a>
    </p>

    <p style="margin:0 0 8px;font-size:13px;color:#374151">
      Payments are processed securely by Stripe (PCI DSS v4.0). Once the payment is confirmed, your report will be published and alerts will be activated.
    </p>
  </div>
</div>`;

              const okUser = await sendMailViaApi(req, {
                to: other.email || email || "",
                subject: "✅ Publish your report to start the search",
                text,
                html,
              });

              if (okUser) {
                try {
                  await supabase.from("lost_items").update({ mail_sent: true }).eq("id", clientProvidedId);
                  console.log("✅ Confirmation email sent and mail_sent persisted for", clientProvidedId);
                } catch (e) {
                  console.warn("Could not persist mail_sent flag for clientProvidedId:", e);
                }
              } else {
                console.error("❌ Confirmation email sending failed for", clientProvidedId);
              }
            } else {
              console.log("⏭️ Mail already sent earlier, skipping for", clientProvidedId);
            }
          } catch (err) {
            console.error("❌ Email confirmation deposit failed for clientProvidedId:", err);
          }
        }

        // --- Support notification (fire & forget robuste) ---
        (() => {
          try {
            const subjectBase = `Lost item : ${other.title || "Untitled"}`;
            const subject = other.city ? `${subjectBase} à ${other.city}` : subjectBase;
            const dateAndSlot = [other.date, other.time_slot].filter(Boolean).join(" ");
            const reference = getReferenceCode(existing.public_id, clientProvidedId);
            const createdAt = existing.created_at || new Date().toISOString();
            const bodyText = `Report: ${clientProvidedId}
City: ${other.city || ""}
State: ${state_id || ""}
Reference: ${reference}

🕒 ${createdAt}

Lost item : ${other.title || ""}
Description : ${other.description || ""}
Date of lost : ${dateAndSlot}

If you think you found it, please contact : support@reportlost.org reference (${reference})

Contribution : ${other.contribution ?? 0}`;

            sendMailViaApi(req, {
              to: "support@reportlost.org",
              subject,
              text: bodyText,
            })
              .then((ok) =>
                console.log(ok ? "📨 Support email sent (update by id)" : "❌ Support email failed (update by id)"),
              )
              .catch((err) => console.error("❌ Support email throw (update by id):", err));
          } catch (err) {
            console.error("❌ Email notification to support failed for clientProvidedId:", err);
          }
        })();

        return NextResponse.json(
          { ok: true, action: "updated", id: clientProvidedId, public_id: existing.public_id },
          { status: 200 },
        );
      }
    }

   // 2) Try to find existing by fingerprint
const { data: foundRows, error: findErr } = await supabase
  .from("lost_items")
  .select("id, public_id, mail_sent, created_at")
  .eq("fingerprint", fingerprint) // ← réutilise la variable déjà définie
  .order("created_at", { ascending: false })
  .limit(1);


    if (findErr) {
      console.error("Supabase lookup error:", findErr);
    }

    const found = Array.isArray(foundRows) ? (foundRows[0] as any) : null;

    if (found) {
      return handleExistingRow(found as any);
    }

    // 3) Insert new row
    const insertPayload = { ...updatePayload, mail_sent: false };
    const { data: insData, error: insErr } = await supabase
      .from("lost_items")
      .insert([insertPayload])
      .select("id, public_id, created_at")
      .single();

    if (insErr || !insData?.id) {
      const errMsg = (insErr && (insErr.message || insErr.code || JSON.stringify(insErr))) || "";
      if (insErr && (String(errMsg).includes("duplicate key") || String(errMsg).includes("23505"))) {
        // try to recover: fetch existing row
        try {
          const { data: existingRows, error: fetchErr } = await supabase
            .from("lost_items")
            .select("id, public_id, mail_sent, created_at")
            .eq("fingerprint", fingerprint)
            .order("created_at", { ascending: false })
            .limit(1);

          if (fetchErr) {
            console.error("Supabase fetch after unique violation failed:", fetchErr);
          }

          const existing = Array.isArray(existingRows) ? (existingRows[0] as any) : null;
          if (existing) {
            return handleExistingRow(existing);
          }
        } catch (r) {
          console.error("Exception during recovery read after insert unique:", r);
        }
      }

      console.error("Supabase insert error:", insErr);
      return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });
    }

    // NEW: trigger slug generation (non bloquant)
    await triggerSlugGeneration(req, String(insData.id));

    // send confirmation email once (user) — avec recheck
    if (other.email || email) {
      try {
        const shouldSend = await canSendUserMail(supabase, String(insData.id));
        if (shouldSend) {
          const base = getBaseUrl(req);
          const contributeUrl = `${base}/report?go=contribute&rid=${insData.id}`;

          const ref5 = getReferenceCode(insData.public_id, String(insData.id));
          const referenceLine = `Reference code: ${ref5}\n`;

          const text = `Hello ${other.first_name || ""},

We have saved your lost item report draft on reportlost.org.

To publish it and start the search, please complete the secure payment (you can choose your search level on the next page).

Your report details:
- Item: ${other.title || ""}
- Date: ${other.date || ""}
- City: ${other.city || ""}
${referenceLine}
${contributeUrl}

Payments are processed securely by Stripe (PCI DSS v4.0). Once the payment is confirmed, your report will be published and alerts will be activated.

Thank you for using ReportLost.`;

          const site = getBaseUrl(req);
          const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">✅ Publish your report to start the search</p>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55;background:#fff">
    <p style="margin:0 0 12px">Hello <b>${other.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">
      We have saved your lost item report <em>draft</em> on
      <a href="${site}" style="color:#2C7A4A;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">
      To publish it and start the search, please complete the secure payment.
      You will be able to choose your search level on the next page.
    </p>

    <p style="margin:0 0 8px"><b>Your report details</b></p>
    <ul style="margin:0 16px 18px;padding-left:18px">
      <li><b>Item:</b> ${other.title || ""}</li>
      <li><b>Date:</b> ${other.date || ""}</li>
      <li><b>City:</b> ${other.city || ""}</li>
      <li><b>Reference code:</b> ${ref5}</li>
    </ul>

    <p style="margin:0 0 18px">
      <a href="${contributeUrl}"
         style="display:inline-block;background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
        Proceed to secure payment
      </a>
    </p>

    <p style="margin:0 0 8px;font-size:13px;color:#374151">
      Payments are processed securely by Stripe (PCI DSS v4.0). Once the payment is confirmed, your report will be published and alerts will be activated.
    </p>
  </div>
</div>`;

          const okUser = await sendMailViaApi(req, {
            to: other.email || email || "",
            subject: "Publish your report to start the search",
            text,
            html,
          });

          if (okUser) {
            try {
              await supabase.from("lost_items").update({ mail_sent: true }).eq("id", insData.id);
              console.log("✅ Confirmation email sent and mail_sent persisted for", insData.id);
            } catch (e) {
              console.warn("Could not persist mail_sent flag for new insert:", e);
            }
          } else {
            console.error("❌ Confirmation email sending failed for new insert", insData.id);
          }
        } else {
          console.log("⏭️ Mail already sent earlier, skipping for", insData.id);
        }
      } catch (err) {
        console.error("❌ Email confirmation deposit failed for new insert:", err);
      }
    }

    // --- Support notification (fire & forget robuste) ---
    (() => {
      try {
        const subjectBase = `Lost item : ${other.title || "Untitled"}`;
        const subject = other.city ? `${subjectBase} à ${other.city}` : subjectBase;
        const dateAndSlot = [other.date, other.time_slot].filter(Boolean).join(" ");
        const reference = getReferenceCode(insData.public_id, String(insData.id));
        const createdAt = (insData as any).created_at || new Date().toISOString();
        const bodyText = `Report: ${insData.id}
City: ${other.city || ""}
State: ${state_id || ""}
Reference: ${reference}

🕒 ${createdAt}

Lost item : ${other.title || ""}
Description : ${other.description || ""}
Date of lost : ${dateAndSlot}

If you think you found it, please contact : support@reportlost.org reference (${reference})

Contribution : ${other.contribution ?? 0}`;

        sendMailViaApi(req, {
          to: "support@reportlost.org",
          subject,
          text: bodyText,
        })
          .then((ok) =>
            console.log(ok ? "📨 Support email sent (insert)" : "❌ Support email failed (insert)"),
          )
          .catch((err) => console.error("❌ Support email throw (insert):", err));
      } catch (err) {
        console.error("❌ Support email failed for new insert:", err);
      }
    })();

    return NextResponse.json(
      { ok: true, action: "inserted", id: insData.id, public_id: insData.public_id },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("save-report unexpected error:", err);
    return NextResponse.json({ ok: false, error: "unexpected" }, { status: 500 });
  }
}
