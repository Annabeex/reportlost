// components/ReportForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
// import { supabase } from "@/lib/supabaseClient"; // <= intentionally not used from client
import { formatCityWithState, normalizeCityInput } from "@/lib/locationUtils";
import { useRouter } from "next/navigation";

import ReportFormStep1 from "./ReportFormStep1";
import ReportFormStep2 from "./ReportFormStep2";
import WhatHappensNext from "./WhatHappensNext";
import ReportContribution from "./ReportContribution";
import CheckoutForm from "./CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type ReportFormProps = {
  defaultCity?: string;
  enforceValidation?: boolean;
  onBeforeSubmit?: (formData: any) => any;
  onStepChange?: (step: number) => void; // ✅ NEW
  /** ⬅️ NEW: permet de pré-remplir la catégorie (ex: "wallet") */
  initialCategory?: string;
};

type EventLike =
  | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  | { target: { name: string; value: any; type?: string; checked?: boolean } };

function normalizeDbResult(resData: any) {
  if (resData == null) return null;
  if (Array.isArray(resData)) return resData[0] ?? null;
  return resData;
}

/** SHA-1 util (browser SubtleCrypto) -> hex */
async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Ref à 5 chiffres à partir d’un id (même logique modulo que côté serveur) */
async function refCode5FromId(input: string): Promise<string> {
  const hex = await sha1Hex(input);
  // prendre les 8 premiers hex (32 bits) -> modulo pour rester aligné
  const n = parseInt(hex.slice(0, 8), 16);
  return String((n % 90000) + 10000).padStart(5, "0");
}

/** Priorité au public_id si 5 chiffres, sinon fallback depuis id */
async function getReferenceCode(public_id: string | null | undefined, id: string): Promise<string> {
  if (public_id && /^\d{5}$/.test(public_id)) return public_id;
  return await refCode5FromId(id);
}

/**
 * Compute a stable fingerprint on client from canonicalized important fields.
 * Uses SubtleCrypto (browser). Returns hex SHA-1 (40 chars) to match server.
 */
async function computeFingerprint(payload: Record<string, any>): Promise<string> {
  const parts = [
    (payload.title ?? "").toString(),
    (payload.description ?? "").toString(),
    (payload.city ?? "").toString(),
    (payload.state_id ?? "").toString().toUpperCase(),
    (payload.date ?? "").toString(),
    (payload.email ?? "").toString().toLowerCase(),
  ];
  return sha1Hex(parts.join("|"));
}

