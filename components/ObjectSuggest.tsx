"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  items?: string[];
  limit?: number;
  autoFocus?: boolean;
  required?: boolean;
  onOtherSelected?: () => void; // permet au parent de masquer le bandeau d’info
};

const DEFAULT_ITEMS = [
  "Phone","Smartphone","Tablet","Laptop","Headphones","Wallet","Purse","Backpack","Suitcase","Keys",
  "Glasses","Sunglasses","Watch","Jewelry","Ring","Necklace","Bracelet","AirPods","ID card","Passport",
  "Driver's license","Credit card","Camera","Book","Umbrella","Jacket","Coat","Scarf","Hat","Shoes",
  "Medication","Hearing aid","Power tool","Musical instrument","Stroller"
];

function norm(s: string) {
  return (s || "").toLowerCase().replace(/[\s-_]+/g, " ").trim();
}
function scoreMatch(q: string, item: string) {
  const nq = norm(q), ni = norm(item);
  if (!nq) return 0;
  if (ni === nq) return 100;
  if (ni.startsWith(nq)) return 80;
  if (ni.includes(nq)) return 60;
  const words = nq.split(" ");
  return words.every((w) => ni.includes(w)) ? 50 : 0;
}

export default function ObjectSuggest({
  value,
  onChange,
  placeholder = "Start typing your item (e.g., Phone, Wallet, Passport)…",
  items,
  limit = 8,
  autoFocus,
  required,
  onOtherSelected,
}: Props) {
  const data = items && items.length ? items : DEFAULT_ITEMS;

  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!value) return data.slice(0, limit);
    return data
      .map((label) => ({ label, s: scoreMatch(value, label) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.label);
  }, [value, data, limit]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => { setCursor(0); }, [results.length, open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setOpen(true); return; }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % (results.length + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c - 1 + (results.length + 1)) % (results.length + 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (cursor < results.length) onPick(results[cursor]);
      else enterOtherMode();
    } else if (e.key === "Escape") setOpen(false);
  }

  function onPick(label: string) {
    onChange(label);
    setOpen(false);
    setCustomMode(false);
  }

  function enterOtherMode() {
    setCustomMode(true);
    setOpen(false);
    onOtherSelected?.(); // ✅ masque le bandeau côté parent
    if (!value) onChange("");
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="block font-medium mb-1">What did you lose?</label>

      <input
        ref={inputRef}
        type="text"
        required={required}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => { onChange(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="object-suggest-list"
        role="combobox"
      />

      {open && (
        <div
          id="object-suggest-list"
          role="listbox"
          className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
        >
          {results.length > 0 ? (
            results.map((label, i) => (
              <button
                key={label + i}
                type="button"
                role="option"
                aria-selected={cursor === i}
                className={`w-full text-left px-3 py-2 hover:bg-blue-50 ${cursor === i ? "bg-blue-50" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setCursor(i)}
                onClick={() => onPick(label)}
              >
                {label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">No suggestions.</div>
          )}

          {/* "Other" row — vert foncé */}
          <button
            type="button"
            role="option"
            aria-selected={cursor === results.length}
            className={`w-full text-left px-3 py-2 border-t ${cursor === results.length ? "bg-[#e6f3ea]" : "bg-white"} hover:bg-[#e6f3ea] text-[#226638] font-medium`}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setCursor(results.length)}
            onClick={enterOtherMode}
          >
            ➕ Other – My item isn't listed
          </button>
        </div>
      )}

      {customMode && (
        <div className="mt-3 border rounded-md bg-gray-50 p-3">
          <label className="block font-medium text-gray-800 mb-1">Enter your item’s category</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Example: medical device, power tool, necklace…"
            className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-sm text-gray-600 mt-2">
            Please type the <strong>main category</strong> of your item. You’ll be able to <strong>add detailed info and photos</strong> in the next step.
          </p>
        </div>
      )}
    </div>
  );
}
