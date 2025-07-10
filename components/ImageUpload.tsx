'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `object_photos/${fileName}`

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

    setFormData((prev: any) => ({ ...prev, object_photo: publicUrl }))
    setPreviewUrl(publicUrl)
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
