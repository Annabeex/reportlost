// components/CaseWatchStatus.tsx — Server component (aucun JS client)
//
// Bloc de suivi des dossiers « Automatic search » (12 $), où la veille EST le
// produit. Quand elle n'a rien trouvé, dire « aucun résultat » se lit comme
// « rien ne se passe ». On montre donc le travail plutôt que le résultat :
// le nombre de résultats réellement examinés vient de match_candidates, qui
// stocke aussi les candidats écartés (verdict = 'no').
//
// Aucune donnée n'est inventée : toutes les dates viennent du dossier.

function fmt(d?: Date | null) {
  if (!d || isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
function fmtLong(d?: Date | null) {
  if (!d || isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

export default function CaseWatchStatus({
  startedAt,
  lastScanAt,
  nextScanAt,
  endsAt,
  examined,
  credible,
  finished,
}: {
  startedAt?: string | null;
  lastScanAt?: string | null;
  nextScanAt?: string | null;
  endsAt?: string | null;
  examined: number;
  credible: number;
  finished?: boolean;
}) {
  const started = startedAt ? new Date(startedAt) : null;
  const last = lastScanAt ? new Date(lastScanAt) : null;
  const next = nextScanAt ? new Date(nextScanAt) : null;
  const ends = endsAt ? new Date(endsAt) : null;

  // Progression réelle dans la fenêtre de veille, bornée à [2 %, 100 %].
  let pct = 0;
  if (started && ends) {
    const total = ends.getTime() - started.getTime();
    const done = Date.now() - started.getTime();
    pct = total > 0 ? Math.min(100, Math.max(2, (done / total) * 100)) : 0;
  }

  const hasCredible = credible > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white">
      <div className="flex flex-wrap items-start gap-5 px-6 pt-6">
        {/* Radar décoratif, purement statique */}
        <div className="relative h-[92px] w-[92px] flex-none" aria-hidden="true">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 210deg, rgba(37,99,235,.22), rgba(37,99,235,0) 70deg)",
            }}
          />
          <div className="absolute inset-0 rounded-full border border-blue-200" />
          <div className="absolute inset-[15px] rounded-full border border-blue-200" />
          <div className="absolute inset-[30px] rounded-full border border-blue-200" />
          <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-700 shadow-[0_0_0_4px_rgba(37,99,235,.15)]" />
          <span className="absolute left-[22%] top-[32%] h-[7px] w-[7px] rounded-full bg-blue-600 opacity-50" />
          <span className="absolute left-[71%] top-[26%] h-[7px] w-[7px] rounded-full bg-blue-600 opacity-35" />
          <span className="absolute left-[64%] top-[70%] h-[7px] w-[7px] rounded-full bg-blue-600 opacity-45" />
        </div>

        <div className="min-w-[240px] flex-1">
          <h2 className="text-[17px] font-semibold text-gray-900">
            {finished
              ? "The search has ended"
              : hasCredible
              ? "The search is running, and something came up"
              : "The search is running"}
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-gray-600">
            {finished ? (
              <>Your monitoring period is over. Your documents below remain available.</>
            ) : hasCredible ? (
              <>
                Your item&rsquo;s keywords are checked against public listings, classifieds,
                community groups and found-item pages.{" "}
                <b className="text-gray-900">
                  {credible} result{credible > 1 ? "s" : ""} worth a look
                </b>{" "}
                {credible > 1 ? "have" : "has"} been forwarded to you by email.
              </>
            ) : (
              <>
                Your item&rsquo;s keywords are checked against public listings, classifieds,
                community groups and found-item pages.{" "}
                <b className="text-gray-900">No credible match so far.</b> That is the usual
                picture in the early weeks: most items are posted by whoever found them days
                later, not the same day.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        {[
          { n: examined.toLocaleString("en-US"), l: "results examined" },
          { n: String(credible), l: "credible matches" },
          { n: fmt(last) || "—", l: "last scan" },
          { n: finished ? "—" : fmt(next) || "—", l: "next scan" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-gray-200 px-3.5 py-2.5">
            <div className="text-[20px] font-bold leading-tight tabular-nums text-gray-900">
              {s.n}
            </div>
            <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-gray-500">
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {started && ends && (
        <div className="px-6 pt-5">
          <div className="relative h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] text-gray-500">
            <span>
              <b className="font-semibold text-gray-600">{fmt(started)}</b> started
            </span>
            <span>
              ends <b className="font-semibold text-gray-600">{fmtLong(ends)}</b>
            </span>
          </div>
        </div>
      )}

      <div className="mx-6 mt-4 mb-5 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-gray-100 pt-3.5 text-[13px] text-gray-600">
        <span>🔁 Daily for the first week, then weekly, then monthly.</span>
        <span>👤 Every credible result is read by a person before it reaches you.</span>
      </div>
    </section>
  );
}
