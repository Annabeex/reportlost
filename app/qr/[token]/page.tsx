// app/qr/[token]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // lecture publique OK

export default async function QRPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

  // Option: retrouver le report associé
  const { data, error } = await sb
    .from('lost_items')
    .select('id, public_id')
    .eq('qr_token', token)
    .single();

  if (!data || error) {
    // page soft 404
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">QR invalid or expired</h1>
        <p className="text-gray-600">Sorry, we couldn’t find this code.</p>
      </div>
    );
  }

  // (optionnel) enregistrer le scan (côté API pour garder la clé service role)
  // redirect vers le formulaire de message prérempli
  redirect(`/message?case=${encodeURIComponent(data.public_id || data.id)}&token=${encodeURIComponent(token)}`);
}
