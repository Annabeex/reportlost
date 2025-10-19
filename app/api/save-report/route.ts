// app/api/save-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { publicIdFromUuid } from "@/lib/reportId";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function sendMailViaApi(payload: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
  replyTo?: string;
}) {
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://reportlost.org";
    const res = await fetch(`${site}/api/send-mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("sendMailViaApi error", e);
    return false;
  }
}

/** NEW: déclenche la génération/maj du slug pour un report donné (fire & forget) */
async function triggerSlugGeneration(id: string) {
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://reportlost.org";
    await fetch(`${site}/api/generate-report-slug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      // on laisse le server répondre, mais on ignore toute erreur
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });

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
    const toNull = (v: any) =>
      v === "" || v === undefined ? null : v;

    const toBoolOrNull = (v: any) => {
      if (v === true || v === false) return v;
      if (v === "true") return true;
      if (v === "false") return false;
      return v == null ? null : Boolean(v);
    };

    const allowedKeys = new Set<string>([
      // existants
      "title","description","city","state_id","date","time_slot",
      "loss_neighborhood","loss_street",
      "departure_place","arrival_place","departure_time","arrival_time","travel_number",
      "email","first_name","last_name","phone","address",
      "contribution","consent","phone_description","object_photo",
      // NOUVEAUX champs
      "transport_answer","transport_type","transport_type_other",
      "place_type","place_type_other","airline_name",
      "metro_line_known","metro_line","train_company",
      "rideshare_platform","taxi_company","circumstances",
      "preferred_contact_channel","research_report_opt_in",
      // identifiants/fingerprint (gérés à part mais on les laisse passer si déjà présents)
      "fingerprint","report_id","report_public_id",
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

    delete other.report_id;
    delete other.report_public_id;

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

      // ensure public_id
      let public_id = existing.public_id;
      if (!public_id) {
        public_id = publicIdFromUuid(existing.id) || null;
        if (public_id) {
          try {
            await supabase.from("lost_items").update({ public_id }).eq("id", existing.id);
          } catch (e) {
            console.warn("Could not persist computed public_id for existing row:", e);
          }
        }
      }

      // NEW: trigger slug generation (non bloquant)
      await triggerSlugGeneration(existing.id);

      // send confirmation to user only once (avec recheck)
      let mail_sent = !!existing.mail_sent;
      if (!mail_sent && (other.email || email)) {
        try {
          const shouldSend = await canSendUserMail(supabase, existing.id);
          if (shouldSend) {
            const site = process.env.NEXT_PUBLIC_SITE_URL || "https://reportlost.org";
            const contributeUrl = `${site}/report?go=contribute&rid=${existing.id}`;
            const referenceLine = public_id ? `Reference code: ${public_id}\n` : "";

            const text = `Hello ${other.first_name || ""},

We have received your lost item report on reportlost.org.

Your report is now published and automatic alerts are active.
➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).

Details of your report:
- Item: ${other.title || ""}
- Date: ${other.date || ""}
- City: ${other.city || ""}
${referenceLine}
${contributeUrl}

Thank you for using ReportLost.`;

            const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55">
    <p style="margin:0 0 12px">Hello <b>${other.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">
      We have received your lost item report on
      <a href="\${site}" style="color:#0f766e;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">
      Your report is now published and automatic alerts are active.
      <br/>➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).
    </p>
    <p style="margin:0 0 18px">
      <a href="\${contributeUrl}" style="display:inline-block;background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Upgrade with a contribution
      </a>
    </p>
    <p style="margin:0 0 8px"><b>Details of your report</b></p>
    <ul style="margin:0 0 16px;padding-left:18px">
      <li><b>Item:</b> ${other.title || ""}</li>
      <li><b>Date:</b> ${other.date || ""}</li>
      <li><b>City:</b> ${other.city || ""}</li>
      ${public_id ? `<li><b>Reference code:</b> ${public_id}</li>` : ""}
    </ul>
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Thank you for using ReportLost.</p>
  </div>
</div>`;

            const okUser = await sendMailViaApi({
              to: other.email || email || "",
              subject: "✅ Your lost item report has been registered",
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

      // notify support about the (updated) report
      try {
        const subjectBase = `Lost item : ${other.title || "Untitled"}`;
        const subject = other.city ? `${subjectBase} à ${other.city}` : subjectBase;
        const dateAndSlot = [other.date, other.time_slot].filter(Boolean).join(" ");
        const reference = public_id || "N/A";
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

        const okSupport = await sendMailViaApi({
          to: "support@reportlost.org",
          subject,
          text: bodyText,
        });

        if (!okSupport) {
          console.error("❌ sendMailViaApi returned false when sending support notification for (existing)", existing.id);
        } else {
          console.log("✅ Support notification sent for existing report", existing.id);
        }
      } catch (err) {
        console.error("❌ Email notification to support failed for existing row:", err);
      }

      return NextResponse.json({
        ok: true,
        action: "updated",
        id: existing.id,
        public_id,
        mail_sent,
        created_at: createdAt,
      }, { status: 200 });
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

        // ensure public_id exists
        let public_id = existing.public_id;
        if (!public_id) {
          public_id = publicIdFromUuid(clientProvidedId) || null;
          if (public_id) {
            try {
              await supabase.from("lost_items").update({ public_id }).eq("id", clientProvidedId);
            } catch (e) {
              console.warn("Could not persist computed public_id for clientProvidedId:", e);
            }
          }
        }

        // NEW: trigger slug generation (non bloquant)
        await triggerSlugGeneration(clientProvidedId);

        // send user confirmation if not already done (avec recheck)
        if (!existing.mail_sent && (other.email || email)) {
          try {
            const shouldSend = await canSendUserMail(supabase, clientProvidedId);
            if (shouldSend) {
              const site = process.env.NEXT_PUBLIC_SITE_URL || "https://reportlost.org";
              const contributeUrl = `${site}/report?go=contribute&rid=${clientProvidedId}`;
              const referenceLine = public_id ? `Reference code: ${public_id}\n` : "";

              const text = `Hello ${other.first_name || ""},

We have received your lost item report on reportlost.org.

Your report is now published and automatic alerts are active.
➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).

Details of your report:
- Item: ${other.title || ""}
- Date: ${other.date || ""}
- City: ${other.city || ""}
${referenceLine}
${contributeUrl}

Thank you for using ReportLost.`;

              const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55">
    <p style="margin:0 0 12px">Hello <b>${other.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">
      We have received your lost item report on
      <a href="\${site}" style="color:#0f766e;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">
      Your report is now published and automatic alerts are active.
      <br/>➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).
    </p>
    <p style="margin:0 0 18px">
      <a href="\${contributeUrl}" style="display:inline-block;background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Upgrade with a contribution
      </a>
    </p>
    <p style="margin:0 0 8px"><b>Details of your report</b></p>
    <ul style="margin:0 0 16px;padding-left:18px">
      <li><b>Item:</b> ${other.title || ""}</li>
      <li><b>Date:</b> ${other.date || ""}</li>
      <li><b>City:</b> ${other.city || ""}</li>
      ${public_id ? `<li><b>Reference code:</b> ${public_id}</li>` : ""}
    </ul>
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Thank you for using ReportLost.</p>
  </div>
</div>`;

              const okUser = await sendMailViaApi({
                to: other.email || email || "",
                subject: "✅ Your lost item report has been registered",
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

        // support notification for update
        try {
          const subjectBase = `Lost item : ${other.title || "Untitled"}`;
          const subject = other.city ? `${subjectBase} à ${other.city}` : subjectBase;
          const dateAndSlot = [other.date, other.time_slot].filter(Boolean).join(" ");
          const reference = public_id || "N/A";
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

          await sendMailViaApi({
            to: "support@reportlost.org",
            subject,
            text: bodyText,
          });

          console.log("✅ Support notification sent for updated report", clientProvidedId);
        } catch (err) {
          console.error("❌ Email notification to support failed for clientProvidedId:", err);
        }

        return NextResponse.json({ ok: true, action: "updated", id: clientProvidedId, public_id }, { status: 200 });
      }
    }

    // 2) Try to find existing by fingerprint
    const { data: foundRows, error: findErr } = await supabase
      .from("lost_items")
      .select("id, public_id, mail_sent, created_at")
      .eq("fingerprint", fingerprint)
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

    // ensure public_id persisted
    let public_id = insData.public_id;
    if (!public_id) {
      try {
        public_id = publicIdFromUuid(String(insData.id)) || null;
        if (public_id) {
          await supabase.from("lost_items").update({ public_id }).eq("id", insData.id);
        }
      } catch (e) {
        console.warn("Could not compute public_id:", e);
      }
    }

    // NEW: trigger slug generation (non bloquant)
    await triggerSlugGeneration(String(insData.id));

    // send confirmation email once (user) — avec recheck
    if (other.email || email) {
      try {
        const shouldSend = await canSendUserMail(supabase, String(insData.id));
        if (shouldSend) {
          const site = process.env.NEXT_PUBLIC_SITE_URL || "https://reportlost.org";
          const contributeUrl = `${site}/report?go=contribute&rid=${insData.id}`;
          const referenceLine = public_id ? `Reference code: ${public_id}\n` : "";

          const text = `Hello ${other.first_name || ""},

We have received your lost item report on reportlost.org.

Your report is now published and automatic alerts are active.
➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).

Details of your report:
- Item: ${other.title || ""}
- Date: ${other.date || ""}
- City: ${other.city || ""}
${referenceLine}
${contributeUrl}

Thank you for using ReportLost.`;

          const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55">
    <p style="margin:0 0 12px">Hello <b>${other.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">
      We have received your lost item report on
      <a href="\${site}" style="color:#0f766e;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">
      Your report is now published and automatic alerts are active.
      <br/>➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).
    </p>
    <p style="margin:0 0 18px">
      <a href="\${contributeUrl}" style="display:inline-block;background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Upgrade with a contribution
      </a>
    </p>
    <p style="margin:0 0 8px"><b>Details of your report</b></p>
    <ul style="margin:0 0 16px;padding-left:18px">
      <li><b>Item:</b> ${other.title || ""}</li>
      <li><b>Date:</b> ${other.date || ""}</li>
      <li><b>City:</b> ${other.city || ""}</li>
      ${public_id ? `<li><b>Reference code:</b> ${public_id}</li>` : ""}
    </ul>
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Thank you for using ReportLost.</p>
  </div>
</div>`;

          const okUser = await sendMailViaApi({
            to: other.email || email || "",
            subject: "✅ Your lost item report has been registered",
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

    // support notification (for new insert)
    try {
      const subjectBase = `Lost item : ${other.title || "Untitled"}`;
      const subject = other.city ? `${subjectBase} à ${other.city}` : subjectBase;
      const dateAndSlot = [other.date, other.time_slot].filter(Boolean).join(" ");
      const reference = public_id || "N/A";
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

      await sendMailViaApi({
        to: "support@reportlost.org",
        subject,
        text: bodyText,
      });

      console.log("✅ Support notification sent for new report", insData.id);
    } catch (err) {
      console.error("❌ Email notification to support failed for new insert:", err);
    }

    return NextResponse.json({ ok: true, action: "inserted", id: insData.id, public_id }, { status: 200 });
  } catch (err: any) {
    console.error("save-report unexpected error:", err);
    return NextResponse.json({ ok: false, error: "unexpected" }, { status: 500 });
  }
}
