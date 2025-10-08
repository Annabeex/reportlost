// components/ReportForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabase";
import { formatCityWithState, normalizeCityInput } from "@/lib/locationUtils";
import { publicIdFromUuid } from "@/lib/reportId";

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

/** helper to normalize supabase-like results that can be array/object/null */
function normalizeDbResult(resData: any) {
  if (resData == null) return null;
  if (Array.isArray(resData)) return resData[0] ?? null;
  return resData;
}

/**
 * Compute a stable fingerprint on client from canonicalized important fields.
 * Uses SubtleCrypto (browser). Returns hex SHA-256.
 */
async function computeFingerprint(payload: Record<string, any>): Promise<string> {
  try {
    const s = [
      payload.title || "",
      payload.description || "",
      payload.city || "",
      payload.date || "",
      payload.time_slot || "",
      payload.phone || "",
      (payload.email || "").toLowerCase(),
    ].join("|").trim();

    const enc = new TextEncoder().encode(s);
    const hashBuf = await crypto.subtle.digest("SHA-256", enc);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    console.warn("Fingerprint compute failed, falling back to timestamp:", e);
    return `fallback-${Date.now()}`;
  }
}

export default function ReportForm({
  defaultCity = "",
  enforceValidation = false,
  onBeforeSubmit,
}: ReportFormProps) {
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<any>(() => {
    const normalizedCity = normalizeCityInput(defaultCity);

    return {
      report_id: "",
      public_id: "",
      report_public_id: "",
      title: "",
      description: "",
      city: normalizedCity.label,
      state_id: normalizedCity.stateId,
      date: "",
      time_slot: "",
      loss_neighborhood: "",
      loss_street: "",
      transport: false,
      departure_place: "",
      arrival_place: "",
      departure_time: "",
      arrival_time: "",
      travel_number: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
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
    } catch {
      /* ignore */
    }
  }, []);

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

  const saveReportToDatabase = async () => {
    try {
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
          "Please specify the state for the city (e.g., select a suggestion like \"Chicago (IL)\").",
        );
        return false;
      }

      const cityDisplay = formatCityWithState(normalizedCity.label, finalStateId);

      const payload = {
        title: formData.title || null,
        description: formData.description || null,
        city: cityDisplay || null,
        state_id: finalStateId,
        date: formData.date || null,
        time_slot: formData.time_slot || null,
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
        phone_description: phoneDescription || null,
        object_photo,
      };

      const cleaned = onBeforeSubmit ? onBeforeSubmit(payload) : payload;

      // compute fingerprint client-side to give server the same input
      const fingerprint = await computeFingerprint(cleaned);

      // Call centralized server endpoint to save (server handles dedupe + mail once)
      const bodyToSend = {
        ...cleaned,
        fingerprint,
        report_id: formData.report_id || null,
      };

      const res = await fetch("/api/save-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        console.error("Server save error:", json || res.statusText);
        alert(`Unexpected server error: ${json?.error || res.statusText || "save failed"}`);
        return false;
      }

      const reportId = String(json.id);
      const publicId = json.public_id || null;
      const createdAt = json.created_at || new Date().toISOString();

      // update client state/localStorage
      setFormData((p: any) => ({
        ...p,
        report_id: reportId,
        public_id: publicId ?? "",
        report_public_id: publicId ?? "",
        city: cityDisplay,
        state_id: finalStateId,
      }));

      try {
        localStorage.setItem("reportlost_rid", reportId);
        if (publicId) localStorage.setItem("reportlost_public_id", publicId);
      } catch {
        /* ignore */
      }

      // Server is responsible for sending emails (once). Client does not re-send.
      return true;
    } catch (err) {
      console.error("💥 Unexpected error while saving report:", err);
      alert("Unexpected error. Please try again later.");
      return false;
    }
  };

  const handleNext = async () => {
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

    if (enforceValidation && step === 2) {
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
    alert("✅ Payment successful. Thank you for your contribution!");
    try {
      if (formData.report_id) {
        await supabase
          .from("lost_items")
          .update({
            contribution: formData.contribution,
            paid: true,
            paid_at: new Date().toISOString(),
          })
          .eq("id", formData.report_id);
      }
    } catch (err) {
      console.error("❌ DB update after payment failed:", err);
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
