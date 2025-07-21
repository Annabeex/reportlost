/*À utiliser quand tu veux intégrer les deux formulaires dans une autre page.*/'use client';

import { useState } from 'react';
import ReportForm from './ReportForm';
import FoundItemsForm from './FoundItemsForm';

export default function ClientReportForm({ defaultCity }: { defaultCity: string }) {
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  return (
    <section className="bg-blue-100 py-10 px-4 sm:px-6 lg:px-8 rounded-xl">
      <div className="max-w-4xl mx-auto">
        {/* Onglets collés au formulaire */}
        <div className="flex justify-center">
          <div className="flex rounded-t-md overflow-hidden border-x border-t border-gray-300">
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'lost'
                  ? 'bg-white border-b-0 text-blue-700'
                  : 'bg-gray-100 border-b border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
            >
              I lost something
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'found'
                  ? 'bg-white border-b-0 text-blue-700'
                  : 'bg-gray-100 border-b border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
            >
              I found something
            </button>
          </div>
        </div>

        {/* Formulaire encadré (visuellement connecté aux onglets) */}
        <div className="border border-gray-300 border-t-0 bg-white rounded-b-md shadow p-6">
          {activeTab === 'lost' && <ReportForm defaultCity={defaultCity} enforceValidation />}
          {activeTab === 'found' && <FoundItemsForm defaultCity={defaultCity} />}
        </div>
      </div>
    </section>
  );
}