export default function ReportForm({
  defaultCity = "",
  enforceValidation = false,
  onBeforeSubmit,
  onStepChange, // ✅ NEW
  initialCategory,          // ✅ NEW
}: ReportFormProps) {
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ anti double-submit (état)
  const submitLockRef = useRef(false); // ✅ anti double-submit (verrou mémoire)
  const formRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<any>(() => {
    const normalizedCity = normalizeCityInput(defaultCity);

    return {
      report_id: "",
      public_id: "",
      report_public_id: "",
      // ✅ NEW: champ catégorie (pré-rempli si fourni)
      category: (initialCategory || "").toString().trim().toLowerCase(),
      // ✅ NEW: code partenaire issu du QR (ex: "chicago-north")
      source_station: "",

      title: "",
      description: "",
      city: normalizedCity.label,
      state_id: normalizedCity.stateId,
      date: "",
      time_slot: "",
      loss_neighborhood: "",
      loss_street: "",
      transport: false,
      transport_answer: "",
      departure_place: "",
      arrival_place: "",
      departure_time: "",
      arrival_time: "",
      travel_number: "",
      transport_type: "",
      transport_type_other: "",

      airline_name: "",
      metro_line_known: null,   // boolean | null
      metro_line: "",
      train_company: "",
      rideshare_platform: "",
      taxi_company: "",
      circumstances: "",

      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      preferred_contact_channel: "",
      research_report_opt_in: null,

      contribution: 0,
      isCellphone: false,
      phoneColor: "",
      phoneMaterial: "",
      phoneBrand: "",
      phoneModel: "",
      phoneSerial: "",
      phoneProof: "",
      phoneMark: "",
      phoneOther: "",
      object_photo: "",
      consent: false,
      consent_contact: false,
      consent_terms: false,
      consent_authorized: false,
    };
  });

  // --- Mount-only logic (client) ---
  useEffect(() => {
    setIsClient(true);

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("go") === "contribute") setStep(4);
      const rid = params.get("rid") || localStorage.getItem("reportlost_rid") || "";
      if (rid) setFormData((p: any) => ({ ...p, report_id: rid }));

      // ✅ Bonus safe: si ?category=... dans l'URL et que le champ est vide, on le pose
      const catParam = (params.get("category") || "").trim().toLowerCase();
      if (catParam && !formData.category) {
        setFormData((p: any) => ({ ...p, category: catParam }));
      }

      // ✅ NEW: récupérer ?station=xxxx depuis l'URL du QR
      const st = (params.get("station") || "").trim().toLowerCase();
      if (st) {
        setFormData((p: any) => ({ ...p, source_station: st }));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ notify parent on step change
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const handleChange = (e: EventLike) => {
    if (!e?.target?.name) return;
    const { name, value, type, checked } = (e as any).target;
    setFormData((prev: any) => {
      const nextValue = type === "checkbox" ? !!checked : value;

      if (name === "city") {
        const normalized = normalizeCityInput(String(nextValue ?? ""));
        return {
          ...prev,
          city: normalized.label,
          state_id: normalized.stateId,
        };
      }

      if (name === "state_id") {
        const normalizedState =
          typeof nextValue === "string" ? nextValue.trim().toUpperCase() : "";
        return {
          ...prev,
          state_id: normalizedState || null,
        };
      }

      // ✅ ça couvrira aussi "category" et "source_station"
      return { ...prev, [name]: nextValue };
    });
  };

  const handleBack = () => {
    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth" });
    setStep((s) => Math.max(1, s - 1));
  };

  const buildPhoneDescription = () => {
    if (!formData.isCellphone) return null;
    const parts = [
      formData.phoneColor && `Color: ${formData.phoneColor}`,
      formData.phoneMaterial && `Material: ${formData.phoneMaterial}`,
      formData.phoneBrand && `Brand: ${formData.phoneBrand}`,
      formData.phoneModel && `Model: ${formData.phoneModel}`,
      formData.phoneSerial && `Serial: ${formData.phoneSerial}`,
      formData.phoneProof && `Proof: ${formData.phoneProof}`,
      formData.phoneMark && `Mark: ${formData.phoneMark}`,
      formData.phoneOther && `Other: ${formData.phoneOther}`,
    ].filter(Boolean);
    return parts.join(" • ");
  };

  /**
   * Save report using server endpoint /api/save-report
   * The server implements dedupe/fingerprint/update/insert and controls email sending.
   */
  const saveReportToDatabase = async () => {
    try {
      // ✅ anti double-submit (verrou local mémoire + état UI)
      if (submitLockRef.current) return false;
      submitLockRef.current = true;
      setIsSubmitting(true);

      const phoneDescription = buildPhoneDescription();
      const object_photo = formData.object_photo || null;

      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact && formData.consent_terms && formData.consent_authorized)
      );

      const normalizedCity = normalizeCityInput(formData.city);
      if (!normalizedCity.city) {
        alert("Please select the city where the item was lost.");
        return false;
      }

      const explicitState =
        typeof formData.state_id === "string" ? formData.state_id.trim().toUpperCase() : "";
      const fallbackState =
        typeof normalizedCity.stateId === "string"
          ? normalizedCity.stateId.trim().toUpperCase()
          : "";
      const finalStateId = explicitState || fallbackState;

      if (!finalStateId) {
        alert(
          'Please specify the state for the city (e.g., select a suggestion like "Chicago (IL)").',
        );
        return false;
      }

      const cityDisplay = formatCityWithState(normalizedCity.label, finalStateId);

      // utilitaire léger pour convertir "" -> null

const toNull = (v: any) => (v === "" || v === undefined ? null : v);

const payload = {
  // ✅ on envoie aussi la catégorie
  category: toNull(
    (formData.category || "").toString().trim().toLowerCase()
  ),
  // ✅ NEW: code partenaire issu du QR (ex: "chicago-north")
  source_station: toNull(
    (formData.source_station || "").toString().trim().toLowerCase()
  ),

  title: toNull(formData.title),
  description: toNull(formData.description),
  city: cityDisplay || null,
  state_id: finalStateId,
  date: toNull(formData.date),
  time_slot: toNull(formData.time_slot),
  loss_neighborhood: toNull(formData.loss_neighborhood),
  loss_street: toNull(formData.loss_street),

  // === Nouveaux champs: contexte / transport / lieu ===
  transport_answer: toNull(formData.transport_answer),
  transport_type: toNull(formData.transport_type),
  transport_type_other: toNull(formData.transport_type_other),
  place_type: toNull(formData.place_type),
  place_type_other: toNull(formData.place_type_other),
  airline_name: toNull(formData.airline_name),
  metro_line_known: formData.metro_line_known ?? null,
  metro_line: toNull(formData.metro_line),
  train_company: toNull(formData.train_company),
  rideshare_platform: toNull(formData.rideshare_platform),
  taxi_company: toNull(formData.taxi_company),
  circumstances: toNull(formData.circumstances),

  // === Trajet ===
  departure_place: toNull(formData.departure_place),
  arrival_place: toNull(formData.arrival_place),
  departure_time: toNull(formData.departure_time),
  arrival_time: toNull(formData.arrival_time),
  travel_number: toNull(formData.travel_number),

  // === Contact ===
  email: String(formData.email || ""),
  first_name: String(formData.first_name || ""),
  last_name: String(formData.last_name || ""),
  phone: toNull(formData.phone),
  address: toNull(formData.address),

  // === Préférences ===
  preferred_contact_channel: toNull(formData.preferred_contact_channel),
  research_report_opt_in: formData.research_report_opt_in ?? null,

  contribution: formData.contribution ?? 0,
  consent: consentOK,
  phone_description: toNull(phoneDescription),
  object_photo,
};

const cleaned = onBeforeSubmit ? onBeforeSubmit(payload) : payload;

// compute fingerprint client-side so server and client fingerprint match
const fingerprint = await computeFingerprint(cleaned);

// ✅ éviter plusieurs POST identiques dans la même session
try {
  const prev = localStorage.getItem("rl_pending_fp");
  if (prev === fingerprint) {
    return true; // déjà en cours/traité côté client
  }
  localStorage.setItem("rl_pending_fp", fingerprint);
} catch {}

// build body to POST to server endpoint
const bodyToSend: Record<string, any> = {
  ...cleaned,
  fingerprint,
};

// include report_id if we already have one (update flow)
// ONLY send report_id if it *looks like a UUID*
if (formData.report_id) {
  const candidate = String(formData.report_id).trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(candidate)) {
    bodyToSend.report_id = candidate;
  } else if (formData.public_id) {
    bodyToSend.report_public_id = String(formData.public_id);
  } else {
    console.warn("Not sending report_id because it is not a UUID:", candidate);
  }
}

// — avant l'appel fetch —
const controller = new AbortController();
const timeoutMs = 20000; // ⬆️ passe de 8000 à 20000
const timeout = setTimeout(() => controller.abort(), timeoutMs);

let res: Response;
try {
  res = await fetch("/api/save-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyToSend),
    signal: controller.signal,
  });
} catch (e: any) {
  // 🔁 petit retry si c’est un AbortError
  if (e?.name === "AbortError") {
    const controller2 = new AbortController();
    const retryTimeout = setTimeout(() => controller2.abort(), 20000);
    try {
      res = await fetch("/api/save-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
        signal: controller2.signal,
      });
    } finally {
      clearTimeout(retryTimeout);
    }
  } else {
    throw e;
  }
} finally {
  clearTimeout(timeout);
}

