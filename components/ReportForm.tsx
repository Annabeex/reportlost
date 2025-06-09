// === components/ReportForm.tsx ===
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  defaultCity?: string;
}

export default function ReportForm({ defaultCity = '' }: Props) {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    city: defaultCity,
    date: '',
    email: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  const cityFieldIsEditable = defaultCity === '';

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!cityFieldIsEditable || formData.city.length < 1) {
        setCitySuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('us_cities')
        .select('city')
        .ilike('city', `${formData.city}%`)
        .limit(8);

      if (!error && data) {
        setCitySuggestions(data.map((c) => c.city));
      } else {
        setCitySuggestions([]);
      }
    };

    fetchSuggestions();
  }, [formData.city, cityFieldIsEditable]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, city: suggestion }));
    setCitySuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);

    const { error } = await supabase.from('lost_items').insert([formData]);

    if (error) {
      console.error('Error submitting form:', error);
      setError('An error occurred. Please try again.');
    } else {
      setSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitted && (
        <div className="bg-green-100 text-green-800 p-4 rounded">
          Your report was submitted successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. Phone, Wallet, Keys"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Include color, brand, unique features..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            readOnly={!cityFieldIsEditable}
          />
          {cityFieldIsEditable && formData.city.length > 0 && citySuggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border mt-1 rounded-md shadow max-h-40 overflow-y-auto w-full">
              {citySuggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date lost</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

