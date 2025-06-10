// ReportForm.tsx

'use client';

import { useState } from 'react';
import ReportFormStep1 from './ReportFormStep1';
import ReportFormStep2 from './ReportFormStep2';
import WhatHappensNext from './WhatHappensNext';
import ReportContribution from './ReportContribution';

export default function ReportForm({ defaultCity }: { defaultCity: string }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    city: defaultCity,
    item: '',
    description: '',
    date: '',
    timeSlot: '',
    isCellphone: false,
    phoneColor: '',
    phoneMaterial: '',
    phoneBrand: '',
    phoneModel: '',
    phoneSerial: '',
    phoneProof: '',
    phoneMark: '',
    phoneOther: '',
    lossCity: '',
    lossNeighborhood: '',
    lossStreet: '',
    transport: false,
    departurePlace: '',
    arrivalPlace: '',
    departureTime: '',
    arrivalTime: '',
    travelNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    consent: false,
    contribution: 30
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  return (
    <div className={step === 3 ? 'w-full min-h-screen p-8' : 'max-w-2xl mx-auto p-6'}>
      {step === 1 && (
        <ReportFormStep1
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <ReportFormStep2
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 3 && (
        <WhatHappensNext
          formData={formData}
          onNext={handleNext}
          onBack={handleBack}
          fullScreen
        />
      )}

      {step === 4 && (
        <ReportContribution
          contribution={formData.contribution}
          onChange={handleChange}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
