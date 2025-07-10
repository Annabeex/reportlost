'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImageAndAnalyze } from '@/lib/Apivision'
import ReportForm from '@/components/ReportForm'
import AutoCompleteCitySelect from '@/components/AutoCompleteCitySelect'

const MIN_CITY_CHARS = 1

const AutoCompleteCitySelectWithMinChar = (props: any) => {
  const [inputValue, setInputValue] = useState('')
  return (
    <>
      <AutoCompleteCitySelect
        {...props}
        inputValue={inputValue}
        onInputChange={(e: any) => setInputValue(e.target.value)}
        minQueryLength={MIN_CITY_CHARS}
      />
    </>
  )
}

export default function ReportFormPage({ defaultCity = '' }: { defaultCity?: string }) {
  const [activeTab, setActiveTab] = useState<'found' | 'report'>('report')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="relative">
        <div className="flex justify-start -mb-4 z-20 relative">
          <div className="rounded-t-xl overflow-hidden inline-flex shadow-md border border-b-0 bg-white">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 text-sm font-medium transition rounded-t-xl ${
                activeTab === 'report'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Lost Items
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-4 py-2 text-sm font-medium transition rounded-t-xl ${
                activeTab === 'found'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Found Items
            </button>
          </div>
        </div>

        <div className="pt-10 bg-blue-50 p-6 rounded-xl shadow">
          {activeTab === 'report' ? (
            <ReportForm defaultCity={defaultCity} enforceValidation={true} />
          ) : (
            <FoundItemsDashboardModule />
          )}
        </div>
      </div>
    </div>
  )
}

function FoundItemsDashboardModule() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!photo) return
    setUploading(true)

    try {
      const { imageUrl } = await uploadImageAndAnalyze(photo)
      await supabase.from('vision_results').insert([
        {
          image_url: imageUrl,
          text: comment || '',
          upload_location: '',
        },
      ])
      setSuccess(true)
      setComment('')
      setPhoto(null)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold">Found Item Upload</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
      />
      <textarea
        placeholder="Comment (optional)"
        className="w-full border p-2 rounded"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        disabled={uploading || !photo}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {uploading ? 'Uploading...' : 'Submit'}
      </button>
      {success && <p className="text-green-600">Upload successful!</p>}
    </div>
  )
}