// Diagnostic: if non-ok, lire et afficher le body (json ou texte)
if (!res.ok) {
  const contentType = res.headers.get("content-type") || "";
  let bodyText = "";
  try {
    if (contentType.includes("application/json")) {
      const j = await res.json().catch(() => null);
      bodyText = JSON.stringify(j, null, 2);
    } else {
      bodyText = await res.text().catch(() => "");
    }
  } catch (e) {
    bodyText = String(e);
  }
  console.error("❌ /api/save-report non-ok:", res.status, bodyText);
  alert(`Server error (${res.status}): ${bodyText || res.statusText}`);
  return false;
}

// Parse successful response; guard against invalid JSON
let jsonRes: any = null;
try {
  jsonRes = await res.json();
} catch (e) {
  const txt = await res.text().catch(() => "");
  console.error("❌ /api/save-report returned invalid JSON:", txt, e);
  alert("Server returned invalid response. Voir console pour détails.");
  return false;
}

if (!jsonRes || !jsonRes.ok) {
  console.error("❌ /api/save-report error payload:", jsonRes);
  alert(`Unexpected database error: ${jsonRes?.error || "unknown"}`);
  return false;
}

const returnedId = jsonRes.id?.toString?.() || "";
const returnedPublicId = jsonRes.public_id || "";

