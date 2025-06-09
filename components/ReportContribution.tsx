// components/ReportContribution.tsx
'use client';

import { useState } from 'react';

export default function ReportContribution() {
  const [amount, setAmount] = useState(30);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Support Our Work</h2>
        <p className="text-gray-700">
          Your contribution helps us process your lost item report and increase the chances of it being returned to you.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mt-6">Here’s what happens next</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Your report is reviewed by a team member</li>
          <li>We search in lost & found databases and contact relevant services</li>
          <li>An anonymous email is created for contact</li>
          <li>We publish and share your notice across platforms</li>
        </ul>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Your contribution</h3>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Choose the amount you'd like to contribute:
          </label>
          <input
            type="range"
            min="0"
            max="300"
            value={amount}
            onChange={handleSliderChange}
            className="w-full"
          />
          <div className="text-lg font-semibold text-center mt-2">${amount}</div>

          {amount < 12 && (
            <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-sm text-gray-800 space-y-2 rounded-md">
              <p>💡 The amount of remuneration you have currently selected is lower than the minimum amount set up on the platform to ensure a minimum income for our platform team members.</p>
              <p>The amount you have selected is not the final remuneration that Daryl will receive: fees (payment, hosting, software...) are deducted.</p>
              <p>This project requires full-time human work: search, match, communication, and publishing on platforms and social networks.</p>
              <p>🌐 With over 1,000 visitors daily, our only funding source is user support. We rely on you.</p>
              <p>✔️ Your contribution helps us dedicate time and energy to recover your lost item. Thank you!</p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
