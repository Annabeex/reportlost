'use client';

import { Info, Search, Zap } from 'lucide-react';

interface Props {
  onBack: () => void;
  onNext: () => void;
  contribution: number;
  setFormData: (fn: (prev: any) => any) => void;
  referenceCode?: string;
}

const plans = [
  {
    id: 1,
    title: 'Level 1: Standard',
    amount: 10,
    icon: Info,
    description: 'Basic listing with indexing. Ideal for common items with limited value.',
    icons: ['🔍', '📄', '🌐', '📤', '📬', '📌'],
  },
  {
    id: 2,
    title: 'Level 2: Extended',
    amount: 20,
    icon: Search,
    description: 'Advanced search and distribution to targeted networks. Recommended for moderately important items.',
    icons: ['🔍', '🧭', '🗂️', '🖼️', '🧾', '📡', '📢', '🌐', '📧', '📱'],
  },
  {
    id: 3,
    title: 'Level 3: Maximum',
    amount: 30,
    icon: Zap,
    description: 'Personalized follow-up, priority visibility, and extended alerts. Ideal for sentimental or high-value losses.',
    icons: ['🔍', '📡', '📣', '📷', '📱', '📦', '🧭', '🌍', '🗄️', '📂', '🖼️', '📢', '🔗', '🧠', '🧑‍💻', '📈', '🔁', '📬', '🧷'],
  },
];

export default function ReportContribution({
  onBack,
  onNext,
  contribution,
  setFormData,
  referenceCode,
}: Props) {
  const handleSelectPlan = (amount: number) => {
    setFormData((prev: any) => ({ ...prev, contribution: amount }));
    onNext();
  };

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Support the follow-up of your report
          </h2>
          <p className="text-gray-700 text-base leading-relaxed max-w-2xl mx-auto">
            Your contribution allows our team to manually review your report, contact relevant services,
            and optimize visibility for the first 30 days.
            <br />
            <span className="block mt-2">
              After that period, your report remains published and you'll be notified automatically in case of a match.
            </span>
          </p>
          {referenceCode && (
            <p className="inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
              <span role="img" aria-label="reference">🔖</span>
              Share this reference code with support: <span className="font-semibold">{referenceCode}</span>
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.amount)}
              className="border rounded-xl p-6 bg-white hover:bg-blue-50 transition-colors shadow text-left flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <plan.icon className="text-blue-600 w-5 h-5" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {plan.title} – ${plan.amount}
                  </h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">{plan.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xl pt-2">
                {plan.icons.map((icon, i) => (
                  <span key={i}>{icon}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center pt-6">
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>
    </section>
  );
}
