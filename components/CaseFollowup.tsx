// components/CaseFollowup.tsx
'use client';

import React from 'react';

type Block = { title: string; paragraphs: string[] };

export default function CaseFollowup({ blocks }: { blocks: Block[] }) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <div className="rounded-md border bg-white p-4 text-gray-600">
        Aucun suivi pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-xl border bg-white shadow-sm">
          <div className="bg-green-100 px-4 py-3 rounded-t-xl">
            <h3 className="text-lg font-semibold">{b.title || 'Bloc'}</h3>
          </div>
          <div className="p-4 space-y-2 text-[15px] leading-6 text-gray-800">
            {(b.paragraphs || []).map((p, k) => (
              <p key={k} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
