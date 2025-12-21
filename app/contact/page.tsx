'use client';

import Link from 'next/link';

export default function ContactPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-700 font-semibold">
          🛈 This page is for general inquiries only.
        </p>
        <p className="text-sm text-yellow-700 mt-1">
          If you want to report a lost item, please use our dedicated form:
        </p>
        <Link
          href="/report"
          className="inline-block mt-2 text-blue-600 hover:underline font-medium"
        >
          → Go to Lost Item Report Form
        </Link>
      </div>

      <p className="mb-4 text-sm">
        For questions about the platform, technical issues, partnerships, or press inquiries,
        feel free to contact us at:
      </p>

      <p className="font-medium mb-8">
        📧 <a href="mailto:support@reportlost.org" className="text-blue-600 hover:underline">support@reportlost.org</a>
      </p>

      <p className="text-xs text-gray-500">
        Please do not use this email to report a lost item. Reports submitted via email will not be processed.
      </p>
    </section>
  );
}
