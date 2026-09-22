"use client";

// components/SearchGauge.tsx
//
// La jauge « mégaphone » : trois crans (Free, $12, $25) qu'on fait glisser pour
// voir ce que chaque niveau met en mouvement. Extraite de ReportContribution,
// où elle occupait un écran à part, pour être affichée directement sur l'écran
// de confirmation de l'annonce gratuite (étape 5 de ReportForm) : le visiteur
// qui choisit « Free » arrive au bout du parcours en un seul écran, et le mail
// de publication part à ce moment-là.

const DARK_GREEN = "#1f6b3a";
const LIGHT_GREEN_BG = "#eaf8ef";
const ASSET_VER = "1";

const ICONS_AUTO = ["informations.svg", "ai-search.svg", "datasearch.svg"].map(
  (f) => `/images/icons/level2/${f}?v=${ASSET_VER}`
);

const ICONS_ACTIVE = [
  "information.svg", "ai-search.svg", "map-us.svg", "database.svg", "megaphone.svg",
  "phone.svg", "report.svg", "facebook.svg", "file.svg", "globalsearch.svg",
  "gmail.svg", "google-maps.svg", "checkplateform.svg", "locations.svg", "x.svg",
  "lostfoundservice.svg", "safari.png", "big-data.svg", "feedback.svg",
  "telegramme.svg", "yahoo.svg", "contacts.png", "mail-anonyme.svg",
  "manualcheck.svg", "datasearch.svg", "web.svg", "geolocalisation.svg",
].map((f) => `/images/icons/level3/${f}?v=${ASSET_VER}`);

export type GaugeLevel = 0 | 1 | 2;

/** Les trois crans, de gauche à droite. `price` est le montant facturé. */
export const GAUGE_STOPS = [
  {
    price: 0,
    label: "Free",
    title: "Published, not searched",
    icons: [] as string[],
    text: (
      <>
        <b className="font-bold text-green-800">Free listing:</b> your report waits in the public
        database. Nothing is filed, nobody is contacted.
      </>
    ),
  },
  {
    price: 12,
    label: "$12",
    title: "Searched automatically",
    icons: ICONS_AUTO,
    text: (
      <>
        <b className="font-bold text-green-800">Automatic search:</b> for 6 months, our AI checks the
        found items reported on the web and alerts you as soon as one could be yours.
        <span className="mt-1.5 block text-[13px] text-gray-500">
          Also includes a loss report certificate and stickers to print.
        </span>
      </>
    ),
  },
  {
    price: 25,
    label: "$25",
    title: "Searched and announced",
    icons: ICONS_ACTIVE,
    text: (
      <>
        <b className="font-bold text-green-800">Active search:</b> everything above. Plus the human
        part: filing with the lost-property service, outreach where you lost it, and your report
        distributed through the appropriate channels.
      </>
    ),
  },
] as const;

function Megaphone({ level, color }: { level: GaugeLevel; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: [20, 26, 32][level], height: [20, 26, 32][level] }}
    >
      <path d="M3.2 9.6h3.4l6.6-4.4v13.6l-6.6-4.4H3.2z" fill={color} fillOpacity={0.18} />
      <path d="M6.3 14.4v3.2a1.6 1.6 0 0 0 3.2 0v-1.1" />
      {level > 0 && <path d="M16.6 9.2a4.8 4.8 0 0 1 0 5.6" />}
      {level > 1 && <path d="M19.3 6.6a9 9 0 0 1 0 10.8" />}
    </svg>
  );
}

export default function SearchGauge({
  level,
  onChange,
}: {
  level: GaugeLevel;
  onChange: (level: GaugeLevel) => void;
}) {
  const stop = GAUGE_STOPS[level];
  const pct = level * 50;

  return (
    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white">
      <div
        className="flex min-h-[52px] items-center px-5 py-3"
        style={{ backgroundColor: LIGHT_GREEN_BG }}
      >
        <h3 className="text-[17.5px] font-semibold" style={{ color: DARK_GREEN }}>
          {stop.title}
        </h3>
      </div>

      <div className="px-5 pb-5 pt-4">
        {/* Ce que le cran met en mouvement. Au gratuit, rien n'est diffusé. */}
        <div className="flex min-h-[22px] flex-wrap items-center gap-1.5 pb-1">
          {stop.icons.length === 0 ? (
            <span className="text-[12.5px] italic text-gray-400">
              Nothing is sent out at this level.
            </span>
          ) : (
            stop.icons.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="h-[18px] w-[18px] object-contain" />
            ))
          )}
        </div>

        <div className="mx-6 mt-7 sm:mx-9">
          <div
            className="relative h-[50px] cursor-pointer select-none touch-none"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              const r = e.currentTarget.getBoundingClientRect();
              const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
              onChange(Math.round(p * 2) as GaugeLevel);
            }}
            onPointerMove={(e) => {
              if (!(e.buttons & 1)) return;
              const r = e.currentTarget.getBoundingClientRect();
              const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
              onChange(Math.round(p * 2) as GaugeLevel);
            }}
          >
            <div className="absolute left-0 right-0 top-[21px] h-2 rounded-full bg-gray-200" />
            <div
              className="absolute left-0 top-[21px] h-2 rounded-full transition-[width] duration-150"
              style={{ width: `${pct}%`, backgroundColor: DARK_GREEN }}
            />
            {[0, 1, 2].map((j) => (
              <div
                key={j}
                className="absolute top-[19px] h-3 w-3 -translate-x-1/2 rounded-full border-2"
                style={{
                  left: `${j * 50}%`,
                  borderColor: j <= level ? DARK_GREEN : "#cbd5e1",
                  backgroundColor: j <= level ? DARK_GREEN : "#fff",
                }}
              />
            ))}
            <div
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-[left,width,height] duration-150"
              style={{
                left: `${pct}%`,
                width: [30, 38, 46][level],
                height: [30, 38, 46][level],
                borderColor: level > 0 ? DARK_GREEN : "#cbd5e1",
                backgroundColor: level > 0 ? DARK_GREEN : "#fff",
              }}
            >
              <Megaphone level={level} color={level > 0 ? "#ffffff" : "#94a3b8"} />
            </div>
          </div>

          <div className="mt-3.5 flex justify-between">
            {GAUGE_STOPS.map((s, j) => (
              <button
                key={s.price}
                type="button"
                onClick={() => onChange(j as GaugeLevel)}
                className={`text-[13px] font-semibold ${
                  j === level ? "text-[#1f6b3a]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 min-h-[46px] text-[14.5px] leading-relaxed text-gray-600">{stop.text}</p>
      </div>
    </div>
  );
}
