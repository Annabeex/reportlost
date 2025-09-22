"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReportFormStep1 from "./ReportFormStep1";
import ReportFormStep2 from "./ReportFormStep2";
import WhatHappensNext from "./WhatHappensNext";
import ReportContribution from "./ReportContribution";
import CheckoutForm from "./CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabase";

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
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Stripe: créé au client seulement
  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
    return key ? loadStripe(key) : null;
  }, []);

  const [formData, setFormData] = useState<any>({
    report_id: "",
    title: "",
    description: "",
    city: defaultCity,
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
  });

  useEffect(() => {
    setIsClient(true);

    // Lis les query params & localStorage uniquement côté client
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("go") === "contribute") setStep(4);

      const rid =
        params.get("rid") ||
        (typeof localStorage !== "undefined" ? localStorage.getItem("reportlost_rid") : "") ||
        "";

      if (rid) setFormData((p: any) => ({ ...p, report_id: rid }));
    } catch {
      // ignore
    }
  }, []);

  const handleChange = (e: EventLike) => {
    if (!e?.target?.name) return;
    const { name, value, type, checked } = (e as any).target;
    setFormData((prev: any) => ({ ...prev, [name]: type === "checkbox" ? !!checked : value }));
  };

  const handleBack = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
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

      const payload = {
        title: formData.title || null,
        description: formData.description || null,
        city: formData.city || null,
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

      const { data, error } = await supabase
        .from("lost_items")
        .insert([cleaned])
        .select("id")
        .single();

      if (error) {
        console.error("❌ Supabase insert error:", error);
        alert(`Unexpected database error: ${error.message}`);
        return false;
      }

      const reportId = data?.id;
      setFormData((p: any) => ({ ...p, report_id: reportId }));

      try {
        localStorage.setItem("reportlost_rid", String(reportId));
      } catch {
        /* ignore */
      }

      // Email de confirmation (ne bloque pas l’avancement)
      try {
        const contributeUrl = `https://reportlost.org/report?go=contribute&rid=${reportId}`;
        void fetch("/api/send-mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formData.email,
            subject: "✅ Your lost item report has been registered",
            text: `Hello ${formData.first_name}
We have received your lost item report on reportlost.org.
Your report is now published and automatic alerts are active.
➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).
Details of your report:
- Item: ${formData.title}
- Date: ${formData.date}
- City: ${formData.city}
https://reportlost.org/report?go=contribute&rid=${reportId}
Thank you for using ReportLost.`,
            html: `...same as before...`,
          }),
        });
      } catch (err) {
        console.error("❌ Email confirmation deposit failed:", err);
      }

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

    formRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // Évite tout rendu avant hydratation (empêche l'accès accidentel au navigateur)
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
      {step === 3 && <WhatHappensNext formData={formData} onNext={handleNext} onBack={handleBack} />}
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
          {stripePromise && (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                amount={formData.contribution}
                onSuccess={handleSuccessfulPayment}
                onBack={handleBack}
              />
            </Elements>
          )}
        </div>
      )}
    </main>
  );
}
