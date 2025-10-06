'use client';

import { useState } from 'react';
import AutoCompleteCitySelect from '@/components/AutoCompleteCitySelect';
import { normalizeCityInput } from '@/lib/locationUtils';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onNext: () => void;
}

export default function ReportFormStep1({ formData, onChange, onNext }: Props) {
  const [showPhoneDetails, setShowPhoneDetails] = useState(!!formData.isCellphone);
  const [showLocationStep, setShowLocationStep] = useState(false);
  const [showTransportFields, setShowTransportFields] = useState(!!formData.transport);

  const today = new Date().toISOString().split('T')[0];

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (name === 'isCellphone') setShowPhoneDetails(checked);
    if (name === 'transport') setShowTransportFields(checked);
    // Propager aussi au parent
    onChange({ target: { name, value: checked } } as any);
  };

  if (showLocationStep) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Step 2: Where did the loss probably happen?</h2>

        <div>
          <label className="block font-medium">City</label>
          <AutoCompleteCitySelect
            value={formData.city || ''}
            onChange={(value: string) =>
              onChange({ target: { name: 'city', value } } as React.ChangeEvent<HTMLInputElement>)
            }
            onSelect={(city) => {
              onChange({
                target: {
                  name: 'city',
                  value: `${city.city_ascii} (${city.state_id})`,
                },
              } as React.ChangeEvent<HTMLInputElement>);
              onChange({
                target: { name: 'state_id', value: city.state_id },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
        </div>

        <div>
          <label className="block font-medium">Neighborhood (optional)</label>
          <input
            name="loss_neighborhood"
            onChange={onChange}
            value={formData.loss_neighborhood || ''}
            className="w-full border px-3 py-1.5 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Street (optional)</label>
          <input
            name="loss_street"
            onChange={onChange}
            value={formData.loss_street || ''}
            className="w-full border px-3 py-1.5 rounded"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="transport"
            name="transport"
            type="checkbox"
            onChange={handleCheckbox}
            checked={showTransportFields}
          />
          <label htmlFor="transport">Was it during a transport (train, plane, bus, taxi)?</label>
        </div>

        {showTransportFields && (
          <div className="grid grid-cols-1 gap-4 border p-4 rounded bg-gray-50">
            {([
              ['departure_place', 'Place of departure'],
              ['arrival_place', 'Place of arrival'],
              ['departure_time', 'Departure time'],
              ['arrival_time', 'Arrival time'],
              ['travel_number', 'Flight or Train number'],
            ] as const).map(([name, label]) => (
              <div key={name}>
                <label className="block font-medium">{label}</label>
                <input
                  name={name}
                  type={name.includes('time') ? 'time' : 'text'}
                  onChange={onChange}
                  value={formData[name] || ''}
                  className="w-full border px-3 py-1.5 rounded"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => setShowLocationStep(false)}
          >
            Back
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            onClick={() => {
              const normalized = normalizeCityInput(formData.city);

              if (normalized.label !== (formData.city || '')) {
                onChange({
                  target: { name: 'city', value: normalized.label },
                } as React.ChangeEvent<HTMLInputElement>);
              }

              const currentState = formData.state_id ?? null;
              if (currentState !== normalized.stateId) {
                onChange({
                  target: { name: 'state_id', value: normalized.stateId ?? '' },
                } as React.ChangeEvent<HTMLInputElement>);
              }

              onNext();
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step 1: Describe the lost item</h2>

      <div>
        <label className="block font-medium">What did you lose and where?</label>
        <input
          name="title"
          placeholder="e.g. Phone lost in JFK Airport taxi"
          onChange={onChange}
          value={formData.title || ''}
          className="w-full border px-3 py-1.5 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Please provide a detailed description</label>
        <textarea
          name="description"
          placeholder="Color, brand, unique features..."
          onChange={onChange}
          value={formData.description || ''}
          className="w-full border px-3 py-1.5 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Date of the loss</label>
        <input
          name="date"
          type="date"
          max={today}
          onChange={onChange}
          value={formData.date || ''}
          className="border px-3 py-1.5 rounded max-w-xs"
        />
      </div>

      <div>
        <label className="block font-medium">Estimated time slot (optional)</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {['12 AM–6 AM', '6 AM–10 AM', '10 AM–2 PM', '2 PM–6 PM', '6 PM–10 PM', '10 PM–12 AM'].map(
            (slot) => (
              <label key={slot} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="time_slot"
                  value={slot}
                  checked={formData.time_slot === slot}
                  onChange={onChange}
                />
                {slot}
              </label>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isCellphone"
          name="isCellphone"
          type="checkbox"
          onChange={handleCheckbox}
          checked={showPhoneDetails}
        />
        <label htmlFor="isCellphone">If you lost your cell phone, click yes</label>
      </div>

      {showPhoneDetails && (
        <div className="grid grid-cols-1 gap-4 border p-4 rounded bg-gray-50">
          <div>
            <label className="block font-medium">Description of the phone</label>
            <textarea
              name="phone_description"
              placeholder="Color, brand, model, case, proof of ownership, stickers, etc."
              onChange={onChange}
              value={formData.phone_description || ''}
              className="w-full border px-3 py-1.5 rounded"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          onClick={() => {
            if (
              !formData.title?.trim() ||
              !formData.description?.trim() ||
              !formData.date?.trim()
            ) {
              alert('Please fill in all required fields.');
              return;
            }
            setShowLocationStep(true);
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
