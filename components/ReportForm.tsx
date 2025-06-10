'use client';

import { useState } from 'react';
import WhatHappensNext from './WhatHappensNext';
import ReportContribution from './ReportContribution';

interface Props {
  defaultCity?: string;
}

export default function ReportForm({ defaultCity = '' }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    city: defaultCity,
    item: '',
    description: '',
    date: '',
    timeSlot: '',
    isCellphone: false,
    contribution: 30,
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
    <div className="max-w-2xl mx-auto p-6">
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold">What did you lose in {defaultCity}?</h2>
          <input
            name="item"
            placeholder="e.g. Phone lost in JFK taxi"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <textarea
            name="description"
            placeholder="Additional description"
            onChange={handleChange}
            className="w-full border p-2 rounded mt-2"
          />
          <input
            name="date"
            type="date"
            onChange={handleChange}
            className="w-full border p-2 rounded mt-2"
          />
          <label className="block text-sm mt-4">Estimated time slot (optional)</label>
          <select
            name="timeSlot"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">--</option>
            <option value="12 AM–6 AM">12 AM–6 AM</option>
            <option value="6 AM–10 AM">6 AM–10 AM</option>
            <option value="10 AM–2 PM">10 AM–2 PM</option>
            <option value="2 PM–6 PM">2 PM–6 PM</option>
            <option value="6 PM–10 PM">6 PM–10 PM</option>
            <option value="10 PM–12 AM">10 PM–12 AM</option>
          </select>
          <label className="flex items-center gap-2 mt-4">
            <input type="checkbox" name="isCellphone" onChange={handleChange} />
            If you lost your cellphone, click yes
          </label>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <WhatHappensNext onNext={handleNext} onBack={handleBack} />
      )}

      {step === 3 && (
        <ReportContribution
          contribution={formData.contribution}
          onChange={handleChange}
          onSubmit={() => alert('TODO: Stripe integration')}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
