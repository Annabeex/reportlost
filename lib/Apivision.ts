import { supabase } from '@/lib/supabase'
import { Buffer } from 'buffer'

type VisionResult = {
  imageUrl: string
  labels: string[]
  logos: string[]
  objects: string[]
  ocrText: string
}

export async function uploadImageAndAnalyze(file: File): Promise<VisionResult> {
  // 1. Nom unique + upload dans Supabase Storage
  const fileName = `${Date.now()}-${file.name}`
 const { data: storageData, error: uploadError } = await supabase.storage
  .from('images')
  .upload(fileName, file)

if (uploadError) {
  console.error('Upload error:', uploadError)  // ← AJOUTE CECI
  throw uploadError
}

  const imageUrl = supabase.storage
    .from('images')
    .getPublicUrl(fileName).data.publicUrl

  // 2. Conversion de l’image en base64
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  // 3. Appel à ton endpoint API interne
  const res = await fetch('/api/Apivision', {
    method: 'POST',
    body: JSON.stringify({ image: base64 }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) throw new Error('Erreur API Vision')

  const { labels, logos, objects, text } = await res.json()

  return {
    imageUrl,
    labels,
    logos,
    objects,
    ocrText: text,
  }
}
