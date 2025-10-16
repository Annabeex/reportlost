// components/ReportFormStep1.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import AutoCompleteCitySelect from "@/components/AutoCompleteCitySelect";
import { normalizeCityInput } from "@/lib/locationUtils";
import ObjectSuggest from "@/components/ObjectSuggest";

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onNext: () => void;
}

/* --- Listes (inchangées) --- */
const TRANSPORT_OPTIONS = [
  "Airplane",
  "Metro / Subway",
  "Tram",
  "Train",
  "Rideshare (Uber/Lyft)",
  "Taxi",
  "Bus",
  "Coach",
  "Shuttle",
  "Ferry / Boat",
  "Other (not listed)",
];

const PLACE_OPTIONS = [
  "On the street","City center / downtown","Parking lot / garage","Cafe","Bar","Restaurant","Park",
  "Shopping mall","At an event","Cinema / movie theater","Train station","University / campus","Ice rink",
  "Swimming pool","Bus stop","Coach stop","Subway / metro station","Tram stop","Concert","Festival",
  "Sports match / stadium","Toll station","Rally / gathering","Show / theater","Conference","Exhibition / fair",
  "Roadside","Forest","Mountain","Airport","Store / shop","Supermarket","Airplane","Boat","Hospital","Zoo",
  "Ambulance","Nightclub","Library","Fitting room","Church","Recycling center","School","Shopping gallery",
  "Market","Gym / fitness center","Waiting room","Gas station","Highway service area","Campground","Car","Bridge",
  "Beach","Bench","Path / trail","Sidewalk","Playground","Rest area","Cycle path / bikeway","Ski slope",
  "Square / plaza","Terrace / patio","Other (not listed)",
];

const TRAIN_COMPANIES_US = [
  "Amtrak","Caltrain","Metra","NJ Transit","MARC","LIRR","Metro-North Railroad","MBTA Commuter Rail","Tri-Rail",
  "Sounder","FrontRunner","SunRail","Coaster","ACE","VRE","Metrolink","BART (eBART)","Other (not listed)",
];

const RIDESHARE_PLATFORMS_US = ["Uber","Lyft","Via","Other (not listed)"];

/* =========================================================================
   LocalSuggest — dropdown custom avec le même look qu’ObjectSuggest
   ========================================================================= */
type LocalSuggestProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  options: string[];
  includeOther?: boolean;      // <- NEW (defaut true)
  otherText?: string;          // <- NEW (defaut "Other (not listed)")
};

