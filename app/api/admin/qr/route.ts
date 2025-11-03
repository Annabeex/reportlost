// app/api/admin/qr/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ✅ indispensable : le package "qrcode" a besoin de Buffer (Edge ne l’a pas)
export const runtime = 'nodejs';

import { customAlphabet } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 22);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportlost.org';

export async function GET(req: NextRequest) {
  try {
    // ✅ import dynamique + typage : corrige l’"import rouge" dans VS Code/TS
    const QR: typeof import('qrcode') = await import('qrcode');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const format = (searchParams.get('format') || 'svg').toLowerCase(); // svg|png

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // 1) Récupérer l’item
    const { data: item, error: fetchErr } = await admin
      .from('lost_items')
      .select('id, public_id, qr_token')
      .eq('id', id)
      .single();

    if (fetchErr || !item) {
      return NextResponse.json({ ok: false, error: 'Item not found' }, { status: 404 });
    }

    // 2) Générer un token si absent
    let token = item.qr_token as string | null;
    if (!token) {
      token = nanoid();
      const { error: updErr } = await admin
        .from('lost_items')
        .update({ qr_token: token })
        .eq('id', id);
      if (updErr) {
        return NextResponse.json({ ok: false, error: 'Cannot save token' }, { status: 500 });
      }
    }

    // 3) URL de scan
    const scanUrl = `${PUBLIC_BASE_URL}/qr/${token}`;

    // 4) Générer le QR
    if (format === 'png') {
      const dataUrl = await QR.toDataURL(scanUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        scale: 8, // bonne définition
      });
      return NextResponse.json({
        ok: true,
        format: 'png',
        dataUrl,
        scanUrl,
        fileName: `RL-${item.public_id || token}.png`,
      });
    } else {
      const svg = await QR.toString(scanUrl, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
      });
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      return NextResponse.json({
        ok: true,
        format: 'svg',
        svg,
        dataUrl,
        scanUrl,
        fileName: `RL-${item.public_id || token}.svg`,
      });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