// persist to client state + localStorage
setFormData((p: any) => ({
  ...p,
  report_id: returnedId || p.report_id,
  public_id: returnedPublicId || p.public_id,
  report_public_id: returnedPublicId || p.report_public_id,
  city: cityDisplay,
  state_id: finalStateId,
}));

try {
  if (returnedId) localStorage.setItem("reportlost_rid", returnedId);
  if (returnedPublicId) localStorage.setItem("reportlost_public_id", returnedPublicId);
} catch {
  /* ignore */
}

// === NOTE: pas de génération/redirect de slug ici.

return true;

       } catch (err: any) {
      if (err?.name === "AbortError") {
        console.error("❌ /api/save-report timed out");
        alert("Request timed out. Please try again.");
        return false;
      }
      console.error("💥 Unexpected error while saving report (client):", err);
      alert(`Unexpected error. Voir la console pour plus d'infos: ${String(err?.message || err)}`);
      return false;
    } finally {
      // ✅ relâche le verrou après un court délai pour éviter les rafales
      setTimeout(() => {
        submitLockRef.current = false;
        setIsSubmitting(false);
        try { localStorage.removeItem("rl_pending_fp"); } catch {}
      }, 3000);
    }
  };


  // --- navigation / step logic ---
  const handleNext = async () => {
    // Step 1 validation
    if (enforceValidation && step === 1) {
      if (
        !formData.title?.trim() ||
        !formData.description?.trim() ||
        !formData.city?.trim() ||
        !formData.date?.trim()
      ) {
        alert("Please fill in all required fields.");
        return;
      }
    }

    // Step 2: personal info + submit to DB
    if (enforceValidation && step === 2) {
      if (isSubmitting) return; // ✅ déjà en cours

      if (!formData.first_name?.trim()) {
        alert("Please enter your first name.");
        return;
      }
      if (!formData.last_name?.trim()) {
        alert("Please enter your last name.");
        return;
      }
      if (!formData.email?.trim()) {
        alert("Please enter your email.");
        return;
      }

      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact && formData.consent_terms && formData.consent_authorized)
      );

      if (!consentOK) {
        alert("Please confirm all required checkboxes.");
        return;
      }

      const success = await saveReportToDatabase();
      if (!success) return;
    }

    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth" });
    setStep((s) => s + 1);
  };

  const handleSuccessfulPayment = async () => {
    // We don't write to DB from client here — Stripe webhook on server updates DB and sends confirmation.
    alert("✅ Payment successful. Thank you for your contribution!");
  };

  // ✅ envoi email “free submission” une seule fois (NOUVEAU CONTENU)
