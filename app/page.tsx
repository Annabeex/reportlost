'use client';

import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Workflow, ShieldCheck, Target } from 'lucide-react';
import UsaMap from '@/components/UsaMap';
import categoryList from '@/lib/popularCategories';
import { buildCityPath } from '@/lib/slugify'; // ✅ nouveau helper

// ✅ Ajoute l'état (abbr) pour générer /lost-and-found/{state}/{city}
const majorCities = [
  { name: 'New York',     state: 'NY', image: '/images/cities/new-york.jpg' },
  { name: 'Los Angeles',  state: 'CA', image: '/images/cities/los-angeles.jpg' },
  { name: 'Chicago',      state: 'IL', image: '/images/cities/chicago.jpg' },
  { name: 'Houston',      state: 'TX', image: '/images/cities/houston.jpg' },
  { name: 'Phoenix',      state: 'AZ', image: '/images/cities/phoenix.jpg' },
  { name: 'Philadelphia', state: 'PA', image: '/images/cities/philadelphia.jpg' },
  { name: 'San Antonio',  state: 'TX', image: '/images/cities/san-antonio.jpg' },
  { name: 'San Diego',    state: 'CA', image: '/images/cities/san-diego.jpg' },
];

export default function HomePage() {
  return (
    <>
      <section className="w-full bg-white px-4 py-8 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-[48%]">
            <UsaMap />
          </div>
          <div className="w-full md:w-[48%] text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Lost and Found Services in the United States
            </h1>
            <p className="text-gray-700 mb-4 text-sm md:text-base">
              Report and recover lost items from various cities and states across the United States of America.
            </p>
            <Link
              href="/report"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold"
            >
              Report a Lost Item
            </Link>
          </div>
        </div>
        <div className="w-full h-px bg-gray-200 mt-12" />
      </section>

      <section className="bg-white w-full px-8 py-10 mx-auto animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
            Explore Lost & Found Services in Major U.S. Cities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
            {majorCities.map(city => (
              <Link
                key={`${city.name}-${city.state}`}
                href={buildCityPath(city.state, city.name)} // ✅ /lost-and-found/{state}/{city}
                className="text-center group transition-transform transform hover:scale-105"
              >
                <Image
                  src={city.image}
                  alt={city.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover mx-auto shadow w-[120px] h-[120px]"
                />
                <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
                  {city.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-50 to-yellow-50 w-full px-8 py-16 mx-auto animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm text-gray-700">
            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Workflow size={20} className="text-blue-500" /> How It Works
              </h3>
              <ul className="space-y-1">
                <li className="flex gap-2"><span className="text-blue-500">→</span> Submit a detailed report with as much information as possible.</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> We analyze and match your report with databases and local groups.</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> Your report is shared with appropriate authorities and relevant services.</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> Receive real-time updates and connect with the team if your item is found.</li>
              </ul>
            </div>
            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ShieldCheck size={20} className="text-green-500" /> Why ReportLost.org?
              </h3>
              <ul className="list-none">
                <li className="mb-2">✅ Available 24/7 online</li>
                <li className="mb-2">✅ Covers all U.S. cities and states</li>
                <li className="mb-2">✅ Combines AI-powered analysis with human follow-up</li>
                <li className="mb-2">✅ Trusted by thousands of users</li>
                <li className="mb-2">✅ Private, anonymous submissions available</li>
              </ul>
            </div>
            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Target size={20} className="text-yellow-500" /> Who Is This For?
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Tourists who lost items while traveling in the U.S.</li>
                <li>Citizens who've misplaced phones, bags, or documents in transit</li>
                <li>Businesses seeking to centralize lost property reports</li>
                <li>Event organizers handling missing items from attendees</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 w-full px-8 py-16 mx-auto animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
            Most Frequently Lost Items
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
            {categoryList.map(category => (
              <Link
                key={category.name}
                href={`/category/${encodeURIComponent(category.name.toLowerCase())}`}
                className="text-center"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover mx-auto shadow hover:scale-105 transition-transform"
                />
                <p className="text-sm font-medium mt-2 text-gray-700">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
