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

export type FormDataType = {
  title: string;
  description: string;
  city: string;
  date: string;
  time_slot: string;
  loss_neighborhood: string;
  loss_street: string;

  transport: boolean;
  departure_place: string;
  arrival_place: string;
  departure_time: string;
  arrival_time: string;
  travel_number: string;

  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  signature: string;
  consent: boolean;
  contribution: number;

  isCellphone: boolean;
  phoneColor: string;
  phoneMaterial: string;
  phoneBrand: string;
  phoneModel: string;
  phoneSerial: string;
  phoneProof: string;
  phoneMark: string;
  phoneOther: string;

  photoFile: File | null;
  object_photo: string;
};

export default function ReportForm({
  defaultCity = '',
  enforceValidation = false,
  onBeforeSubmit
}: {
  defaultCity?: string;
  enforceValidation?: boolean;
  onBeforeSubmit?: (formData: FormDataType) => any;
}) {
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormDataType>({
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
    signature: '',
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

    photoFile: null,
    object_photo: ''
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    scrollToTop();
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
      formData.phoneOther && `Other: ${formData.phoneOther}`
    ].filter(Boolean);
    return parts.join(' | ');
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    const filePath = `object_photo/lost-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('images').upload(filePath, file);
    if (error) {
      console.error('❌ Error uploading image:', error.message);
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  };

  const saveReportToDatabase = async () => {
    const phoneDescription = buildPhoneDescription();

    let objectPhotoUrl = formData.object_photo;
    if (!objectPhotoUrl && formData.photoFile) {
      const uploadedUrl = await uploadImageToSupabase(formData.photoFile);
      if (uploadedUrl) objectPhotoUrl = uploadedUrl;
    }

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
      signature: formData.signature || null,

      phone_description: phoneDescription,
      object_photo: objectPhotoUrl || null
    };

    const cleaned = onBeforeSubmit ? onBeforeSubmit(payload as any) : payload;

    const { error } = await supabase.from('lost_items').insert([cleaned]);
    if (error) {
      console.error('❌ Supabase insert error:', error);
      alert('Unexpected error. Please try again later.');
      return false;
    }
    return true;
  };

  const handleNext = async (newAmount?: number) => {
    if (newAmount !== undefined) {
      setFormData((prev) => ({ ...prev, contribution: newAmount }));
    }

    if (enforceValidation && step === 1) {
      if (!formData.title?.trim() || !formData.description?.trim() || !formData.city?.trim() || !formData.date?.trim()) {
        alert('Please fill in all required fields.');
        return;
      }
    }

    if (enforceValidation && step === 2) {
      if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.email?.trim() || !formData.signature) {
        alert('Please complete all required contact details and accept the terms.');
        return;
      }
      const success = await saveReportToDatabase();
      if (!success) return;
    }

    scrollToTop();
    setStep((s) => s + 1);
  };

  const handleSuccessfulPayment = () => {
    alert('✅ Payment successful. Thank you for your contribution!');
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
