'use client'

import { useState } from 'react'
import AutoCompleteCitySelect from '@/components/AutoCompleteCitySelect'

interface Props {
  formData: any
  onChange: (e: React.ChangeEvent<any>) => void
  onNext: () => void
}

export default function ReportFormStep1({ formData, onChange, onNext }: Props) {
  const [showPhoneDetails, setShowPhoneDetails] = useState(formData.isCellphone)
  const [showLocationStep, setShowLocationStep] = useState(false)
  const [showTransportFields, setShowTransportFields] = useState(formData.transport)

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e)
    if (e.target.name === 'isCellphone') {
      setShowPhoneDetails(e.target.checked)
    }
    if (e.target.name === 'transport') {
      setShowTransportFields(e.target.checked)
    }
  }

  if (showLocationStep) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Step 2: Where did the loss probably happen?</h2>

        <div>
          <label className="block font-medium">City</label>
          <AutoCompleteCitySelect
            value={formData.city}
            onChange={(value: string) =>
              onChange({ target: { name: 'city', value } } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>

        <div>
          <label className="block font-medium">Neighborhood (optional)</label>
          <input
            name="loss_neighborhood"
            onChange={onChange}
            value={formData.loss_neighborhood || ''}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Street (optional)</label>
          <input
            name="loss_street"
            onChange={onChange}
            value={formData.loss_street || ''}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="transport"
            onChange={handleCheckbox}
            checked={formData.transport}
          />
          <label>Was it during a transport (train, plane, bus, taxi)?</label>
        </div>

        {showTransportFields && (
          <div className="grid grid-cols-1 gap-4 border p-4 rounded bg-gray-50">
            <div>
              <label className="block font-medium">Place of departure</label>
              <input
                name="departure_place"
                onChange={onChange}
                value={formData.departure_place || ''}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium">Place of arrival</label>
              <input
                name="arrival_place"
                onChange={onChange}
                value={formData.arrival_place || ''}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium">Departure time</label>
              <input
                type="time"
                name="departure_time"
                onChange={onChange}
                value={formData.departure_time || ''}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium">Arrival time</label>
              <input
                type="time"
                name="arrival_time"
                onChange={onChange}
                value={formData.arrival_time || ''}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium">Flight or Train number</label>
              <input
                name="travel_number"
                onChange={onChange}
                value={formData.travel_number || ''}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => setShowLocationStep(false)}
          >
            Back
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  // STEP 1 — Describe item
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step 1: Describe the lost item</h2>

      <div>
        <label className="block font-medium">What did you lose and where?</label>
        <input
          name="title"
          placeholder="e.g. Phone lost in JFK Airport taxi"
          onChange={onChange}
          value={formData.title}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Please provide a detailed description</label>
        <textarea
          name="description"
          placeholder="Color, brand, unique features..."
          onChange={onChange}
          value={formData.description}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Date of the loss</label>
        <input
          name="date"
          type="date"
          onChange={onChange}
          value={formData.date}
          className="w-full border p-2 rounded"
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
          type="checkbox"
          name="isCellphone"
          onChange={handleCheckbox}
          checked={formData.isCellphone}
        />
        <label>If you lost your cell phone, click yes</label>
      </div>

      {showPhoneDetails && (
        <div className="grid grid-cols-1 gap-4 border p-4 rounded bg-gray-50">
          {[
            { label: 'Color', name: 'phoneColor' },
            { label: 'Material (optional)', name: 'phoneMaterial' },
            { label: 'Brand (optional)', name: 'phoneBrand' },
            { label: 'Model (optional)', name: 'phoneModel' },
            { label: 'Identification number / Serial (optional)', name: 'phoneSerial' },
            { label: 'Proof of ownership (if any)', name: 'phoneProof' },
            { label: 'Identifying element (sticker, engraving…)', name: 'phoneMark' },
          ].map(({ label, name }) => (
            <div key={name}>
              <label className="block font-medium">{label}</label>
              <input
                name={name}
                onChange={onChange}
                value={formData[name] || ''}
                className="w-full border p-2 rounded"
              />
            </div>
          ))}
          <div>
            <label className="block font-medium">Other details</label>
            <textarea
              name="phoneOther"
              onChange={onChange}
              value={formData.phoneOther || ''}
              className="w-full border p-2 rounded"
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
              alert('Please fill in all required fields.')
              return
            }
            setShowLocationStep(true)
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
