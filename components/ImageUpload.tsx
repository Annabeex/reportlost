'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Props {
  formData: any
  setFormData: (data: any) => void
}

export default function ImageUpload({ formData, setFormData }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(formData.object_photo || null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const safeName = file.name.replace(/\s+/g, '_')
    const fileName = `lost-${Date.now()}-${safeName}`
    const filePath = `object_photo/${fileName}`

    setUploading(true)

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      alert('❌ Failed to upload image.')
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    setPreviewUrl(publicUrl)

    // Analyse via Google Vision API
    try {
      const base64Image = await toBase64(file)

      const response = await fetch('/api/apivision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      })

      const visionData = await response.json()

      const autoText = [
        ...(visionData.labels || []),
        ...(visionData.objects || []),
        ...(visionData.logos || []),
        visionData.text || '',
      ].filter(Boolean).join(', ')

      const note = 'Detected content — please edit if needed and add the location (e.g., street, mall…)'

      setFormData((prev: any) => ({
        ...prev,
        object_photo: publicUrl,
        item: `${autoText}\n\n✏️ ${note}`,
      }))
    } catch (err) {
      console.error('Vision API error:', err)
    }

    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <label className="block font-medium text-sm text-gray-700">
        Upload a photo of the lost item (optional)
      </label>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />

      {uploading && <p className="text-sm text-blue-500">Uploading...</p>}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="mt-2 rounded border w-full max-w-xs"
        />
      )}
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
  })
}
