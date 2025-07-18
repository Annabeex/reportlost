'use client';
console.log('✅ STEP2 - version à utiliser pour les deux formulaires');

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onNext: () => void;
  onBack: () => void;
  setFormData: (data: any) => void;
}

export default function ReportFormStep2({
  formData,
  onChange,
  onNext,
  onBack,
  setFormData
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const hasSigned = !!formData.signature;
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [confirm3, setConfirm3] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(formData.object_photo || '');
  const [uploading, setUploading] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setFormData((prev: any) => ({ ...prev, signature: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setFormData((prev: any) => ({ ...prev, signature: '' }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filename = `object_photo/lost-${Date.now()}-${safeName}`;

      const uploadResponse = await supabase.storage.from('images').upload(filename, file, {
        upsert: true
      });

      if (uploadResponse.error) throw uploadResponse.error;

      const publicUrlResponse = await supabase.storage.from('images').getPublicUrl(filename);
      const publicUrl = publicUrlResponse?.data?.publicUrl;
      if (!publicUrl) throw new Error('No public URL returned.');

      setFormData((prev: any) => ({ ...prev, object_photo: publicUrl }));
      setPreviewUrl(publicUrl);
    } catch (err) {
      alert('Error uploading image. Please try again.');
      console.error('Image upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const resetImage = () => {
    setFormData((prev: any) => ({ ...prev, object_photo: '' }));
    setPreviewUrl('');
  };

  const handleContinue = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.email?.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!emailRegex.test(formData.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!confirm1 || !confirm2 || !confirm3) {
      alert('Please check all confirmation boxes.');
      return;
    }

    if (!hasSigned) {
      alert('Please provide your signature.');
      return;
    }

    // ✅ nettoyage du formData pour éviter les erreurs toJSON
    try {
      const cleanFormData = JSON.parse(JSON.stringify(formData));
      setFormData(cleanFormData); // on met à jour avant passage à la suite
      onNext();
    } catch (err) {
      console.error('❌ Failed to clean formData:', err);
      alert('Internal error – please try again or refresh the page.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Step 3: Your contact details</h2>

      {[
        { label: 'First name', name: 'first_name' },
        { label: 'Last name', name: 'last_name' },
        { label: 'Email address', name: 'email', type: 'email' },
        { label: 'Phone number (optional)', name: 'phone', type: 'tel', optional: true },
        { label: 'Postal address (optional)', name: 'address', optional: true }
      ].map(({ label, name, type = 'text', optional }) => (
        <div key={name}>
          <label className="block font-medium">
            {label}
            {optional && <span className="text-green-600"> (optional)</span>}
          </label>
          <input
            name={name}
            type={type}
            onChange={onChange}
            value={formData[name] || ''}
            className="w-full border px-3 py-1.5 rounded"
          />
        </div>
      ))}

      <div>
        <label className="block font-medium">
          Add a photo of the lost item <span className="text-green-600">(optional)</span>
        </label>

        {!previewUrl && (
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
        )}

        {uploading && <p className="text-sm text-blue-600">Uploading...</p>}

        {previewUrl && (
          <div className="mt-2 space-y-2">
            <img src={previewUrl} alt="Preview" className="max-h-48 rounded border" />
            <button
              type="button"
              onClick={resetImage}
              className="text-sm text-red-600 underline"
            >
              Change image
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        <h3 className="text-lg font-semibold">Final confirmation</h3>

        {[
          'By checking this box and by adding my signature, I accept that the personal information collected via this form will be recorded so that I can be contacted again if my item(s) is / are found. I agree that my report will be published on the reportlost.org platform and on the social networks Facebook & Twitter. The data is kept for a maximum of 36 months and then automatically deleted...',
          'I confirm that I have read and understood the Terms of Use...',
          'I confirm that I am the person who lost the item or that I am authorized to submit this report...'
        ].map((text, i) => (
          <div
            key={i}
            className="border border-gray-300 bg-gray-50 px-3 py-2.5 rounded-md flex items-start gap-2"
          >
            <input
              type="checkbox"
              checked={[confirm1, confirm2, confirm3][i]}
              onChange={(e) => {
                if (i === 0) setConfirm1(e.target.checked);
                if (i === 1) setConfirm2(e.target.checked);
                if (i === 2) setConfirm3(e.target.checked);
              }}
            />
            <p className="text-sm text-gray-700">{text}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4">
        <h4 className="text-md font-medium text-gray-800">Signature</h4>
        <div className="border border-gray-300 rounded px-4 py-3 bg-white">
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

      <div className="flex justify-between pt-4">
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
  );
}
