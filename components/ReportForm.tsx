// ReportLost Multi-Step Form – Étapes 1 à 4 uniquement
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  defaultCity: string;
}

export default function ReportForm({ defaultCity = '' }: Props) {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    date: '',
    timeSlot: '',
    lostPhone: false,
    serial: '',
    ownership: '',
    identifier: '',
    other: '',
    probableLocation: '',
    transport: '',
    transportDeparture: '',
    transportArrival: '',
    transportTimeStart: '',
    transportTimeEnd: '',
    transportNumber: '',
    cityLocation: '',
    neighborhood: '',
    street: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    zip: '',
    country: '',
    gdprConsent: false,
    termsConsent: false
  });

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleNext = () => setStep(step + 1);

  return (
    <div className="max-w-xl mx-auto p-4">
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">What did you lose and where?</h2>
          <input name="category" placeholder="e.g. Phone lost in JFK Airport taxi" className="input" onChange={handleChange} />
          <textarea name="description" placeholder="Additional description" className="input" onChange={handleChange} />
          <input type="date" name="date" className="input" onChange={handleChange} />
          <label className="block">Estimated time slot (optional)</label>
          <select name="timeSlot" onChange={handleChange} className="input">
            <option value="">—</option>
            <option>12 AM–6 AM</option>
            <option>6 AM–12 PM</option>
            <option>12 PM–6 PM</option>
            <option>6 PM–12 AM</option>
          </select>
          <label>If you lost your cellphone, click yes</label>
          <input type="checkbox" name="lostPhone" onChange={handleChange} />
          {formData.lostPhone && (
            <div className="space-y-2">
              <input name="serial" placeholder="Serial or ID number (optional)" className="input" onChange={handleChange} />
              <input name="ownership" placeholder="Proof of ownership (optional)" className="input" onChange={handleChange} />
              <input name="identifier" placeholder="Identifying element (optional)" className="input" onChange={handleChange} />
              <input name="other" placeholder="Other details (optional)" className="input" onChange={handleChange} />
            </div>
          )}
          <button type="button" onClick={handleNext} className="button">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Where did you likely lose it?</h2>
          <input name="probableLocation" placeholder="e.g. On the subway, in hotel lobby…" className="input" onChange={handleChange} />
          <label>Was it during transportation?</label>
          <select name="transport" onChange={handleChange} className="input">
            <option value="">No</option>
            <option value="train">Train</option>
            <option value="plane">Plane</option>
            <option value="bus">Bus</option>
            <option value="taxi">Taxi</option>
          </select>
          {formData.transport && (
            <div className="space-y-2">
              <input name="transportDeparture" placeholder="Departure station or airport" className="input" onChange={handleChange} />
              <input name="transportArrival" placeholder="Arrival station or airport" className="input" onChange={handleChange} />
              <input name="transportTimeStart" type="time" className="input" onChange={handleChange} />
              <input name="transportTimeEnd" type="time" className="input" onChange={handleChange} />
              <input name="transportNumber" placeholder="Flight or train number" className="input" onChange={handleChange} />
            </div>
          )}
          <button type="button" onClick={handleNext} className="button">Next</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your contact info</h2>
          <input name="firstName" placeholder="First Name" className="input" onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" className="input" onChange={handleChange} />
          <input name="email" placeholder="Email" className="input" onChange={handleChange} />
          <input name="phone" placeholder="Phone Number" className="input" onChange={handleChange} />
          <input name="address" placeholder="Street Address" className="input" onChange={handleChange} />
          <input name="zip" placeholder="ZIP Code" className="input" onChange={handleChange} />
          <input name="country" placeholder="Country" className="input" onChange={handleChange} />
          <label><input type="checkbox" name="gdprConsent" onChange={handleChange} /> I agree to the data protection policy.</label>
          <label><input type="checkbox" name="termsConsent" onChange={handleChange} /> I agree to the terms of use.</label>
          <button type="button" onClick={handleNext} className="button">Next</button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Here’s what happens next</h2>
          <p className="text-gray-700">We analyze your report, contact appropriate services, anonymize and publish your declaration, and follow up for 30 days if needed.</p>
          <button type="button" onClick={() => router.push('/report/contribution')} className="button">Continue</button>
        </div>
      )}
    </div>
  );
}
