"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: any } }) => void;
  onNext: () => void;
  onBack: () => void;
  setFormData: (updater: any) => void;
}

export default function ReportFormStep2({ formData, onChange, onNext, onBack, setFormData }: Props) {
  const [confirm1, setConfirm1] = useState(!!formData.consent_contact);
  const [confirm2, setConfirm2] = useState(!!formData.consent_terms);
  const [confirm3, setConfirm3] = useState(!!formData.consent_authorized);

  const [previewUrl, setPreviewUrl] = useState<string>(formData.object_photo || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setConfirm1(!!formData.consent_contact);
    setConfirm2(!!formData.consent_terms);
    setConfirm3(!!formData.consent_authorized);
  }, [formData.consent_contact, formData.consent_terms, formData.consent_authorized]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
      const filename = `object_photo/lost-${Date.now()}-${safeName}`;

      const uploadResponse = await supabase.storage.from("images").upload(filename, file, { upsert: true });
      if (uploadResponse.error) throw uploadResponse.error;

      const publicUrlResponse = await supabase.storage.from("images").getPublicUrl(filename);
      const publicUrl = publicUrlResponse?.data?.publicUrl;
      if (!publicUrl) throw new Error("No public URL returned.");

      setFormData((prev: any) => ({ ...prev, object_photo: publicUrl }));
      setPreviewUrl(publicUrl);
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Error uploading image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const resetImage = () => {
    setFormData((prev: any) => ({ ...prev, object_photo: "" }));
    setPreviewUrl("");
  };

  const handleConfirmChange =
    (name: "consent_contact" | "consent_terms" | "consent_authorized") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      if (name === "consent_contact") setConfirm1(checked);
      if (name === "consent_terms") setConfirm2(checked);
      if (name === "consent_authorized") setConfirm3(checked);
      onChange({ target: { name, value: checked } });
    };

  const handleContinue = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name?.trim()) return alert("Please enter your first name.");
    if (!formData.last_name?.trim()) return alert("Please enter your last name.");
    if (!formData.email?.trim()) return alert("Please enter your email address.");
    if (!emailRegex.test(formData.email.trim())) return alert("Please enter a valid email address.");

    if (!confirm1 || !confirm2 || !confirm3) return alert("Please check all confirmation boxes.");

    onNext();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Step 3: Your contact details</h2>

      {[
        { label: "First name", name: "first_name" },
        { label: "Last name", name: "last_name" },
        { label: "Email address", name: "email", type: "email" },
        { label: "Phone number (optional)", name: "phone", type: "tel", optional: true },
        { label: "Postal address (optional)", name: "address", optional: true },
      ].map(({ label, name, type = "text", optional }) => (
        <div key={name}>
          <label className="block font-medium">
            {label}
            {optional && <span className="text-green-600"> (optional)</span>}
          </label>
          <input
            name={name}
            type={type}
            onChange={onChange as any}
            value={(formData as any)[name] || ""}
            className="w-full border px-3 py-1.5 rounded"
          />
        </div>
      ))}

      <div>
        <label className="block font-medium">
          Add a photo of the lost item <span className="text-green-600">(optional)</span>
        </label>

        {!previewUrl && <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />}

        {uploading && <p className="text-sm text-blue-600">Uploading...</p>}

        {previewUrl && (
          <div className="mt-2 space-y-2">
            <img src={previewUrl} alt="Preview" className="max-h-48 rounded border" />
            <button type="button" onClick={resetImage} className="text-sm text-red-600 underline">
              Change image
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        <h3 className="text-lg font-semibold">Final confirmation</h3>

        <div className="border border-gray-300 bg-gray-50 px-3 py-2.5 rounded-md flex items-start gap-2">
          <input id="consent_contact" name="consent_contact" type="checkbox" checked={confirm1} onChange={handleConfirmChange("consent_contact")} />
          <label htmlFor="consent_contact" className="text-sm text-gray-700">
            By submitting this form, I agree to be contacted if my item is found. My report may be published on reportlost.org and social media. Data is stored up to 36 months.
          </label>
        </div>

        <div className="border border-gray-300 bg-gray-50 px-3 py-2.5 rounded-md flex items-start gap-2">
          <input id="consent_terms" name="consent_terms" type="checkbox" checked={confirm2} onChange={handleConfirmChange("consent_terms")} />
          <label htmlFor="consent_terms" className="text-sm text-gray-700">I confirm that I have read and understood the Terms of Use.</label>
        </div>

        <div className="border border-gray-300 bg-gray-50 px-3 py-2.5 rounded-md flex items-start gap-2">
          <input id="consent_authorized" name="consent_authorized" type="checkbox" checked={confirm3} onChange={handleConfirmChange("consent_authorized")} />
          <label htmlFor="consent_authorized" className="text-sm text-gray-700">I confirm that I am the person who lost the item or authorized to report it.</label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300" onClick={onBack}>
          ← Back
        </button>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700" onClick={handleContinue}>
          Next
        </button>
      </div>
    </div>
  );
}
