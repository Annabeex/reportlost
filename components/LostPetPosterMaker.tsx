"use client";

// Générateur d'affiche animal perdu — 100% côté navigateur (gratuit, aucune donnée envoyée).
// Photo uploadée en data-URL, QR code mailto généré localement, export PNG (html2canvas)
// et PDF A4 (jspdf).

import { useEffect, useRef, useState } from "react";

const ANIMALS = ["DOG", "CAT", "BIRD", "RABBIT", "PET", "OTHER"] as const;

// Exemple affiché tant que le champ correspondant est vide : la personne voit
// le rendu final immédiatement, et chaque exemple disparaît dès qu'elle tape.
const EXAMPLE = {
  petName: "Luna",
  photo: "/images/lost-pet-example.jpg",
  description: "Small brown terrier mix, red collar, white patch on chest",
  lastSeen: "Maple Street & 5th Ave",
  date: "July 10, 2026",
  phone: "(512) 555-0123",
  note: "She's shy, please don't chase her, just call",
  reward: "$200 REWARD",
};

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
  const [photoError, setPhotoError] = useState(false);
  // Champs optionnels : dès que la personne y touche, l'exemple ne revient plus
  // (champ vidé = section masquée sur l'affiche)
  const [noteTouched, setNoteTouched] = useState(false);
  const [rewardTouched, setRewardTouched] = useState(false);

  const posterRef = useRef<HTMLDivElement | null>(null);

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());

  // QR code -> mailto (généré localement avec la lib qrcode déjà présente).
  // Sans email : un QR de démonstration (vers cette page) pour montrer le rendu final.
  useEffect(() => {
    let cancelled = false;
    async function gen() {
      try {
        const QRCode = (await import("qrcode")).default;
        const target = emailValid
          ? `mailto:${email.trim()}?subject=${encodeURIComponent(
              `Found ${animal.toLowerCase()}${petName ? `, ${petName}` : ""}`
            )}`
          : "https://reportlost.org/lost-pet-poster";
        const url = await QRCode.toDataURL(target, { margin: 1, width: 240 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }
    gen();
    return () => {
      cancelled = true;
    };
  }, [email, emailValid, animal, petName]);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(f);
  }

  async function capture(): Promise<HTMLCanvasElement | null> {
    if (!posterRef.current) return null;
    const el = posterRef.current;
    // On fige la hauteur A4 en pixels le temps de la capture (aspect-ratio n'est
    // pas fiable dans les moteurs de capture), puis on restaure.
    const prevHeight = el.style.height;
    el.style.height = `${Math.round((el.clientWidth * 297) / 210)}px`;
    try {
      // 1) html-to-image : le navigateur rasterise lui-même le DOM (fidèle au pixel)
      try {
        const { toCanvas } = await import("html-to-image");
        return await toCanvas(el, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
      } catch (e) {
        console.warn("html-to-image indisponible, repli html2canvas:", e);
      }
      // 2) Repli : html2canvas
      const html2canvas = (await import("html2canvas")).default;
      return await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    } finally {
      el.style.height = prevHeight;
    }
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
            <input
              className={inputCls}
              placeholder="She's shy, please don't chase, just call"
              value={note}
              onChange={(e) => {
                setNoteTouched(true);
                setNote(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Reward (optional)</label>
            <input
              className={inputCls}
              placeholder="$200 reward"
              value={reward}
              onChange={(e) => {
                setRewardTouched(true);
                setReward(e.target.value);
              }}
            />
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
        <p className="mb-2 text-center text-xs text-gray-500">
          👀 Example preview, your edits replace it live
        </p>
        <div
          ref={posterRef}
          className="mx-auto w-full max-w-[520px] overflow-hidden border border-gray-200 bg-white shadow-lg"
          style={{ aspectRatio: "210/297", fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {/* Bandeau (structure 100% flex : rendu fiable en capture PNG/PDF) */}
          <div
            className="flex flex-col items-center py-5"
            style={{ background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)", gap: "12px" }}
          >
            <div
              className="flex text-[44px] font-extrabold text-white"
              style={{ letterSpacing: "0.12em", lineHeight: "44px" }}
            >
              LOST {animal}
            </div>
            <div
              className="flex items-center rounded-full bg-white px-5 text-xl font-extrabold text-red-600"
              style={{ height: "36px", lineHeight: "36px" }}
            >
              “{petName || EXAMPLE.petName}”
            </div>
          </div>

          {/* Photo */}
          <div className="flex justify-center px-7 pt-6">
            {photoError ? (
              <div
                className="flex h-60 w-full items-center justify-center rounded-2xl text-7xl"
                style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}
              >
                🐕
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo || EXAMPLE.photo}
                alt="Lost pet"
                onError={() => setPhotoError(true)}
                className="h-60 w-full rounded-2xl object-cover shadow-lg"
                style={{ border: "5px solid #ffffff", outline: "1px solid #e5e7eb" }}
              />
            )}
          </div>

          {/* Détails (structure 100% flex) */}
          <div className="flex flex-col items-center px-7 pt-4" style={{ gap: "10px" }}>
            <p className="m-0 text-center text-[17px] font-semibold leading-snug text-gray-900">
              {description || EXAMPLE.description}
            </p>
            <p className="m-0 text-center text-sm text-gray-700">
              📍 <strong>Last seen:</strong> {lastSeen || EXAMPLE.lastSeen}, {date || EXAMPLE.date}
            </p>
            {(note || (!noteTouched && EXAMPLE.note)) && (
              <div className="flex max-w-[85%] items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                <span className="text-center text-sm italic text-gray-800">“{note || EXAMPLE.note}”</span>
              </div>
            )}
            {(reward || (!rewardTouched && EXAMPLE.reward)) && (
              <div
                className="flex items-center rounded-full bg-red-600 px-5 text-lg font-extrabold text-white"
                style={{ height: "38px", lineHeight: "38px", letterSpacing: "0.03em" }}
              >
                {(reward || EXAMPLE.reward).toUpperCase()}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="mt-5 bg-slate-900 px-7 py-5 text-white">
            <div className="flex items-center justify-between gap-5">
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                  If you see {petName || EXAMPLE.petName}, please call
                </div>
                <div className="mt-1.5 break-words text-[32px] font-extrabold leading-none text-white">
                  {phone || EXAMPLE.phone}
                </div>
              </div>
              {qrDataUrl && (
                <div className="text-center">
                  <div className="rounded-xl bg-white p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR code to email the owner" className="mx-auto h-[88px] w-[88px]" />
                  </div>
                  <div className="mt-1 max-w-[110px] text-[9px] font-medium leading-tight text-slate-300">
                    {emailValid ? "Scan to email the owner" : "Add your email to activate this QR code"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pied */}
          <div className="flex items-center justify-between bg-gray-100 px-4 py-2 text-[11px] text-gray-500">
            <span>Free poster by ReportLost.org, lost &amp; found assistance in the USA</span>
            <span>© {new Date().getFullYear()} ReportLost.org, all rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
