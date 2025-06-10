'use client';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReportFormStep2({ formData, onChange, onNext, onBack }: Props) {
  return (
    <div>
      {/* Formulaire ici */}
    </div>
  );
}

    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step 3: Your contact details</h2>

      <div>
        <label className="block font-medium">First name</label>
        <input
          name="firstName"
          onChange={onChange}
          value={formData.firstName || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Last name</label>
        <input
          name="lastName"
          onChange={onChange}
          value={formData.lastName || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Email address</label>
        <input
          type="email"
          name="email"
          onChange={onChange}
          value={formData.email || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Phone number (optional)</label>
        <input
          type="tel"
          name="phone"
          onChange={onChange}
          value={formData.phone || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Address (optional)</label>
        <input
          name="address"
          onChange={onChange}
          value={formData.address || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="consent"
          onChange={onChange}
          checked={formData.consent || false}
        />
        <label>
          I confirm I lost the item(s) or represent someone who did and agree to the processing of this information.
        </label>
      </div>

      <div className="flex justify-between">
        <button className="text-sm text-blue-600 underline" onClick={onBack}>
          &larr; Back
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
