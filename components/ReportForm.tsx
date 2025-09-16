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

const MAIL_ENABLED = false;

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
    consent: false, // global unique
    contribution: 0, // ✅ plus de 15 par défaut
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
    // flags UI (non envoyés en BDD)
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

  const saveReportToDatabase = async ({ forceConsent }: { forceConsent?: boolean } = {}) => {
    try {
      console.log('📥 formData brut reçu :', formData);

      let phoneDescription;
      try {
        phoneDescription = buildPhoneDescription();
        console.log('📱 phoneDescription générée :', phoneDescription);
      } catch (err) {
        console.error('❌ Erreur dans buildPhoneDescription:', err);
        throw new Error('Erreur lors de la génération de la description du téléphone');
      }

      const object_photo = formData.object_photo || null;

      let payload;
      try {
        payload = {
          title: formData.title,
          description: formData.description,
          city: formData.city,
          date: formData.date,
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
          contribution: formData.contribution, // ✅ désormais choisi à l’étape 4
          consent:
            forceConsent ??
            !!(
              formData.consent ||
              (formData.consent_contact && formData.consent_terms && formData.consent_authorized)
            ),
          phone_description: phoneDescription,
          object_photo,
        };
        console.log('📦 payload préparé :', payload);
      } catch (err) {
        console.error('❌ Erreur pendant la création du payload:', err);
        throw new Error('Erreur lors de la préparation des données');
      }

      const cleanedPayload = onBeforeSubmit ? onBeforeSubmit(payload) : payload;

      console.log('🗃 Enregistrement Supabase avec cleanedPayload :', cleanedPayload);

      const { error } = await supabase.from('lost_items').insert([cleanedPayload]);
      if (error) {
        console.error('❌ Supabase insert error:', error);
        alert(`Unexpected error from database: ${error.message}`);
        return false;
      }

      console.log('✅ Report enregistré avec succès.');
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

      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact && formData.consent_terms && formData.consent_authorized)
      );

      if (!consentOK) {
        alert('Please confirm all required checkboxes.');
        return;
      }

      // 👇 On NE sauvegarde PAS encore : on attend le choix du forfait (step 4).
    }

    // Validation de l'étape 4 : un forfait doit être choisi
    if (enforceValidation && step === 4) {
      if (!formData.contribution || formData.contribution <= 0) {
        alert('Please choose a contribution level.');
        return;
      }

      // ✅ Maintenant on a tout (consent + contribution) → on enregistre
      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact && formData.consent_terms && formData.consent_authorized)
      );
      const success = await saveReportToDatabase({ forceConsent: consentOK });
      if (!success) return;
    }

    scrollToTop();
    setStep((s) => s + 1);
  };

  const handleSuccessfulPayment = async () => {
    alert('✅ Payment successful. Thank you for your contribution!');

    if (MAIL_ENABLED) {
      const safeClientData = {
        type: 'client-confirmation',
        data: {
          first_name: String(formData.first_name || ''),
          email: String(formData.email || ''),
        },
      };

      try {
        const res = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(safeClientData),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to send confirmation email');
        }
      } catch (err) {
        console.error('❌ Email client après paiement échoué :', err);
        alert('We could not send the confirmation email.');
      }
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
