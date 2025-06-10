'use client';

import { useState } from 'react';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onNext: () => void;
}

export default function ReportFormStep1({ formData, onChange, onNext }: Props) {
  const [showPhoneDetails, setShowPhoneDetails] = useState(formData.isCellphone);
  const [showTransportFields, setShowTransportFields] = useState(formData.transport === true);

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setShowPhoneDetails(e.target.name === 'isCellphone' && e.target.checked);
    setShowTransportFields(e.target.name === 'transport' && e.target.checked);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step 1: Describe the lost item</h2>

      <div>
        <label className="block font-medium">What did you lose and where?</label>
        <input
          name="item"
          placeholder="e.g. Phone lost in JFK Airport taxi"
          onChange={onChange}
          value={formData.item}
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
          {['12 AM–6 AM', '6 AM–10 AM', '10 AM–2 PM', '2 PM–6 PM', '6 PM–10 PM', '10 PM–12 AM'].map(slot => (
            <label key={slot} className="flex items-center gap-1">
              <input
                type="radio"
                name="timeSlot"
                value={slot}
                checked={formData.timeSlot === slot}
                onChange={onChange}
              />
              {slot}
            </label>
          ))}
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
          <div>
            <label className="block font-medium">Color</label>
            <input name="phoneColor" onChange={onChange} value={formData.phoneColor || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Material (optional)</label>
            <input name="phoneMaterial" onChange={onChange} value={formData.phoneMaterial || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Brand (optional)</label>
            <input name="phoneBrand" onChange={onChange} value={formData.phoneBrand || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Model (optional)</label>
            <input name="phoneModel" onChange={onChange} value={formData.phoneModel || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Identification number / Serial (optional)</label>
            <input name="phoneSerial" onChange={onChange} value={formData.phoneSerial || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Proof of ownership (if any)</label>
            <input name="phoneProof" onChange={onChange} value={formData.phoneProof || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Identifying element (sticker, engraving…)</label>
            <input name="phoneMark" onChange={onChange} value={formData.phoneMark || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Other details</label>
            <textarea name="phoneOther" onChange={onChange} value={formData.phoneOther || ''} className="w-full border p-2 rounded" />
          </div>
        </div>
      )}

      <hr className="my-6" />

      <h2 className="text-xl font-bold">Step 2: Where did the loss probably happen?</h2>

      <div>
        <label className="block font-medium">City</label>
        <input name="lossCity" onChange={onChange} value={formData.lossCity || ''} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block font-medium">Neighborhood (optional)</label>
        <input name="lossNeighborhood" onChange={onChange} value={formData.lossNeighborhood || ''} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block font-medium">Street (optional)</label>
        <input name="lossStreet" onChange={onChange} value={formData.lossStreet || ''} className="w-full border p-2 rounded" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="transport" onChange={handleCheckbox} checked={formData.transport} />
        <label>Was it during a transport (train, plane, bus, taxi)?</label>
      </div>

      {showTransportFields && (
        <div className="grid grid-cols-1 gap-4 border p-4 rounded bg-gray-50">
          <div>
            <label className="block font-medium">Place of departure</label>
            <input name="departurePlace" onChange={onChange} value={formData.departurePlace || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Place of arrival</label>
            <input name="arrivalPlace" onChange={onChange} value={formData.arrivalPlace || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Departure time</label>
            <input name="departureTime" type="time" onChange={onChange} value={formData.departureTime || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Arrival time</label>
            <input name="arrivalTime" type="time" onChange={onChange} value={formData.arrivalTime || ''} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Flight or Train number</label>
            <input name="travelNumber" onChange={onChange} value={formData.travelNumber || ''} className="w-full border p-2 rounded" />
          </div>
        </div>
      )}

      <button className="bg-blue-600 text-white px-4 py-2 rounded mt-6" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
