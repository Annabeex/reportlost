// components/ReportFormStep2.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  formData: any;
  onChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      | { target: { name: string; value: any } }
  ) => void;
  onNext: () => void;
  onBack: () => void;
  setFormData: (updater: any) => void;
}

/* Small icons */
const CheckBadgeFilled = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <circle cx="12" cy="12" r="10" className="fill-[#2ea052]" />
    <path
      d="m7.5 12.5 2.8 2.8 6.2-6.6"
      className="stroke-white"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** ------------------------------------------------------------------
 * InfoSection: en-tête vert + contenu blanc dans le même encadré
 * ------------------------------------------------------------------ */
function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-green-200 overflow-hidden">
      {/* Header (fond vert doux) */}
      <div className="bg-[#eaf8ef] px-5 py-3">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-[18px] font-semibold text-[#1f6b3a]">{title}</h3>
        </div>
      </div>

      {/* Body (fond blanc) */}
      <div className="bg-white px-5 py-3">{children}</div>
    </div>
  );
}

/** Icônes contour vert (stroke), sans remplissage */
const SpeechBubbleOutline = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path
      d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9.8l-3.7 3V15A3 3 0 0 1 4 12V6Z"
      fill="none"
      stroke="#2ea052"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const MagnifierOutline = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <circle cx="11" cy="11" r="7" fill="none" stroke="#2ea052" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" stroke="#2ea052" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function ReportFormStep2({
  formData,
  onChange,
  onNext,
  onBack,
  setFormData,
}: Props) {
  const [stage, setStage] = useState<"contact" | "prefs">("contact");
  const [confirmAll, setConfirmAll] = useState(
    !!formData.consent_contact && !!formData.consent_terms && !!formData.consent_authorized
  );
  const [previewUrl, setPreviewUrl] = useState(formData.object_photo || "");
  const [uploading, setUploading] = useState(false);

  const btnGreen =
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449] text-white font-semibold px-6 py-2.5 shadow";
  const fieldCls =
    "w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400";

  useEffect(() => {
    setConfirmAll(
      !!formData.consent_contact && !!formData.consent_terms && !!formData.consent_authorized
    );
  }, [formData.consent_contact, formData.consent_terms, formData.consent_authorized]);

  // === File upload (natif)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
      const filename = `object_photo/lost-${Date.now()}-${safeName}`;
      const uploadResponse = await supabase.storage.from("images").upload(filename, file, {
        upsert: true,
      });
      if (uploadResponse.error) throw uploadResponse.error;
      const publicUrlResponse = await supabase.storage.from("images").getPublicUrl(filename);
      const publicUrl = publicUrlResponse?.data?.publicUrl;
      if (!publicUrl) throw new Error("No public URL returned.");
      setFormData((prev: any) => ({ ...prev, object_photo: publicUrl }));
      setPreviewUrl(publicUrl);
    } catch (err) {
      console.error(err);
      alert("Error uploading image. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  const resetImage = () => {
    setFormData((prev: any) => ({ ...prev, object_photo: "" }));
    setPreviewUrl("");
  };

  const handleMasterConsent = (checked: boolean) => {
    setConfirmAll(checked);
    onChange({ target: { name: "consent_contact", value: checked } });
    onChange({ target: { name: "consent_terms", value: checked } });
    onChange({ target: { name: "consent_authorized", value: checked } });
  };

  const goToPrefs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.first_name?.trim()) return alert("Please enter your first name.");
    if (!formData.last_name?.trim()) return alert("Please enter your last name.");
    if (!formData.email?.trim()) return alert("Please enter your email address.");
    if (!emailRegex.test(formData.email.trim())) return alert("Please enter a valid email address.");
    if (!confirmAll) return alert("Please confirm the checkbox.");
    setStage("prefs");
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">
        {stage === "contact" ? "Step 3: Your contact details" : "Step 4: Preferences"}
      </h2>

      {stage === "contact" && (
        <>
          {/* Declaration */}
          <div className="rounded-2xl border border-green-200 bg-white shadow-sm px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CheckBadgeFilled />
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-[#1f6b3a]">Declaration</h3>
                <p className="mt-1 text-[16px] leading-6 text-[#0f2b1c]">
                  Your report will be handled by a member of our team.
                  <br />
                  We operate <span className="font-semibold">7 days a week</span> to provide the best
                  possible service.
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">First name</label>
              <input
                name="first_name"
                value={formData.first_name || ""}
                onChange={onChange as any}
                className={fieldCls}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Last name</label>
              <input
                name="last_name"
                value={formData.last_name || ""}
                onChange={onChange as any}
                className={fieldCls}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email address</label>
              <input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={onChange as any}
                className={fieldCls}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Phone number</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={onChange as any}
                className={fieldCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">Postal address</label>
              <input
                name="address"
                value={formData.address || ""}
                onChange={onChange as any}
                className={fieldCls}
              />
            </div>
          </div>

          {/* File (bouton natif) */}
          <div>
            <label className="block font-medium mb-1">
              Add a photo of the lost item <span className="text-green-700">(optional)</span>
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

          {/* Privacy note */}
          <div className="rounded-2xl border border-green-200 bg-[#f2fbf5] px-4 py-3 md:px-5 md:py-4">
            <p className="text-[15px] leading-6 text-[#0f2b1c]">
              Your contact details are only used to reach you if there’s a match with a found item.
              <br />
              We protect your privacy — your information will not be made public.
            </p>
          </div>

          {/* Consent (une seule case) */}
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 md:px-5 md:py-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-gray-300 text-[#226638] focus:ring-[#226638]"
                checked={confirmAll}
                onChange={(e) => handleMasterConsent(e.target.checked)}
              />
              <span className="text-[17px] leading-7 text-[#111827]">
                I confirm I’ve read and accept the{" "}
                <a
                  href="https://reportlost.org/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="https://reportlost.org/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  Privacy Policy
                </a>
                . I agree to be contacted and I confirm I am the owner of the item or authorized to
                report it.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <button
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              onClick={onBack}
            >
              ← Back
            </button>
            <button className={btnGreen} onClick={goToPrefs}>
              Continue
            </button>
          </div>
        </>
      )}

      {stage === "prefs" && (
        <>
          {/* --- Communication block (header vert + body blanc) --- */}
          <InfoSection icon={<SpeechBubbleOutline />} title="Communication">
            <p className="text-[15px] text-[#0f2b1c]">
              In case we need more details, please tell us your preferred communication channel.
            </p>
          </InfoSection>

          {/* Radios (hors encadré) */}
          <div className="pl-8 space-y-2 text-[16px] mt-3">
            {[
              { key: "email", label: "E-mail" },
              { key: "call", label: "Phone call" },
              { key: "sms", label: "SMS" },
              { key: "any", label: "Anything works for me" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="preferred_contact_channel"
                  className="h-4 w-4 text-[#226638] border-gray-300 focus:ring-[#226638]"
                  checked={(formData.preferred_contact_channel || "email") === key}
                  onChange={() =>
                    onChange({ target: { name: "preferred_contact_channel", value: key } })
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* --- Searches block (header vert + body blanc) --- */}
          <div className="mt-6">
            <InfoSection icon={<MagnifierOutline />} title="Searches">
              <p className="text-[15px] text-[#0f2b1c]">
                Each report is actively searched and shared across multiple platforms for better
                results.
              </p>
            </InfoSection>
          </div>

          {/* Radios (hors encadré) */}
          <div className="pl-8 space-y-2 text-[16px] mt-3">
            {[
              { key: true, label: "Yes, email me a summary of the searches." },
              { key: false, label: "No, thanks." },
            ].map(({ key, label }) => (
              <label key={String(key)} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="research_report_opt_in"
                  className="h-4 w-4 text-[#226638] border-gray-300 focus:ring-[#226638]"
                  checked={Boolean(formData.research_report_opt_in) === key}
                  onChange={() =>
                    onChange({ target: { name: "research_report_opt_in", value: key } })
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* Nav */}
          <div className="flex justify-between pt-4">
            <button
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              onClick={() => setStage("contact")}
            >
              ← Back
            </button>
            <button className={btnGreen} onClick={onNext}>
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}
