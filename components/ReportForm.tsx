// components/ReportForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabase";
import { formatCityWithState, normalizeCityInput } from "@/lib/locationUtils";
import { normalizePublicId, publicIdFromUuid } from "@/lib/reportId";

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
};

type EventLike =
  | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  | { target: { name: string; value: any; type?: string; checked?: boolean } };

export default function ReportForm({
  defaultCity = "",
  enforceValidation = false,
  onBeforeSubmit,
}: ReportFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<any>(() => {
    return {
      // Étape 1
      category: "",
      title: "",
      description: "",
      date: "",
      city: "",
      state_id: "",
      loss_neighborhood: "",
      loss_street: "",
      // Travel (si utilisé)
      departure_place: "",
      arrival_place: "",
      departure_time: "",
      arrival_time: "",
      travel_number: "",

      // Étape 2 (coordonnées)
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",

      // Contribution
      contribution: 0,

      // Téléphone (si catégorie téléphone)
      isCellphone: false,
      phoneColor: "",
      phoneMaterial: "",
      phoneBrand: "",
      phoneModel: "",
      phoneSerial: "",
      phoneProof: "",
      phoneMark: "",
      phoneOther: "",

      // Média
      object_photo: "",

      // Consentements
      consent: false,
      consent_contact: false,
      consent_terms: false,
      consent_authorized: false,

      // Références
      report_id: "",
      report_public_id: "",
    };
  });

  // Mount-only (client)
  useEffect(() => {
    setIsClient(true);

    // Préremplir la ville par défaut si fournie par la page
    if (defaultCity) {
      const normalized = normalizeCityInput(defaultCity);
      setFormData((p: any) => ({
        ...p,
        city: normalized.label,
        state_id: normalized.stateId,
      }));
    }

    // Récupérer rid/ref des paramètres d'URL / localStorage si présents
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("go") === "contribute") setStep(4);

      const rid = params.get("rid") || localStorage.getItem("reportlost_rid") || "";
      const publicRid =
        params.get("ref") || localStorage.getItem("reportlost_public_id") || "";

      if (rid) setFormData((p: any) => ({ ...p, report_id: rid }));
      if (publicRid)
        setFormData((p: any) => ({
          ...p,
          report_public_id: normalizePublicId(publicRid),
        }));
    } catch {
      // ignore
    }
  }, [defaultCity]);

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
          state_id: normalizedState,
        };
      }

      return {
        ...prev,
        [name]: nextValue,
      };
    });
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSuccessfulPayment = () => {
    // Après paiement, on peut rediriger ou afficher un message
    setStep(1);
  };

  const submitReport = async () => {
    if (submitting) return false;
    setSubmitting(true);

    try {
      // Validation minimale côté client
      if (enforceValidation) {
        if (!formData.title?.trim() || !formData.description?.trim() || !formData.city?.trim() || !formData.date?.trim()) {
          alert("Please fill in all required fields.");
          setSubmitting(false);
          return false;
        }
        if (!formData.first_name?.trim()) {
          alert("Please enter your first name.");
          setSubmitting(false);
          return false;
        }
      }

      const consentOK = !!formData.consent && !!formData.consent_terms;

      // Description téléphone compacte si utile
      const phoneBits = [
        formData.phoneBrand,
        formData.phoneModel,
        formData.phoneColor,
        formData.phoneMaterial,
        formData.phoneMark,
        formData.phoneOther,
      ]
        .filter(Boolean)
        .map((s: string) => String(s).trim());
      const phoneDescription = phoneBits.length ? phoneBits.join(", ") : null;

      // Photo éventuelle
      const object_photo = formData.object_photo || null;

      // Payload DB
      const payload = {
        category: formData.category || null,
        title: String(formData.title || ""),
        description: String(formData.description || ""),
        date: String(formData.date || ""),
        city: String(formData.city || ""),
        state_id: formData.state_id || null,
        loss_neighborhood: formData.loss_neighborhood || null,
        loss_street: formData.loss_street || null,
        departure_place: formData.departure_place || null,
        arrival_place: formData.arrival_place || null,
        departure_time: formData.departure_time || null,
        arrival_time: formData.arrival_time || null,
        travel_number: formData.travel_number || null,
        email: String(formData.email || ""),
        first_name: String(formData.first_name || ""),
        last_name: String(formData.last_name || ""),
        phone: formData.phone || null,
        address: formData.address || null,
        contribution: formData.contribution ?? 0,
        consent: consentOK,
        phone_description: phoneDescription,
        object_photo,
      };

      const cleaned = onBeforeSubmit ? onBeforeSubmit(payload) : payload;

      // Insert Supabase
      const { data, error } = await supabase
        .from("lost_items")
        .insert([cleaned])
        .select("id")
        .single();

      if (error || !data?.id) {
        if (error) console.error("❌ Supabase insert error:", error);
        alert("Unexpected error. Please try again later.");
        setSubmitting(false);
        return false;
      }

      const reportId = data.id as string;
      const publicId = publicIdFromUuid(reportId);

      // Persiste public_id (si pas de trigger SQL qui le fait déjà)
      try {
        const resp = await fetch("/api/report-public-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, publicId }),
        });
        if (!resp.ok) {
          console.warn("⚠️ Failed to persist public_id via API", { status: resp.status });
        }
      } catch (e) {
        console.warn("⚠️ Exception while persisting public_id:", e);
      }

      // État + stockage local pour l’UI et les emails
      setFormData((p: any) => ({
        ...p,
        report_id: reportId,
        report_public_id: publicId,
      }));

      try {
        localStorage.setItem("reportlost_rid", reportId);
        localStorage.setItem("reportlost_public_id", publicId ?? "");
      } catch {
        // ignore
      }

      // Emails
      const cityDisplay = formatCityWithState(formData.city, formData.state_id);
      const contributeUrl = `https://reportlost.org/report?go=contribute&rid=${reportId}`;
      const referenceLine = publicId ? `Reference code: ${publicId}\n` : "";

      // 1) Email utilisateur
      try {
        await fetch("/api/send-mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formData.email,
            subject: "✅ Your lost item report has been registered",
            text: `Hello ${formData.first_name},

We have received your lost item report on reportlost.org.

Your report is now published and automatic alerts are active.
➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).

Details of your report:
- Item: ${formData.title}
- Date: ${formData.date}
- City: ${cityDisplay}
${referenceLine}
${contributeUrl}
Thank you for using ReportLost.`,
            html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55">
    <p style="margin:0 0 12px">Hello <b>${formData.first_name}</b>,</p>
    <p style="margin:0 0 14px">
      We have received your lost item report on
      <a href="https://reportlost.org" style="color:#0f766e;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">
      Your report is now published and automatic alerts are active.
      <br/>➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).
    </p>
    <p style="margin:0 0 18px">
      <a href="${contributeUrl}" style="display:inline-block;background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Upgrade with a contribution
      </a>
    </p>
    <p style="margin:0 0 8px"><b>Details of your report</b></p>
    <ul style="margin:0 0 16px;padding-left:18px">
      <li><b>Item:</b> ${formData.title}</li>
      <li><b>Date:</b> ${formData.date}</li>
      <li><b>City:</b> ${cityDisplay}</li>
      ${publicId ? `<li><b>Reference code:</b> ${publicId}</li>` : ""}
    </ul>
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Thank you for using ReportLost.</p>
  </div>
</div>`,
          }),
        });
      } catch (err) {
        console.error("❌ Email confirmation deposit failed:", err);
      }

      // 2) Notification interne
      const notificationEmail = process.env.NEXT_PUBLIC_REPORT_NOTIFICATION_EMAIL;
      if (notificationEmail) {
        try {
          await fetch("/api/send-mail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: notificationEmail,
              subject: "🆕 Nouveau signalement ReportLost",
              text: "test",
              html: "<p>test</p>",
            }),
          });
        } catch (err) {
          console.error("❌ Email admin notification failed:", err);
        }
      }

      setSubmitting(false);
      return true;
    } catch (err) {
      console.error("💥 Unexpected error while saving report:", err);
      alert("Unexpected error. Please try again later.");
      setSubmitting(false);
      return false;
    }
  };

  const handleNext = async () => {
    if (step === 1 || step === 2 || step === 3) {
      if (step === 1 && enforceValidation) {
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
      if (step === 2 && enforceValidation) {
        if (!formData.first_name?.trim()) {
          alert("Please enter your first name.");
          return;
        }
      }
      setStep((s) => s + 1);
      return;
    }

    // Étape 4 → soumission (avant paiement)
    if (step === 4) {
      const ok = await submitReport();
      if (ok) setStep(5);
      return;
    }
  };

  if (!isClient) return null;

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
        />
      )}

      {step === 3 && (
        <WhatHappensNext formData={formData} onNext={handleNext} onBack={handleBack} />
      )}

      {step === 4 && (
        <ReportContribution
          contribution={formData.contribution}
          referenceCode={formData.report_public_id}
          setFormData={setFormData}
          onBack={handleBack}
          onNext={handleNext}
        />
      )}

      {step === 5 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Secure Payment</h2>
          <Elements stripe={stripePromise}>
            <CheckoutForm
              amount={formData.contribution}
              reportId={String(formData.report_id || "")}
              onSuccess={handleSuccessfulPayment}
              onBack={handleBack}
            />
          </Elements>
        </div>
      )}
    </main>
  );
}
