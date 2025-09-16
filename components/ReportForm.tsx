'use client';

import { useEffect, useRef, useState } from 'react';
import ReportFormStep1 from './ReportFormStep1';
import ReportFormStep2 from './ReportFormStep2';
import WhatHappensNext from './WhatHappensNext';
import ReportContribution from './ReportContribution';
import CheckoutForm from './CheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

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
  defaultCity = '',
  enforceValidation = false,
  onBeforeSubmit,
}: ReportFormProps) {
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    city: defaultCity,
    date: '',
    time_slot: '',
    loss_neighborhood: '',
    loss_street: '',
    transport: false,
    departure_place: '',
    arrival_place: '',
    departure_time: '',
    arrival_time: '',
    travel_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    contribution: 0,
    isCellphone: false,
    phoneColor: '',
    phoneMaterial: '',
    phoneBrand: '',
    phoneModel: '',
    phoneSerial: '',
    phoneProof: '',
    phoneMark: '',
    phoneOther: '',
    object_photo: '',
    // ✅ flags UI pour les trois cases (peuvent aussi être ajoutés dynamiquement)
    consent: false,
    consent_contact: false,
    consent_terms: false,
    consent_authorized: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = (e: EventLike) => {
    if (!e?.target?.name) return;
    const { name, value, type, checked } = (e as any).target;
    const finalValue = type === 'checkbox' ? !!checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleBack = () => {
    scrollToTop();
    setStep((s) => Math.max(1, s - 1));
  };

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
    return parts.join(' | ');
  };

  const saveReportToDatabase = async () => {
    try {
      console.log('📥 formData brut reçu :', formData);

      const phoneDescription = buildPhoneDescription();
      const object_photo = formData.object_photo || null;

      // ✅ calcule un consent global robuste, même si `consent` n’a pas été posé
      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact && formData.consent_terms && formData.consent_authorized)
      );

      // contribution acceptée à 0 (ou adapte si ta table exige > 0)
      const safeContribution = formData.contribution ?? 0;

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
        email: String(formData.email || ''),
        first_name: String(formData.first_name || ''),
        last_name: String(formData.last_name || ''),
        phone: formData.phone || null,
        address: formData.address || null,
        contribution: safeContribution,
        // ✅ on n’envoie qu’une seule colonne boolean existante en base
        consent: consentOK,
        phone_description: phoneDescription || null,
        object_photo,
      };

      const cleanedPayload = onBeforeSubmit ? onBeforeSubmit(payload) : payload;

      console.log('🗃 Tentative enregistrement Supabase :', cleanedPayload);

      const { error } = await supabase.from('lost_items').insert([cleanedPayload]);

      if (error) {
        console.error('❌ Supabase insert error:', error.message, (error as any)?.details, (error as any)?.hint, (error as any)?.code);
        alert(`Unexpected database error: ${error.message}`);
        return false;
      }

      console.log('✅ Report enregistré avec succès.');

      // --- Envoi mail confirmation dépôt ---
      try {
        const res = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.email,
            subject: "✅ Your lost item report has been registered",
            text: `Hello ${formData.first_name},

We have received your lost item report on reportlost.org.

Details:
- Item: ${formData.title}
- Date: ${formData.date}
- City: ${formData.city}

Your report is published and automatic alerts are active.
➡️ To benefit from a 30-day manual follow-up, you can complete your contribution (10, 20 or 30 $).`,

            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
                <div style="background:#2563eb;color:#fff;padding:16px;text-align:center;">
                  <h2 style="margin:0;">ReportLost</h2>
                </div>
                <div style="padding:20px;color:#333;">
                  <p>Hello <b>${formData.first_name}</b>,</p>
                  <p>We have received your lost item report on <a href="https://reportlost.org">reportlost.org</a>.</p>
                  <p><b>Details of your report:</b><br>
                  - Item: ${formData.title}<br>
                  - Date: ${formData.date}<br>
                  - City: ${formData.city}</p>
                  <p>Your report is now published and automatic alerts are active.</p>
                  <p><a href="https://reportlost.org/contribute" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Upgrade with a contribution</a></p>
                  <p style="font-size:13px;color:#666;">Thank you for using ReportLost.</p>
                </div>
              </div>`,
          }),
        });

        const result = await res.json();
        console.log('📧 Résultat envoi mail:', result);
      } catch (err) {
        console.error('❌ Email confirmation deposit failed:', err);
      }

      return true;
    } catch (err) {
      console.error('💥 Unexpected error while saving report:', err);
      alert('Unexpected error. Please try again later.');
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
        alert('Please fill in all required fields.');
        return;
      }
    }

    if (enforceValidation && step === 2) {
      if (!formData.first_name?.trim()) {
        alert('Please enter your first name.');
        return;
      }
      if (!formData.last_name?.trim()) {
        alert('Please enter your last name.');
        return;
      }
      if (!formData.email?.trim()) {
        alert('Please enter your email.');
        return;
      }

      // ✅ nouvelle validation : accepte soit consent global, soit les 3 cases
      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact && formData.consent_terms && formData.consent_authorized)
      );

      if (!consentOK) {
        alert('Please confirm all required checkboxes.');
        return;
      }

      const success = await saveReportToDatabase();
      if (!success) return;
    }

    scrollToTop();
    setStep((s) => s + 1);
  };

  const handleSuccessfulPayment = async () => {
    alert('✅ Payment successful. Thank you for your contribution!');

    try {
      await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.email,
          subject: '💙 Thank you for supporting your report',
          text: `Hello ${formData.first_name},

We confirm we have received your contribution of $${formData.contribution}.

Your report now benefits from:
- A 30-day manual follow-up,
- Targeted distribution,
- Priority visibility and alerts.

Thank you for supporting ReportLost.`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
              <div style="background:#16a34a;color:#fff;padding:16px;text-align:center;">
                <h2 style="margin:0;">ReportLost</h2>
              </div>
              <div style="padding:20px;color:#333;">
                <p>Hello <b>${formData.first_name}</b>,</p>
                <p>We confirm we have received your contribution of <b>$${formData.contribution}</b>.</p>
                <ul>
                  <li>✅ 30-day manual follow-up</li>
                  <li>✅ Targeted distribution</li>
                  <li>✅ Priority visibility and alerts</li>
                </ul>
                <p>Our team will do its best to maximize the chances of recovering your item.</p>
                <p style="font-size:13px;color:#666;">Thank you for supporting ReportLost.</p>
              </div>
            </div>`,
        }),
      });
    } catch (err) {
      console.error('❌ Email confirmation payment failed:', err);
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
              onSuccess={handleSuccessfulPayment}
              onBack={handleBack}
            />
          </Elements>
        </div>
      )}
    </main>
  );
}

