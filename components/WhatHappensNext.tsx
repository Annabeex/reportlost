'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    item: '',
    description: '',
    date: '',
    timeSlot: '',
    isCellphone: false,
    contribution: 30,
  });

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const value =
      target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

    setFormData((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">What did you lose and where?</h2>
            <input name="item" placeholder="e.g. Phone lost in JFK taxi" onChange={handleChange} className="w-full border p-2 rounded" />
            <textarea name="description" placeholder="Additional description" onChange={handleChange} className="w-full border p-2 rounded" />
            <input name="date" type="date" onChange={handleChange} className="w-full border p-2 rounded" />
            <label className="block text-sm mt-2">Estimated time slot (optional)</label>
            <select name="timeSlot" onChange={handleChange} className="w-full border p-2 rounded">
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
            <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={handleNext}>
              Next
            </button>
          </div>
        );

      case 2:
        return (
          <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Here’s what happens next</h2>
            <p className="text-gray-700">
              We analyze your report, contact appropriate services, anonymize and publish your declaration, and follow up for 30 days if needed.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Your report is reviewed by a team member</li>
              <li>We search in lost & found databases and contact relevant services</li>
              <li>An anonymous email is created for contact</li>
              <li>We publish and share your notice across platforms</li>
            </ul>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleNext}>
              Continue
            </button>
          </div>
        );

      case 3:
        return (
          <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Support Our Work</h2>
            <p className="text-gray-700">
              You choose how much to support our work. Your contribution helps us process your report, contact relevant services, and share it effectively.
            </p>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                name="contribution"
                min="0"
                max="300"
                value={formData.contribution}
                onChange={handleChange}
                className="w-full"
              />
              <span className="text-lg font-medium">${formData.contribution}</span>
            </div>

            {Number(formData.contribution) < 12 && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 text-sm text-gray-700">
                <p>💡 The amount of remuneration you have currently selected is lower than the minimum amount set up on the platform to ensure a minimum income for our platform team members.</p>
                <p className="mt-2">
                  It's useful to know that the amount you have currently selected is not the final remuneration that Daryl will receive: it is necessary to deduct all taxes and charges, fees of our payment partner, hosting fees of the platform, software and plugin fees...
                </p>
                <p className="mt-2">
                  The diffusion of your report to one or more services, the search for correlation(s) in lost and found databases, your report being published and broadcasted on our platform and on social networks, the transmissions by e-mail and/or telephone requires full time work for our team.
                </p>
                <p className="mt-2">
                  🌐 Our platform welcomes more than 1000 visitors every day and our goal is to help you as much as possible in your process following the loss of an item.
                </p>
                <p className="mt-2">
                  ✔️ Thanks to your retribution, we can devote time and energy on a daily basis to manage and disseminate the many reports we receive each day, a BIG Thank you!
                </p>
                <p className="mt-2">
                  A financial retribution allows us to thank a member of the team for the time and energy devoted to the diffusion and the research of your lost item(s).
                </p>
              </div>
            )}

            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => router.push('/report/payment')}>
              Proceed to Payment
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">{renderStep()}</div>
  );
}
