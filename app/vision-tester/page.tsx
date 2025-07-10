'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function VisionTesterPage() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [results, setResults] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setResults(null)
    }
  }

  const handleAnalyze = async () => {
    if (!image) return
    setLoading(true)

    const base64 = await toBase64(image)

    const res = await fetch('/api/Apivision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    })

    const data = await res.json()
    setResults(data)

    const imageUrl = await uploadToSupabase(image)
    if (!imageUrl) {
      alert("Erreur lors de l'envoi de l'image.")
      setLoading(false)
      return
    }

    // 🔍 Vérifie si la session est bien chargée
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    console.log("👤 Utilisateur connecté :", session?.session?.user)

    if (sessionError) {
      console.error("Erreur de session Supabase :", sessionError.message)
      alert("Erreur de session Supabase.")
      setLoading(false)
      return
    }

    if (!session?.session?.user) {
      console.warn("⚠️ Aucun utilisateur connecté !")
      alert("Vous devez être connecté pour enregistrer les résultats.")
      setLoading(false)
      return
    }

    const { error } = await supabase.from('vision_results').insert([
      {
        labels: data.labels?.join(', ') || '',
        text: data.text || '',
        logos: data.logos?.join(', ') || '',
        objects: data.objects?.join(', ') || '',
        image_url: imageUrl || '',
      },
    ])

    if (error) {
      console.error("❌ Erreur Supabase :", error)
      alert("Erreur lors de l'enregistrement dans la base.")
    }

    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test de Google Vision</h1>

      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="Aperçu" className="w-48 mt-4 rounded border" />}

      <button
        onClick={handleAnalyze}
        disabled={!image || loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Analyse en cours...' : 'Analyser avec Google Vision'}
      </button>

      {results && (
        <div className="mt-6 space-y-4 text-sm text-gray-800">
          <div>
            <strong>Labels détectés :</strong><br />
            {results.labels?.length ? results.labels.join(', ') : '—'}
          </div>
          <div>
            <strong>Texte détecté :</strong><br />
            <pre className="whitespace-pre-wrap">{results.text || '—'}</pre>
          </div>
          <div>
            <strong>Logos détectés :</strong><br />
            {results.logos?.length ? results.logos.join(', ') : '—'}
          </div>
          <div>
            <strong>Objets détectés :</strong><br />
            {results.objects?.length ? results.objects.join(', ') : '—'}
          </div>
        </div>
      )}
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // Supprime le préfixe "data:image/..."
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

async function uploadToSupabase(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name}`
  console.log("📤 Tentative d'envoi de l'image :", fileName)

  const { data, error } = await supabase.storage.from('images').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    console.error("❌ Erreur Supabase lors de l'upload :", error.message, error)
    return null
  }

  if (!data?.path) {
    console.error("❌ Upload réussi mais pas de chemin de fichier retourné :", data)
    return null
  }

  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(data.path)

  if (!publicUrlData?.publicUrl) {
    console.error("❌ Impossible de générer l'URL publique.")
    return null
  }

  console.log("✅ Upload réussi, URL :", publicUrlData.publicUrl)
  return publicUrlData?.publicUrl || null
}
