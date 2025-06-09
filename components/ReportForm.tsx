// ReportLost Multi-Step Form – Étapes 1 à 4 uniquement avec styles et logique adaptée
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
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-xl space-y-6">
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">What did you lose and where?</h2>
          <input name="category" placeholder="e.g. Phone lost in JFK taxi" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <textarea name="description" placeholder="Additional description" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input type="date" name="date" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <div>
            <label className="block font-medium mb-1">Estimated time slot (optional)</label>
            <select name="timeSlot" className="w-full border rounded px-3 py-2" onChange={handleChange}>
              <option value="">—</option>
              <option>12 AM–6 AM</option>
              <option>6 AM–12 PM</option>
              <option>12 PM–6 PM</option>
              <option>6 PM–12 AM</option>
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="lostPhone" onChange={handleChange} />
            <span>If you lost your cellphone, click yes</span>
          </label>
          {formData.lostPhone && (
            <div className="space-y-2">
              <input name="serial" placeholder="Serial or ID number (optional)" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="ownership" placeholder="Proof of ownership (optional)" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="identifier" placeholder="Identifying element (optional)" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="other" placeholder="Other details (optional)" className="w-full border rounded px-3 py-2" onChange={handleChange} />
            </div>
          )}
          <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Where did you likely lose it?</h2>
          <input name="probableLocation" placeholder="e.g. On the subway, in hotel lobby…" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <label className="block font-medium mb-1">Was it during transportation?</label>
          <select name="transport" className="w-full border rounded px-3 py-2" onChange={handleChange}>
            <option value="">No</option>
            <option value="train">Train</option>
            <option value="plane">Plane</option>
            <option value="bus">Bus</option>
            <option value="taxi">Taxi</option>
          </select>
          {formData.transport && (
            <div className="space-y-2">
              <input name="transportDeparture" placeholder="Departure station or airport" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="transportArrival" placeholder="Arrival station or airport" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="transportTimeStart" type="time" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="transportTimeEnd" type="time" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="transportNumber" placeholder="Flight or train number" className="w-full border rounded px-3 py-2" onChange={handleChange} />
            </div>
          )}
          <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Next</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your contact info</h2>
          <input name="firstName" placeholder="First Name" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="email" placeholder="Email" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="phone" placeholder="Phone Number" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="address" placeholder="Street Address" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="zip" placeholder="ZIP Code" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="country" placeholder="Country" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="gdprConsent" onChange={handleChange} />
            <span>I agree to the data protection policy.</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="termsConsent" onChange={handleChange} />
            <span>I agree to the terms of use.</span>
          </label>
          <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Next</button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Here’s what happens next</h2>
          <p className="text-gray-700">We analyze your report, contact appropriate services, anonymize and publish your declaration, and follow up for 30 days if needed.</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Your report is reviewed by a team member</li>
            <li>We search in lost & found databases and contact relevant services</li>
            <li>An anonymous email is created for contact</li>
            <li>We publish and share your notice across platforms</li>
          </ul>
          <button type="button" onClick={() => router.push('/report/contribution')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Continue</button>
        </div>
      )}
    </div>
  );
}