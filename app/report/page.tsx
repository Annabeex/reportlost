/*Sert de point d’entrée principal pour l’URL /report.*/

'use client';

import { useState } from 'react';
import ReportForm from '@/components/ReportForm';
import FoundItemsForm from '@/components/FoundItemsForm';

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab('lost')}
          className={`px-4 py-2 rounded ${
            activeTab === 'lost'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          I lost something
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`px-4 py-2 rounded ${
            activeTab === 'found'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          I found something
        </button>
      </div>

      {/* Toujours monter les deux composants pour conserver leur état interne */}
      <div style={{ display: activeTab === 'lost' ? 'block' : 'none' }}>
        <ReportForm enforceValidation={true} defaultCity="" />
      </div>

      <div style={{ display: activeTab === 'found' ? 'block' : 'none' }}>
        <FoundItemsForm />
      </div>
    </main>
  );
}
