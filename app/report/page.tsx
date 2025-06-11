'use client';

import { useState } from 'react';
import ReportContribution from '../../components/ReportContribution';

export default function ReportPage() {
  const [contribution, setContribution] = useState(30);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setContribution(value);
  };

  const handleSubmit = () => {
    alert(`Proceeding with contribution of $${contribution}`);
  };

  const handleBack = () => {
    alert('Going back to previous step');
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Support Our Work</h1>
      <p className="mb-6">
        You choose how much to support our work. Your contribution helps us process your report and share it effectively.
      </p>
      <ReportContribution
        contribution={contribution}
        onBack={handleBack}
      />
    </main>
  );
}
