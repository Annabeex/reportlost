"use client";

// Générateur d'affiche animal perdu — 100% côté navigateur (gratuit, aucune donnée envoyée).
// Photo uploadée en data-URL, QR code mailto généré localement, export PNG (html2canvas)
// et PDF A4 (jspdf).

import { useEffect, useRef, useState } from "react";

const ANIMALS = ["DOG", "CAT", "BIRD", "RABBIT", "PET"] as const;

export default function LostPetPosterMaker() {
  const [animal, setAnimal] = useState<(typeof ANIMALS)[number]>("DOG");
  const [petName, setPetName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [lastSeen, setLastSeen] = useState("");
  const [date, setDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [reward, setReward] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const posterRef = useRef<HTMLDivElement | null>(null);

  // QR code -> mailto (généré localement avec la lib qrcode déjà présente)
  useEffect(() => {
    let cancelled = false;
    async function gen() {
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
        setQrDataUrl(null);
        return;
      }
      try {
        const QRCode = (await import("qrcode")).default;
        const subject = encodeURIComponent(`Found ${animal.toLowerCase()}${petName ? ` — ${petName}` : ""}`);
        const url = await QRCode.toDataURL(`mailto:${email.trim()}?subject=${subject}`, {
          margin: 1,
          width: 240,
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }
    gen();
    return () => {
      cancelled = true;
    };
  }, [email, animal, petName]);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(f);
  }

  async function capture(): Promise<HTMLCanvasElement | null> {
    if (!posterRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(posterRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  }

  async function downloadPng() {
    setDownloading("png");
    try {
      const canvas = await capture();
      if (!canvas) return;
      const a = document.createElement("a");
      a.download = `lost-${animal.toLowerCase()}${petName ? "-" + petName.toLowerCase() : ""}-poster.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setDownloading(null);
    }
  }

  async function downloadPdf() {
    setDownloading("pdf");
    try {
      const canvas = await capture();
      if (!canvas) return;
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const imgH = (canvas.height * pageW) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, Math.max(0, (pageH - imgH) / 2), pageW, Math.min(imgH, pageH));
      pdf.save(`lost-${animal.toLowerCase()}${petName ? "-" + petName.toLowerCase() : ""}-poster.pdf`);
    } finally {
      setDownloading(null);
    }
  }

  const inputCls = "w-full rounded border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ---- Formulaire ---- */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Animal</label>
            <select className={inputCls} value={animal} onChange={(e) => setAnimal(e.target.value as any)}>
              {ANIMALS.map((a) => (
                <option key={a} value={a}>
                  {a.charAt(0) + a.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Pet name</label>
            <input className={inputCls} placeholder="Luna" value={petName} onChange={(e) => setPetName(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">Photo (a clear, recent one)</label>
          <input type="file" accept="image/*" onChange={onPhoto} className="mt-1 block w-full text-sm" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">Description (breed, color, size, distinctive marks)</label>
          <textarea
            className={`${inputCls} h-20`}
            placeholder="Small brown terrier mix, red collar, white patch on chest"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Last seen (place)</label>
            <input className={inputCls} placeholder="Maple Street & 5th Ave, Austin TX" value={lastSeen} onChange={(e) => setLastSeen(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Date</label>
            <input className={inputCls} placeholder="July 10, 2026" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Phone (large on the poster)</label>
            <input className={inputCls} placeholder="(512) 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Email (creates the QR code)</label>
            <input className={inputCls} placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Personal note (optional)</label>
            <input className={inputCls} placeholder="She's shy — please don't chase, just call" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Reward (optional)</label>
            <input className={inputCls} placeholder="$200 reward" value={reward} onChange={(e) => setReward(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={downloadPng}
            disabled={!!downloading}
            className="rounded-lg bg-green-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-green-700 disabled:opacity-50"
          >
            {downloading === "png" ? "Preparing…" : "⬇️ Download PNG (free)"}
          </button>
          <button
            onClick={downloadPdf}
            disabled={!!downloading}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
          >
            {downloading === "pdf" ? "Preparing…" : "🖨️ Download PDF (print-ready)"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          100% free — the poster is created in your browser. Your photo and details are never uploaded to our servers.
        </p>
      </div>

      {/* ---- Aperçu de l'affiche ---- */}
      <div>
        <div
          ref={posterRef}
          className="mx-auto w-full max-w-[520px] overflow-hidden border border-gray-200 bg-white shadow-lg"
          style={{ aspectRatio: "210/297", fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {/* Bandeau */}
          <div className="bg-red-600 py-4 text-center">
            <div className="text-5xl font-extrabold tracking-wider text-white">LOST {animal}</div>
            {petName && <div className="mt-1 text-2xl font-bold text-red-100">&ldquo;{petName}&rdquo;</div>}
          </div>

          {/* Photo */}
          <div className="flex justify-center px-6 pt-5">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Lost pet" className="h-56 w-full rounded-xl border-4 border-gray-800 object-cover" />
            ) : (
              <div className="flex h-56 w-full items-center justify-center rounded-xl border-4 border-dashed border-gray-300 text-gray-400">
                Your pet&rsquo;s photo here
              </div>
            )}
          </div>

          {/* Détails */}
          <div className="space-y-2 px-6 pt-4 text-center">
            {description && <p className="text-base font-medium leading-snug text-gray-900">{description}</p>}
            {(lastSeen || date) && (
              <p className="text-sm text-gray-800">
                <strong>Last seen:</strong> {lastSeen}
                {lastSeen && date ? " — " : ""}
                {date}
              </p>
            )}
            {note && <p className="text-sm italic text-gray-700">“{note}”</p>}
            {reward && <p className="text-lg font-extrabold text-red-600">{reward.toUpperCase()}</p>}
          </div>

          {/* Contact */}
          <div className="mt-4 border-t-4 border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                  If you see {petName || `this ${animal.toLowerCase()}`}, please call
                </div>
                <div className="mt-1 break-words text-3xl font-extrabold text-gray-900">{phone || "(___) ___-____"}</div>
              </div>
              {qrDataUrl && (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR code to email the owner" className="mx-auto h-24 w-24" />
                  <div className="mt-1 text-[10px] font-medium text-gray-600">Scan to email the owner</div>
                </div>
              )}
            </div>
          </div>

          {/* Pied */}
          <div className="bg-gray-100 py-2 text-center text-[11px] text-gray-500">
            Free poster by ReportLost.org — lost &amp; found assistance in the USA
          </div>
        </div>
      </div>
    </div>
  );
}
