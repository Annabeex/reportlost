// lib/Apivision.ts  (client-side util, pas besoin de 'use client' ici)
import { supabase } from '@/lib/supabase'
import { Buffer } from 'buffer'

export type VisionResult = {
  imageUrl: string
  labels: string[]
  logos: string[]
  objects: string[]
  ocrText: string
}

export async function uploadImageAndAnalyze(file: File): Promise<VisionResult> {
  // 1) upload dans Supabase Storage
  const fileName = `found-${Date.now()}-${file.name.replace(/\s+/g, '_')}`
  const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file)
  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw uploadError
  }
  const imageUrl =
    supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl

  // 2) base64
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  // 3) appel API interne (tout en minuscules)
  const res = await fetch('/api/apivision', {
    method: 'POST',
    body: JSON.stringify({ image: base64 }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Erreur API Vision')

  const { labels, logos, objects, text } = await res.json()
  return { imageUrl, labels, logos, objects, ocrText: text }
}
