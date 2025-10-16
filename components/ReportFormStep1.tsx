"use client";

import { useRef, useState } from "react";
import AutoCompleteCitySelect from "@/components/AutoCompleteCitySelect";
import { normalizeCityInput } from "@/lib/locationUtils";
import ObjectSuggest from "@/components/ObjectSuggest";

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onNext: () => void;
}

export default function ReportFormStep1({ formData, onChange, onNext }: Props) {
  const [showLocationStep, setShowLocationStep] = useState(false);
  const [showTime, setShowTime] = useState<boolean | null>(null);

  // Bannières
  const [showSuggestInfo, setShowSuggestInfo] = useState(true);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // ✅ Tous les hooks AVANT tout return conditionnel
  const dateRef = useRef<HTMLInputElement>(null);

  // bouton vert (inchangé pour Continue)
  const btnGreen =
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449] text-white font-semibold px-5 py-2.5 shadow";

  // ---- Sous-étape localisation (inchangée) ----
  if (showLocationStep) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Step 2: Where did the loss probably happen?</h2>

        <div>
          <label className="block font-medium">City</label>
          <AutoCompleteCitySelect
            value={formData.city || ""}
            onChange={(value: string) =>
              onChange({ target: { name: "city", value } } as React.ChangeEvent<HTMLInputElement>)
            }
            onSelect={(city) => {
              onChange({
                target: { name: "city", value: `${city.city_ascii} (${city.state_id})` },
              } as React.ChangeEvent<HTMLInputElement>);
              onChange({
                target: { name: "state_id", value: city.state_id },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
        </div>

        <div>
          <label className="block font-medium">Neighborhood (optional)</label>
          <input
            name="loss_neighborhood"
            onChange={onChange}
            value={formData.loss_neighborhood || ""}
            className="w-full border px-3 py-1.5 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Street (optional)</label>
          <input
            name="loss_street"
            onChange={onChange}
            value={formData.loss_street || ""}
            className="w-full border px-3 py-1.5 rounded"
          />
        </div>

        <div className="flex justify-between pt-4">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={() => setShowLocationStep(false)}
          >
            Back
          </button>
          <button
            className={btnGreen}
            onClick={() => {
              const normalized = normalizeCityInput(formData.city);
              if (!normalized.stateId) {
                alert('Please select a city with its state (e.g., choose "Chicago (IL)".)');
                return;
              }
              if (normalized.label !== (formData.city || "")) {
                onChange({ target: { name: "city", value: normalized.label } } as any);
              }
              if ((formData.state_id ?? null) !== normalized.stateId) {
                onChange({ target: { name: "state_id", value: normalized.stateId ?? "" } } as any);
              }
              onNext();
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // ---- Étape principale ----
  const titleFilled = (formData.title || "").trim().length > 0;

  // Ouvre le sélecteur de date en cliquant sur tout le champ
  const openDatePicker = () => {
    const el = dateRef.current;
    if (!el) return;
    el.focus();
    // @ts-ignore
    if (typeof el.showPicker === "function") el.showPicker();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step 1: Describe the lost item</h2>

      {/* What did you lose */}
      <div>
        <ObjectSuggest
          value={formData.title || ""}
          onChange={(val) =>
            onChange({ target: { name: "title", value: val } } as React.ChangeEvent<HTMLInputElement>)
          }
          onOtherSelected={() => setShowSuggestInfo(false)}
        />
      </div>

      {/* Bandeau info */}
      {showSuggestInfo && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
          If there isn’t an adequate suggestion, select <strong>“Other – My item isn’t listed”</strong> and
          enter the item’s category. You can provide details later.
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block font-medium mb-2">Please provide a detailed description</label>
        <textarea
          name="description"
          placeholder="Color, brand, unique features..."
          onFocus={() => {
            if (titleFilled) setShowSuggestInfo(false);
            setShowPrivacyInfo(true);
          }}
          onChange={onChange}
          value={formData.description || ""}
          className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Privacy banner */}
      {showPrivacyInfo && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
          For your privacy, please don’t include your phone number, email or last name. You’ll be able to add
          contact details on the next step.
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block font-medium">Date of the loss</label>
        <div
          className="inline-block"
          onClick={openDatePicker}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDatePicker()}
          role="button"
          tabIndex={0}
          aria-label="Open date picker"
        >
          <input
            ref={dateRef}
            name="date"
            type="date"
            max={today}
            onChange={onChange}
            value={formData.date || ""}
            className="cursor-pointer rounded-lg border border-green-300 text-[#226638] px-3 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#2ea052]"
          />
        </div>
      </div>

      {/* Approximate time? */}
      <div>
        <label className="block font-medium mb-2">Do you know the approximate time?</label>
        <div className="flex flex-col gap-2 text-[16px]">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="know_time"
              value="yes"
              checked={showTime === true}
              onChange={() => setShowTime(true)}
              className="h-4 w-4 text-[#226638] border-gray-300 focus:ring-[#2ea052]"
            />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="know_time"
              value="no"
              checked={showTime === false}
              onChange={() => setShowTime(false)}
              className="h-4 w-4 text-[#226638] border-gray-300 focus:ring-[#2ea052]"
            />
            <span>No</span>
          </label>
        </div>
      </div>

      {/* Time slot */}
      {showTime === true && (
        <div className="space-y-2">
          <label className="block font-medium">Estimated time slot</label>
          <div className="flex flex-wrap gap-2">
            {[
              "12 AM–6 AM",
              "6 AM–10 AM",
              "10 AM–2 PM",
              "2 PM–6 PM",
              "6 PM–10 PM",
              "10 PM–12 AM",
            ].map((slot) => (
              <label
                key={slot}
                className={`cursor-pointer select-none rounded-full border px-3 py-1.5 text-sm ${
                  formData.time_slot === slot
                    ? "bg-green-100 border-green-400 text-green-800"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="time_slot"
                  value={slot}
                  checked={formData.time_slot === slot}
                  onChange={onChange}
                  className="sr-only"
                />
                {slot}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Continue */}
      <div className="flex justify-end pt-4">
        <button
          className={btnGreen}
          onClick={() => {
            if (!(formData.title || "").trim() || !formData.description?.trim() || !formData.date?.trim()) {
              alert("Please fill in all required fields.");
              return;
            }
            setShowLocationStep(true);
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
