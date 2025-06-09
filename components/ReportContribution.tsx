// ReportLost Contribution Step – Jauge de rémunération
'use client';

import { useState } from 'react';

export default function ReportContribution() {
  const [amount, setAmount] = useState(30);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded-xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Support Our Work</h2>
      <p className="text-gray-700">
        You choose how much to support our work. Your contribution helps us process your report, contact relevant services, and share it effectively.
      </p>
      <div className="flex items-center space-x-4">
        <input
          type="range"
          min="0"
          max="300"
          value={amount}
          onChange={handleSliderChange}
          className="w-full"
        />
        <span className="text-lg font-medium">${amount}</span>
      </div>

      {amount < 12 && (
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

      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Proceed to Payment</button>
    </div>
  );
}
