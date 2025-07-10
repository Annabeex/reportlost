'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  formData: any
  onChange: (e: React.ChangeEvent<any>) => void
  onNext: () => void
  onBack: () => void
  setFormData: (data: any) => void
}

export default function ReportFormStep2({
  formData,
  onChange,
  onNext,
  onBack,
  setFormData
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSigned, setHasSigned] = useState(!!formData.signature)
  const [confirm1, setConfirm1] = useState(false)
  const [confirm2, setConfirm2] = useState(false)
  const [confirm3, setConfirm3] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(formData.photo || '')
  const [uploading, setUploading] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.beginPath()
    ctx?.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx?.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL()
      setFormData((prev: any) => ({ ...prev, signature: dataUrl }))
      setHasSigned(true)
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      setFormData((prev: any) => ({ ...prev, signature: '' }))
      setHasSigned(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const filename = `photo-${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('images').upload(filename, file)

      if (error) throw error

      const { data: urlData } = await supabase.storage
        .from('images')
        .getPublicUrl(filename)

      if (!urlData?.publicUrl) throw new Error('No public URL returned.')

      setFormData((prev: any) => ({ ...prev, photo: urlData.publicUrl }))
      setPreviewUrl(urlData.publicUrl)
    } catch (err) {
      alert('Error uploading image. Please try again.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleContinue = () => {
    if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.email?.trim()) {
      alert('Please fill in all required fields.')
      return
    }

    if (!confirm1 || !confirm2 || !confirm3) {
      alert('Please check all confirmation boxes.')
      return
    }

    if (!hasSigned) {
      alert('Please provide your signature.')
      return
    }

    onNext()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step 3: Your contact details</h2>

      <div>
        <label className="block font-medium">First name</label>
        <input
          name="first_name"
          onChange={onChange}
          value={formData.first_name || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Last name</label>
        <input
          name="last_name"
          onChange={onChange}
          value={formData.last_name || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Email address</label>
        <input
          type="email"
          name="email"
          onChange={onChange}
          value={formData.email || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">
          Phone number <span className="text-green-600">(optional)</span>
        </label>
        <input
          type="tel"
          name="phone"
          onChange={onChange}
          value={formData.phone || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">
          Postal address <span className="text-green-600">(optional)</span>
        </label>
        <input
          name="address"
          onChange={onChange}
          value={formData.address || ''}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">
          Add a photo of the lost item <span className="text-green-600">(optional)</span>
        </label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
        {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Preview" className="max-h-48 rounded border" />
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold">Final confirmation</h3>

        <div className="border border-gray-300 bg-gray-50 p-4 rounded-md flex items-start space-x-3">
          <input type="checkbox" checked={confirm1} onChange={(e) => setConfirm1(e.target.checked)} />
          <p className="text-sm text-gray-700">
            By checking this box and by adding my signature, I accept that the personal information collected via this form will be recorded so that I can be contacted again if my item(s) is / are found. I agree that my report will be published on the reportlost.org platform and on the social networks Facebook & Twitter. The data is kept for a maximum of 36 months and then automatically deleted. You can access the data that concerns you, rectify it, request its erasure or exercise your right to limit the processing of your data. You can withdraw your consent to the processing of your data at any time. You can also object to the processing or exercise your right to the portability of your data. To exercise these rights or for any questions about the processing of your data in this system, please contact our data protection team through the contact page.
          </p>
        </div>

        <div className="border border-gray-300 bg-gray-50 p-4 rounded-md flex items-start space-x-3">
          <input type="checkbox" checked={confirm2} onChange={(e) => setConfirm2(e.target.checked)} />
          <p className="text-sm text-gray-700">
            I confirm that I have read and understood the Terms of Use of the platform reportlost.org. I accept the conditions under which my report will be processed and possibly shared with third parties involved in lost and found processes (such as public services, transportation companies, or local institutions). I understand that submitting this form does not guarantee recovery of the item and that the service is provided on a best-effort basis.
          </p>
        </div>

        <div className="border border-gray-300 bg-gray-50 p-4 rounded-md flex items-start space-x-3">
          <input type="checkbox" checked={confirm3} onChange={(e) => setConfirm3(e.target.checked)} />
          <p className="text-sm text-gray-700">
            I confirm that I am the person who lost the item or that I am authorized to submit this report on behalf of the owner.
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-6">
        <h4 className="text-md font-medium text-gray-800">Signature</h4>
        <div className="border border-gray-300 rounded p-4 bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="w-full border rounded cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <div className="flex justify-between mt-2">
            <button onClick={clearSignature} className="text-sm text-blue-600 hover:underline">
              Clear Signature
            </button>
            {hasSigned && <span className="text-green-600 text-sm">✔️ Signature recorded</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          onClick={onBack}
        >
          ← Back
        </button>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          onClick={handleContinue}
        >
          Next
        </button>
      </div>
    </div>
  )
}
