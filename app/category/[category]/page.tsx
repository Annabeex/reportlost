'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import phrasesRaw from '@/lib/category-phrases.json';
import { categoryContent } from '@/lib/category-content';
import MaintenanceNotice from '@/components/MaintenanceNotice';

const phrases: Record<string, string[]> = phrasesRaw;

export default function CategoryPage({ params }: { params: { category: string } }) {
  const searchParams = useSearchParams();
  const category = decodeURIComponent(params.category);

  const phrase = phrases[category]?.[
    Math.floor(Math.random() * phrases[category].length)
  ] ?? '';

  const staticPhrase = categoryContent[category] ?? '';

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
        Lost & Found: {category.charAt(0).toUpperCase() + category.slice(1)}
      </h1>

      <p className="text-center text-gray-700 mb-4 max-w-2xl mx-auto italic">
        {phrase}
      </p>

      <p className="text-center text-gray-700 mb-6 max-w-2xl mx-auto">
        {staticPhrase}
      </p>

      <div className="flex justify-center mb-8">
  <button
    disabled
    className="bg-blue-400 text-white px-6 py-3 rounded-md font-semibold cursor-not-allowed opacity-70"
  >
    Report a Lost {category.charAt(0).toUpperCase() + category.slice(1)}
  </button>
</div>


      <div className="bg-white shadow rounded-lg p-6 text-gray-600 text-center">
        Reports related to "{category}" will appear here soon.
      </div>

      <div className="mt-10">
        <MaintenanceNotice
          message={`We're currently working on this category. Reports for "${category}" will be listed here shortly.`}
        />
      </div>
    </section>
  );
}
