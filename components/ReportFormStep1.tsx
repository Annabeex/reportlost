'use client';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onNext: () => void;
}

export default function ReportFormStep1({ formData, onChange, onNext }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">What did you lose and where?</h2>
      <input
        name="item"
        placeholder="e.g. Phone lost in JFK taxi"
        onChange={onChange}
        value={formData.item}
        className="w-full border p-2 rounded"
      />
      <textarea
        name="description"
        placeholder="Additional description"
        onChange={onChange}
        value={formData.description}
        className="w-full border p-2 rounded"
      />
      <input
        name="date"
        type="date"
        onChange={onChange}
        value={formData.date}
        className="w-full border p-2 rounded"
      />
      <label className="block text-sm mt-2">Estimated time slot (optional)</label>
      <select
        name="timeSlot"
        onChange={onChange}
        value={formData.timeSlot}
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
        <input
          type="checkbox"
          name="isCellphone"
          onChange={onChange}
          checked={formData.isCellphone}
        />
        If you lost your cellphone, click yes
      </label>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
