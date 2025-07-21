'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🔠 Types
type LostItem = {
  id: string;
  created_at: string;
  object_photo: string | null;
  description: string;
  city: string;
  loss_neighborhood: string | null;
  loss_street: string | null;
  phone_description: string | null;
  departure_place: string | null;
  arrival_place: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  travel_number: string | null;
  time_slot: string | null;
  contribution: number | null;
  email: string;
  first_name: string;
  last_name: string;
};

type FoundItem = {
  id: string;
  created_at: string;
  city: string | null;
  description: string | null;
  image_url: string | null;
  title: string | null;
  date: string | null;
  labels: string | null;
  logos: string | null;
  objects: string | null;
  ocr_text: string | null;
  email: string | null;
  phone: string | null;
  dropoff_location: string | null;
  has_item_with_you: boolean | null;
};

// 💡 Composant principal
export default function AdminPage() {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data: lost, error: lostError } = await supabase
        .from('lost_items')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: found, error: foundError } = await supabase
        .from('found_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!lostError && lost) setLostItems(lost as LostItem[]);
      if (!foundError && found) setFoundItems(found as FoundItem[]);
    };

    fetchItems();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-16">
      <section>
        <h1 className="text-2xl font-bold mb-4">📦 Objets perdus</h1>
        <div className="grid gap-8">
          {lostItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-xl p-4 shadow bg-white flex items-start gap-4"
            >
              {item.object_photo && (
                <Image
                  src={item.object_photo}
                  alt="Objet perdu"
                  width={100}
                  height={100}
                  className="object-cover rounded"
                />
              )}
              <div className="flex-1 space-y-1">
                <div className="text-sm text-gray-500">
                  🕒 {new Date(item.created_at).toLocaleString()}
                </div>
                <div className="font-semibold text-lg">{item.description}</div>
                <div className="text-gray-700">
                  <strong>Ville :</strong> {item.city}
                  {item.loss_neighborhood && ` – ${item.loss_neighborhood}`}
                  {item.loss_street && ` – ${item.loss_street}`}
                </div>
                {item.phone_description && (
                  <div className="text-gray-700">
                    <strong>Téléphone :</strong> {item.phone_description}
                  </div>
                )}
                {(item.departure_place || item.arrival_place) && (
                  <div className="text-gray-700">
                    <strong>Trajet :</strong> {item.departure_place} → {item.arrival_place} ({item.departure_time} → {item.arrival_time}, {item.travel_number || '—'}, {item.time_slot || '—'})
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  👤 {item.first_name} {item.last_name} – {item.email}
                </div>
                <div className="text-sm text-gray-500">
                  💳 Contribution : {item.contribution ? `$${item.contribution}` : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h1 className="text-2xl font-bold mb-4">🧾 Objets trouvés</h1>
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">🕒 Date</th>
              <th className="p-2 border">📍 Ville</th>
              <th className="p-2 border">📝 Titre / Description</th>
              <th className="p-2 border">📷 Image</th>
              <th className="p-2 border">📤 Lieu de dépôt</th>
              <th className="p-2 border">📧 Email</th>
              <th className="p-2 border">📞 Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {foundItems.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2 border">{new Date(item.created_at).toLocaleString()}</td>
                <td className="p-2 border">{item.city || '—'}</td>
                <td className="p-2 border">
                  <div className="font-semibold">{item.title || '—'}</div>
                  <div className="text-gray-600">{item.description || '—'}</div>
                </td>
                <td className="p-2 border">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt="Objet trouvé"
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-2 border">{item.dropoff_location || '—'}</td>
                <td className="p-2 border">{item.email || '—'}</td>
                <td className="p-2 border">{item.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
