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
    consent: false,
    contribution: 15,

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
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
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
      const phoneDescription = buildPhoneDescription();
      const object_photo = formData.object_photo || null;

      const payload = {
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
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        address: formData.address || null,
        contribution: formData.contribution,
        consent: formData.consent,
        phone_description: phoneDescription,
        object_photo,
      };

      const cleanedPayload = onBeforeSubmit ? onBeforeSubmit(payload) : payload;

      console.log('🗃 Enregistrement Supabase avec payload :', cleanedPayload);
      const { error } = await supabase.from('lost_items').insert([cleanedPayload]);
      if (error) {
        console.error('❌ Supabase insert error:', error);
        alert('Unexpected error while saving your report. Please try again later.');
        return false;
      }

      const safeData = {
        ...payload,
        date: new Date().toISOString(),
      };

      const filteredData = Object.fromEntries(
        Object.entries(safeData).filter(([_, value]) => {
          return (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null
          );
        })
      );

      const safePayload = {
        type: 'lost',
        data: filteredData,
      };

      console.log('📨 Envoi des données à /api/send-mail :', safePayload);

      try {
        const res = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(safePayload),
        });

        const result = await res.json();
        console.log('✅ Réponse API /api/send-mail :', result);

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Mail sending failed');
        }
      } catch (mailError) {
        console.error('❌ Erreur envoi mail:', mailError);
        alert('An error occurred while sending confirmation email. Please try again later.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('💥 Unexpected error while saving report:', err);
      alert('Unexpected error. Please try again later.');
      return false;
    }
  };

  const handleNext = async (newAmount?: number) => {
    if (newAmount !== undefined) {
      setFormData((prev: any) => ({ ...prev, contribution: newAmount }));
    }

    if (enforceValidation && step === 1) {
      if (!formData.title?.trim() || !formData.description?.trim() || !formData.city?.trim() || !formData.date?.trim()) {
        alert('Please fill in all required fields.');
        return;
      }
    }

    if (enforceValidation && step === 2) {
      if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.email?.trim() || !formData.consent) {
        alert('Please complete all required contact details and accept the terms.');
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

    const safeClientData = JSON.parse(JSON.stringify({
      type: 'client-confirmation',
      data: {
        first_name: formData.first_name,
        email: formData.email,
      },
    }));

    try {
      console.log('📧 Envoi confirmation client avec:', safeClientData);

      const res = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeClientData),
      });

      const result = await res.json();
      console.log('📩 Résultat envoi mail client :', result);

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to send confirmation email');
      }
    } catch (err) {
      console.error('❌ Email client après paiement échoué :', err);
      alert('We could not send the confirmation email. Please contact us if needed.');
    }
  };

  if (!isClient) return null;

  return (
    <main ref={formRef} className="w-full min-h-screen px-4 py-6 space-y-4">
      {step === 1 && <ReportFormStep1 formData={formData} onChange={handleChange} onNext={handleNext} />}
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
      {step === 4 && <ReportContribution contribution={formData.contribution} onBack={handleBack} onNext={handleNext} />}
      {step === 5 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Secure Payment</h2>
          <Elements stripe={stripePromise}>
            <CheckoutForm amount={formData.contribution} onSuccess={handleSuccessfulPayment} onBack={handleBack} />
          </Elements>
        </div>
      )}
    </main>
  );
}
