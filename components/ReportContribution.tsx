// app/components/ReportContribution.tsx
'use client';

import { useState } from 'react';

export default function ReportContribution() {
  const [amount, setAmount] = useState(12);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseInt(e.target.value));
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2">Your contribution</h2>
      <label htmlFor="contribution" className="block mb-2">Choose the amount you'd like to contribute:</label>
      <input
        type="range"
        min="1"
        max="50"
        value={amount}
        onChange={handleAmountChange}
        className="w-full"
      />
      <div className="text-center mt-2 font-medium">${amount}</div>

      {amount < 12 && (
        <div className="mt-4 text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-300">
          <p className="mb-2">💡 The amount you have selected is lower than the minimum suggested contribution.</p>
          <p className="mb-2">
            The amount you contribute helps cover operational costs like staff, hosting, database searches, social media publishing,
            and email/phone communication.
          </p>
          <p className="mb-2">
            🌐 Our platform welcomes more than 1000 visitors every day. Your contribution supports our mission to assist as many people as possible.
          </p>
          <p>
            ✔️ Your support allows our team to dedicate time and energy daily to process and broadcast lost item reports. Thank you!
          </p>
        </div>
      )}
    </div>
  );
}