function LocalSuggest({
  value,
  onChange,
  placeholder = "Start typing...",
  options,
  includeOther = true,
  otherText = "Other (not listed)",
}: LocalSuggestProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value || ""), [value]);

  const filtered = options
    .filter((opt) => opt.toLowerCase().includes((query || "").toLowerCase()))
    .slice(0, 8);

  const rowCount = filtered.length + (includeOther ? 1 : 0);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const baseInput =
    "w-full rounded-lg border border-blue-200 px-3 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-400";

  const select = (val: string) => {
    onChange(val);
    setQuery(val);
    setOpen(false);
  };

  const selectOther = () => {
    // On force "Other (not listed)" pour déclencher transportIsOther / placeIsOther côté parent
    select(otherText);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        className={baseInput}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (!open || rowCount === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, rowCount - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (active < filtered.length) select(filtered[active]);
            else if (includeOther) selectOther();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && rowCount > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <ul className="max-h-64 overflow-auto">
            {filtered.map((opt, idx) => (
              <li
                key={opt}
                className={`cursor-pointer px-3 py-2 text-[15px] ${
                  idx === active ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(opt);
                }}
              >
                {opt}
              </li>
            ))}

            {includeOther && (
              <li
                className={`cursor-pointer px-3 py-2 text-[15px] border-t ${
                  active === filtered.length ? "bg-[#e6f3ea]" : "bg-white hover:bg-[#e6f3ea]"
                } text-[#226638] font-medium`}
                onMouseEnter={() => setActive(filtered.length)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOther();
                }}
              >
                ➕ {otherText}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */

export default function ReportFormStep1({ formData, onChange, onNext }: Props) {
  // Phases
  const [phase, setPhase] = useState<"basic" | "context">("basic");

  // États (ordre constant)
  const [showTime, setShowTime] = useState<boolean | null>(null);
  const [transportAnswer, setTransportAnswer] = useState<"yes" | "no" | "maybe" | null>(
    formData.transport_answer ?? null
  );
  const [transportIsOther, setTransportIsOther] = useState(
    (formData.transport_type || "").toLowerCase() === "other (not listed)"
  );
  const [placeIsOther, setPlaceIsOther] = useState(
    (formData.place_type || "").toLowerCase() === "other (not listed)"
  );

  const [showSuggestInfo, setShowSuggestInfo] = useState(true);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const btnGreen =
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449] text-white font-semibold px-5 py-2.5 shadow";
  const radioCls =
    "h-4 w-4 text-[#226638] border-gray-300 focus:ring-[#226638] cursor-pointer";
  const labelRadio = "inline-flex items-center gap-2 cursor-pointer";
  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#226638]";

  // Date picker cliquable
  const dateRef = useRef<HTMLInputElement>(null);
  const openDatePicker = () => {
    const el = dateRef.current;
    if (!el) return;
    el.focus();
    // @ts-ignore
    if (typeof el.showPicker === "function") el.showPicker();
  };

  /* Handlers */
  const handleTransportChange = (val: string) => {
    setTransportIsOther(val === "Other (not listed)");
    onChange({ target: { name: "transport_type", value: val } } as any);
    if (val !== "Other (not listed)") {
      onChange({ target: { name: "transport_type_other", value: "" } } as any);
    }
    // reset spécifiques
    onChange({ target: { name: "airline_name", value: "" } } as any);
    onChange({ target: { name: "metro_line_known", value: null } } as any);
    onChange({ target: { name: "metro_line", value: "" } } as any);
    onChange({ target: { name: "train_company", value: "" } } as any);
    onChange({ target: { name: "rideshare_platform", value: "" } } as any);
    onChange({ target: { name: "taxi_company_known", value: null } } as any);
    onChange({ target: { name: "taxi_company", value: "" } } as any);
  };

  const handlePlaceChange = (val: string) => {
    setPlaceIsOther(val === "Other (not listed)");
    onChange({ target: { name: "place_type", value: val } } as any);
    if (val !== "Other (not listed)") {
      onChange({ target: { name: "place_type_other", value: "" } } as any);
    }
  };

  const goToContextPhase = () => {
    if (!(formData.title || "").trim() || !formData.description?.trim() || !formData.date?.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    setPhase("context");
  };

  const finishContextAndNext = () => {
    if (!formData.city?.trim()) return alert("Please enter the city.");
    if (!transportAnswer) return alert("Please answer the transport question.");

    if (transportAnswer === "yes") {
      const t = (formData.transport_type || "").toLowerCase();
      if (!formData.transport_type && !formData.transport_type_other) {
        alert("Please select the transport type or enter one.");
        return;
      }
      if (t === "airplane") {
        if (!formData.airline_name?.trim()) return alert("Please enter the airline name.");
        if (!formData.travel_number?.trim()) return alert("Please enter the flight number.");
      }
      if (t === "metro / subway" || t === "tram") {
        if (formData.metro_line_known === true && !formData.metro_line?.trim()) {
          return alert("Please enter the metro/tram line.");
        }
      }
      if (t === "train") {
        if (!formData.train_company?.trim()) return alert("Please select the train company.");
      }
      if (t === "rideshare (uber/lyft)") {
        if (!formData.rideshare_platform?.trim()) return alert("Please select the rideshare platform.");
      }
    } else {
      if (!formData.place_type?.trim() && !formData.place_type_other?.trim()) {
        return alert("Please specify the place or add one.");
      }
    }

    onNext();
  };

  const titleFilled = (formData.title || "").trim().length > 0;

  return (
    <div className="space-y-6">
      {/* ================= PHASE 1 ================= */}
      {phase === "basic" && (
        <>
          <h2 className="text-xl font-bold">Step 1: Describe the lost item</h2>

          {/* What did you lose — composant existant (garde ton design) */}
          <div>
            <ObjectSuggest
              value={formData.title || ""}
              onChange={(val) =>
                onChange({ target: { name: "title", value: val } } as React.ChangeEvent<HTMLInputElement>)
              }
            />
          </div>

          {showSuggestInfo && (
            <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
              If there isn’t an adequate suggestion, select <strong>“Other – My item isn’t listed”</strong> and
              enter the item’s category. You can provide details later.
            </div>
          )}

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

          {showPrivacyInfo && (
            <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
              For your privacy, please don’t include your phone number, email or last name. You’ll be able to add
              contact details on the next step.
            </div>
          )}

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
                className="cursor-pointer rounded-lg border border-blue-200 px-3 py-2.5 text-[16px] text-[#226638] focus:outline-none focus:ring-2 focus:ring-[#226638]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">Do you know the approximate time?</label>
            <div className="flex flex-col gap-2 text-[16px]">
              <label className={labelRadio}>
                <input
                  type="radio"
                  name="know_time"
                  value="yes"
                  checked={showTime === true}
                  onChange={() => setShowTime(true)}
                  className={radioCls}
                />
                <span>Yes</span>
              </label>
              <label className={labelRadio}>
                <input
                  type="radio"
                  name="know_time"
                  value="no"
                  checked={showTime === false}
                  onChange={() => setShowTime(false)}
                  className={radioCls}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {showTime === true && (
            <div className="space-y-2">
              <label className="block font-medium">Estimated time slot</label>
              <div className="flex flex-wrap gap-2">
                {["12 AM–6 AM","6 AM–10 AM","10 AM–2 PM","2 PM–6 PM","6 PM–10 PM","10 PM–12 AM"].map((slot) => (
                  <label
                    key={slot}
                    className={`cursor-pointer select-none rounded-full border px-3 py-1.5 text-sm ${
                      formData.time_slot === slot ? "bg-green-100 border-green-400 text-green-800" : "border-gray-300 hover:bg-gray-50"
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

          <div className="flex justify-end pt-4">
            <button className={btnGreen} onClick={goToContextPhase}>
              Continue
            </button>
          </div>
        </>
      )}

      {/* ================= PHASE 2 ================= */}
      {phase === "context" && (
        <>
          <h2 className="text-xl font-bold">Step 2: Where the loss probably happen ?</h2>

          {/* City */}
          <div>
            <label className="block font-medium">City</label>
            <AutoCompleteCitySelect
              value={formData.city || ""}
              placeholder="e.g. Chicago"
              onChange={(value: string) =>
                onChange({ target: { name: "city", value } } as React.ChangeEvent<HTMLInputElement>)
              }
              onSelect={(city) => {
                onChange({ target: { name: "city", value: `${city.city_ascii}` } } as any);
                onChange({ target: { name: "state_id", value: city.state_id } } as any);
              }}
            />
          </div>

          {/* Transport question */}
          <div>
            <p className="block font-medium mb-2">Was it during a transport?</p>
            <div className="flex flex-col gap-2 text-[16px]">
              {(["yes", "no", "maybe"] as const).map((v) => (
                <label key={v} className={labelRadio}>
                  <input
                    type="radio"
                    name="transport_answer"
                    value={v}
                    checked={transportAnswer === v}
                    onChange={() => {
                      setTransportAnswer(v);
                      onChange({ target: { name: "transport_answer", value: v } } as any);
                    }}
                    className={radioCls}
                  />
                  <span className="capitalize">{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* YES -> sélecteurs custom (design identique à “What did you lose?”) */}
          {transportAnswer === "yes" && (
            <div className="space-y-4">
              {/* Transport type */}
              <div>
                <label className="block font-medium">Please select the transport type:</label>
                <LocalSuggest
                  value={formData.transport_type || ""}
                  onChange={(val) => handleTransportChange(val)}
                  options={TRANSPORT_OPTIONS}
                  placeholder="Start typing..."
                />
                {transportIsOther && (
                  <input
                    type="text"
                    placeholder="Type your transport…"
                    className={inputCls + " mt-2"}
                    value={formData.transport_type_other || ""}
                    onChange={(e) =>
                      onChange({ target: { name: "transport_type_other", value: e.target.value } } as any)
                    }
                  />
                )}
              </div>

              {/* Airplane */}
              {formData.transport_type === "Airplane" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium">Airline name</label>
                    <input
                      className={inputCls}
                      value={formData.airline_name || ""}
                      onChange={(e) => onChange({ target: { name: "airline_name", value: e.target.value } } as any)}
                      placeholder="e.g., Delta, United…"
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Flight number</label>
                    <input
                      className={inputCls}
                      value={formData.travel_number || ""}
                      onChange={(e) => onChange({ target: { name: "travel_number", value: e.target.value } } as any)}
                      placeholder="e.g., UA123"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium">Departure place</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., JFK Terminal 4"
                        value={formData.departure_place || ""}
                        onChange={(e) => onChange({ target: { name: "departure_place", value: e.target.value } } as any)}
                      />
                      <label className="block font-medium mt-2">Departure time</label>
                      <input
                        type="time"
                        className={inputCls}
                        value={formData.departure_time || ""}
                        onChange={(e) => onChange({ target: { name: "departure_time", value: e.target.value } } as any)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Arrival place</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., SFO Gate A7"
                        value={formData.arrival_place || ""}
                        onChange={(e) => onChange({ target: { name: "arrival_place", value: e.target.value } } as any)}
                      />
                      <label className="block font-medium mt-2">Arrival time</label>
                      <input
                        type="time"
                        className={inputCls}
                        value={formData.arrival_time || ""}
                        onChange={(e) => onChange({ target: { name: "arrival_time", value: e.target.value } } as any)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Metro / Tram */}
              {(formData.transport_type === "Metro / Subway" || formData.transport_type === "Tram") && (
                <div className="space-y-3">
                  <p className="block font-medium">Do you know on which line it happened?</p>
                  <div className="flex flex-col gap-2">
                    {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(({ v, l }) => (
                      <label key={String(v)} className={labelRadio}>
                        <input
                          type="radio"
                          className={radioCls}
                          name="metro_line_known"
                          value={String(v)}
                          checked={formData.metro_line_known === v}
                          onChange={() => onChange({ target: { name: "metro_line_known", value: v } } as any)}
                        />
                        <span>{l}</span>
                      </label>
                    ))}
                  </div>
                  {formData.metro_line_known === true && (
                    <div>
                      <label className="block font-medium">Metro/Tram line</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., Line 2, M, Green Line…"
                        value={formData.metro_line || ""}
                        onChange={(e) => onChange({ target: { name: "metro_line", value: e.target.value } } as any)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium">Departure place</label>
                      <input
                        className={inputCls}
                        value={formData.departure_place || ""}
                        onChange={(e) => onChange({ target: { name: "departure_place", value: e.target.value } } as any)}
                        placeholder="e.g., 5th Ave Station"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Arrival place</label>
                      <input
                        className={inputCls}
                        value={formData.arrival_place || ""}
                        onChange={(e) => onChange({ target: { name: "arrival_place", value: e.target.value } } as any)}
                        placeholder="e.g., Central Station"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Train */}
              {formData.transport_type === "Train" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium">Train company</label>
                    <LocalSuggest
                      value={formData.train_company || ""}
                      onChange={(val) => onChange({ target: { name: "train_company", value: val } } as any)}
                      options={TRAIN_COMPANIES_US}
                      placeholder="Start typing..."
                    />
                  </div>

                  <div>
                    <label className="block font-medium">Do you know the train number?</label>
                    <input
                      className={inputCls}
                      placeholder="If known, enter the train number (optional)"
                      value={formData.travel_number || ""}
                      onChange={(e) => onChange({ target: { name: "travel_number", value: e.target.value } } as any)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium">Departure place</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., Chicago Union Station"
                        value={formData.departure_place || ""}
                        onChange={(e) => onChange({ target: { name: "departure_place", value: e.target.value } } as any)}
                      />
                      <label className="block font-medium mt-2">Departure time</label>
                      <input
                        type="time"
                        className={inputCls}
                        value={formData.departure_time || ""}
                        onChange={(e) => onChange({ target: { name: "departure_time", value: e.target.value } } as any)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Arrival place</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., St. Louis Gateway"
                        value={formData.arrival_place || ""}
                        onChange={(e) => onChange({ target: { name: "arrival_place", value: e.target.value } } as any)}
                      />
                      <label className="block font-medium mt-2">Arrival time</label>
                      <input
                        type="time"
                        className={inputCls}
                        value={formData.arrival_time || ""}
                        onChange={(e) => onChange({ target: { name: "arrival_time", value: e.target.value } } as any)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rideshare */}
              {formData.transport_type === "Rideshare (Uber/Lyft)" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium">Rideshare platform</label>
                    <LocalSuggest
                      value={formData.rideshare_platform || ""}
                      onChange={(val) =>
                        onChange({ target: { name: "rideshare_platform", value: val } } as any)
                      }
                      options={RIDESHARE_PLATFORMS_US}
                      placeholder="Start typing..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium">Departure place</label>
                      <input
                        className={inputCls}
                        value={formData.departure_place || ""}
                        onChange={(e) =>
                          onChange({ target: { name: "departure_place", value: e.target.value } } as any)
                        }
                        placeholder="e.g., Home, Airport…"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Arrival place</label>
                      <input
                        className={inputCls}
                        value={formData.arrival_place || ""}
                        onChange={(e) =>
                          onChange({ target: { name: "arrival_place", value: e.target.value } } as any)
                        }
                        placeholder="e.g., Office, Hotel…"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bus/Coach/Shuttle/Ferry/Other */}
              {["Bus","Coach","Shuttle","Ferry / Boat","Other (not listed)"].includes(formData.transport_type) && (
                <div className="space-y-3">
                  <label className="block font-medium">
                    Please provide the transport name and/or number (optional)
                  </label>
                  <input
                    className={inputCls}
                    placeholder="e.g., Bus #42, Shuttle A, Ferry Ref ABC…"
                    value={formData.travel_number || ""}
                    onChange={(e) => onChange({ target: { name: "travel_number", value: e.target.value } } as any)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium">Departure place</label>
                      <input
                        className={inputCls}
                        value={formData.departure_place || ""}
                        onChange={(e) =>
                          onChange({ target: { name: "departure_place", value: e.target.value } } as any)
                        }
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Arrival place</label>
                      <input
                        className={inputCls}
                        value={formData.arrival_place || ""}
                        onChange={(e) =>
                          onChange({ target: { name: "arrival_place", value: e.target.value } } as any)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {(transportAnswer === "no" || transportAnswer === "maybe") && (
            <div className="space-y-2">
              <label className="block font-medium">Please specify the place</label>
              <LocalSuggest
                value={formData.place_type || ""}
                onChange={(val) => handlePlaceChange(val)}
                options={PLACE_OPTIONS}
                placeholder="Start typing..."
              />
              {placeIsOther && (
                <input
                  type="text"
                  placeholder="Type your place…"
                  className={inputCls + " mt-2"}
                  value={formData.place_type_other || ""}
                  onChange={(e) =>
                    onChange({ target: { name: "place_type_other", value: e.target.value } } as any)
                  }
                />
              )}
            </div>
          )}

          {/* Circumstances — toujours à la fin */}
          <div>
            <label className="block font-medium">Circumstances of loss (optional)</label>
            <textarea
              name="circumstances"
              placeholder="e.g., I forgot it in the rear seat pocket of the taxi…"
              value={formData.circumstances || ""}
              onChange={onChange}
              className={inputCls + " min-h-[88px]"}
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
              onClick={() => setPhase("basic")}
            >
              ← Back
            </button>
            <button type="button" className={btnGreen} onClick={finishContextAndNext}>
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}