const [freeEmailSent, setFreeEmailSent] = useState(false);
  useEffect(() => {
    const shouldSend =
      isClient &&
      step === 5 &&
      Number(formData.contribution) <= 0 &&
      !freeEmailSent &&
      formData?.email;

    if (!shouldSend) return;

    (async () => {
      try {
        const base =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (typeof window !== "undefined" ? window.location.origin : "https://reportlost.org");

        const ref5 = await getReferenceCode(
          String(formData.report_public_id || formData.public_id || ""),
          String(formData.report_id || "")
        );

        // 🔄 Nouveau modèle
        const subject = "Your report is live — start the active search today";

        const contributeUrl = `${base}/report?go=contribute&rid=${encodeURIComponent(
          String(formData.report_id || "")
        )}`;

        // 🔗 Nouvelle URL pour la page "Maximum search"
        const maximumUrl = `${base}/maximum-search`;

        // Preheader (affiché par certains clients)
        const preheader =
          "We’ll contact local lost-and-found desks and search large databases for you when you activate your search.";

        const text = `Hello ${formData.first_name || ""},

We’ve published your lost item report on reportlost.org.

Item: ${formData.title || ""}
Date: ${formData.date || ""}
City: ${formData.city || ""}
Reference code: ${ref5}

Why activate your search now?
In the first 48 hours, items move quickly between locations. When you activate, our team will:
• Notify and follow up with local Lost & Found desks (transit, venues, and other likely locations) on your behalf.
• Search across large databases and public listings relevant to your case.
• Set up targeted alerts and outreach to increase your chances of being contacted if a match appears.

Activate my search: ${contributeUrl}

Included with “Maximum search”: prevention kit & secure stickers
You’ll receive a printable (PDF) with secure ID stickers for your everyday items (luggage, keys, phone, bottle,…).
Each sticker routes finders to a private, dedicated address we host for you — so people can contact you
without your personal email or phone appearing on the object.

See what’s included: ${maximumUrl}

You can manage or update your report any time using the link in this email.

Thank you for using ReportLost — we’re here to help.
— The ReportLost Team`;

       const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff">
  <!-- Hidden preheader -->
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}
  </div>

  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">Your report is live — start the active search today</p>
  </div>

  <div style="padding:20px;color:#111827;line-height:1.6">
    <p style="margin:0 0 12px">Hello <b>${formData.first_name || ""}</b>,</p>

    <p style="margin:0 0 12px">
      We’ve published your lost item report on
      <a href="${base}" style="color:#2C7A4A;text-decoration:underline">reportlost.org</a>.
    </p>

    <ul style="margin:0 0 16px;padding-left:18px">
      <li><b>Item:</b> ${formData.title || ""}</li>
      <li><b>Date:</b> ${formData.date || ""}</li>
      <li><b>City:</b> ${formData.city || ""}</li>
      <li><b>Reference code:</b> ${ref5}</li>
    </ul>

    <p style="margin:14px 0 6px"><b>Why activate your search now?</b></p>
    <p style="margin:0 0 10px">
      In the first 48 hours, items move quickly between locations. When you activate, our team will:
    </p>
    <ul style="margin:0 0 18px;padding-left:18px">
      <li>Notify and follow up with local Lost &amp; Found desks (transit, venues, and other likely locations) on your behalf.</li>
      <li>Search across large databases and public listings relevant to your case.</li>
      <li>Set up targeted alerts and outreach to increase your chances of being contacted if a match appears.</li>
    </ul>

    <div style="margin:18px 0 22px;text-align:center">
      <a href="${contributeUrl}"
         style="display:inline-block;background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
        Activate my search
      </a>
    </div>

    <p style="margin:18px 0 6px"><b>Included with “Maximum search”: prevention kit &amp; secure stickers</b></p>
    <p style="margin:0 0 10px">
      You’ll receive a printable (PDF) with secure ID stickers for your everyday items (luggage, keys, phone, bottle,…).
      Each sticker routes finders to a <b>private, dedicated address we host for you</b> — so people can contact you
      <b>without your personal email or phone appearing on the object</b>. It’s safer, and it makes returns easier next time.
    </p>

    <p style="margin:0 0 18px;text-align:center">
      <a href="${contributeUrl}" style="color:#2C7A4A;text-decoration:underline;font-weight:600">See what’s included</a>
    </p>

    <p style="margin:0 0 10px">You can manage or update your report any time using the link in this email.</p>

    <p style="margin:18px 0 0;color:#6b7280">Thank you for using ReportLost — we’re here to help.<br/>— The ReportLost Team</p>
  </div>
</div>`;

        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 15000);

        await fetch(`${base}/api/send-mail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formData.email,
            subject,
            text,
            html,
            fromName: "ReportLost",
            // ✅ pour marquer followup_email_sent* en DB (via /api/send-mail)
            publicId: ref5,
            kind: "publication", // ✅ explicite : ce n’est PAS un follow-up manuel
          }),
          signal: controller.signal,
        }).catch(() => { /* on ne bloque pas l’UX si l’envoi échoue */ });

        clearTimeout(t);
        setFreeEmailSent(true);
      } catch {
        // soft-fail
      }
    })();
  }, [
    isClient,
    step,
    formData.contribution,
    formData.email,
    formData.first_name,
    formData.title,
    formData.date,
    formData.city,
    formData.report_id,
    formData.report_public_id,
    freeEmailSent,
  ]);

  // ✅ Montant pour Stripe Elements (en cents, min $1)
  const contributionUsd = Number(formData.contribution || 0);
  const amountCents = Math.max(100, Math.round(contributionUsd * 100));

  // Helper pour lien "Activate my search" dans l'UI Step 5 (free)
  const base =
    (typeof window !== "undefined" && window.location.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://reportlost.org";
  const contributeUrl = `${base}/report?go=contribute&rid=${encodeURIComponent(
    String(formData.report_id || "")
  )}`;

  return (
    <main ref={formRef} className="w-full min-h-screen px-4 py-6 space-y-4">
      {step === 1 && (
        <ReportFormStep1 formData={formData} onChange={handleChange} onNext={handleNext} />
      )}

      {step === 2 && (
        <ReportFormStep2
          formData={formData}
          setFormData={setFormData}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          isSubmitting={isSubmitting}   // ✅ passe l’état à Step2
        />
      )}

      {step === 3 && (
        <WhatHappensNext formData={formData} onNext={handleNext} onBack={handleBack} />
      )}

      {step === 4 && (
        <ReportContribution
          amount={Number(formData.contribution ?? 0)}
          setFormData={setFormData}
          onBack={handleBack}
          onNext={handleNext}
        />
      )}

      {step === 5 && (
        Number(formData.contribution) <= 0 || formData?.paymentRequired === false ? (
          // ✅ Pas de paiement si 0 : message de confirmation + (email envoyé par l’effet au-dessus)
          <section className="w-full min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold mb-4">Your report is published</h2>
            <p className="text-gray-700 mb-4">
              Thanks! Your report has been saved and published in our public database.
              You can upgrade to a higher assistance level anytime via the confirmation email we sent.
            </p>

            {/* ✅ Bouton "Activate my search" vers la page de contribution */}
            <div className="flex items-center gap-3 mt-4">
              <a
                href={contributeUrl}
                className="inline-flex items-center px-4 py-2 rounded-md bg-green-700 text-white hover:bg-green-800 font-semibold"
              >
                Activate my search
              </a>
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
              >
                ← Back
              </button>
            </div>
          </section>
        ) : (
          // ✅ Paiement si contribution > 0
          <section className="w-full min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold mb-4">Activate your search</h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                amount={Number(formData.contribution || 0)}
                reportId={String(formData.report_id || "")}
                onSuccess={handleSuccessfulPayment}
                onBack={handleBack}
                // Libellé exact selon le niveau (15 / 30)
                tierLabel={
                  Number(formData.contribution) >= 30
                    ? "Complete assistance"
                    : Number(formData.contribution) >= 15
                    ? "Extended search"
                    : "Standard search"
                }
                key={`co-${formData.report_id}-${formData.contribution}`}
              />
            </Elements>
          </section>
        )
      )}
    </main>
  );
}