'use client'

import { useState, useEffect } from 'react'
import { Info, Search, Zap } from 'lucide-react'

interface Props {
  contribution: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
  onNext: () => void
}

const levels = [
  {
    id: 1,
    title: 'Level 1: Standard Search',
    icon: Info,
    description:
      'Basic listing with indexing. Recommended for common items with low value.',
    icons: ['🔍', '📄', '🌐', '📤', '📬', '📌'],
  },
  {
    id: 2,
    title: 'Level 2: Extended Search',
    icon: Search,
    description:
      'Advanced search and distribution to targeted networks. Good for moderately important items.',
    icons: ['🔍', '🧭', '🗂️', '🖼️', '🧾', '📡', '📢', '🌐', '📧', '📱'],
  },
  {
    id: 3,
    title: 'Level 3: Maximum Search',
    icon: Zap,
    description:
      'Personalized follow-up, priority visibility, and extended alerts. Ideal for sentimental, financial, or professional losses.',
    icons: [
      '🔍', '📡', '📣', '📷', '📱', '📦', '🧭', '🌍', '🗄️', '📂', '🖼️', '📢',
      '🔗', '🧠', '🧑‍💻', '📈', '🔁', '📬', '🧷',
    ],
  },
]

export default function ReportContribution({
  contribution,
  onChange,
  onBack,
  onNext,
}: Props) {
  const [levelIndex, setLevelIndex] = useState(1)

  useEffect(() => {
    // Prépositionner sur 15 $ si rien de sélectionné
    if (!contribution) {
      onChange({ target: { name: 'contribution', value: 15 } } as any)
    }
  }, [])

  const selectedLevel = levels[levelIndex]

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    onChange({ target: { name: 'contribution', value } } as any)
  }

  return (
    <section className="bg-white w-full min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Support the follow-up of your report
        </h2>

        <p className="text-center text-gray-700 text-base leading-relaxed">
          Your contribution allows our team to manually review your report, contact relevant services, and optimize visibility for the first 30 days.
          <br />
          <span className="block mt-2">
            After that period, your report stays published in our database and you will receive an <strong>automatic alert</strong> if a match is found later.
          </span>
        </p>

        <div className="bg-white p-6 rounded-md shadow-md space-y-4 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            Choose your level of search
          </h3>

          <input
            type="range"
            min="0"
            max="2"
            value={levelIndex}
            onChange={(e) => setLevelIndex(Number(e.target.value))}
            className="w-full accent-green-600"
          />

          <div className="mt-4 border rounded-lg bg-green-50 p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <selectedLevel.icon className="text-green-600" />
              <h4 className="text-lg font-semibold text-green-800">
                {selectedLevel.title}
              </h4>
            </div>
            <p className="text-gray-700 text-sm mb-2">{selectedLevel.description}</p>

            <div className="flex flex-wrap gap-2 text-xl">
              {selectedLevel.icons.map((icon, i) => (
                <span key={i}>{icon}</span>
              ))}
            </div>

            <p className="text-gray-700 text-sm mt-3 italic">
              You can define your contribution below.
            </p>
          </div>
        </div>

        <div className="pt-6">
          <label htmlFor="contributionSlider" className="block text-sm font-medium text-gray-700 mb-1">
            Adjust your contribution amount
          </label>
          <input
            type="range"
            id="contributionSlider"
            name="contribution"
            min={5}
            max={300}
            step={1}
            value={contribution}
            onChange={handleSliderChange}
            className="w-full accent-blue-600"
          />
          <p className="text-center text-gray-700 mt-2">
            Selected amount: <strong>${contribution}</strong>
          </p>
        </div>

        {Number(contribution) < 12 && (
          <div className="mt-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 text-sm rounded-md shadow-sm space-y-2">
            <p>⚠️ The contribution you've selected is quite low.</p>
            <p>
              Processing, researching and following up lost item reports requires real human time and infrastructure.
            </p>
            <p>
              We encourage you to consider increasing your support if you wish to benefit from the most complete search effort.
            </p>
            <p className="italic">Thank you for helping us help you 💛</p>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </section>
  )
}
