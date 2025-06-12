'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import ReportFormStep2 from '../../components/ReportFormStep2';
import ReportContribution from '../../components/ReportContribution';
import CheckoutForm from '../../components/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ReportPage() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    lossCity: '',
    lossNeighborhood: '',
    lossStreet: '',
    transport: false,
    departurePlace: '',
    arrivalPlace: '',
    departureTime: '',
    arrivalTime: '',
    travelNumber: '',
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
    <main className="w-full min-h-screen px-6 py-12">
      {step === 1 && (
        <ReportFormStep2
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 2 && (
        <ReportContribution
          contribution={formData.contribution}
          onChange={handleChange}
          onBack={handleBack}
          onNext={handleNext}
        />
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Secure Payment</h2>
          <Elements stripe={stripePromise}>
            <CheckoutForm amount={formData.contribution} />
          </Elements>
        </div>
      )}
    </main>
  );
}
