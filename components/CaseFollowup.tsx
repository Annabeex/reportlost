// components/CaseFollowup.tsx
// Server component (SSR OK)

export type FollowupBlock = {
  id?: string;
  title: string;
  paragraphs: string[];
};

function normalizeBlocks(input?: any[]): FollowupBlock[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((b) => {
      const title =
        typeof b?.title === "string" && b.title.trim() ? b.title.trim() : "Untitled";
      const paragraphs =
        Array.isArray(b?.paragraphs)
          ? b.paragraphs
              .map((p: unknown) => (typeof p === "string" ? p.trim() : ""))
              .filter(Boolean)
          : typeof b?.content === "string"
          ? [b.content]
          : [];
      return { id: b?.id, title, paragraphs };
    })
    .filter((b) => b.title || b.paragraphs.length);
}

/** Très petit rendu “markdown-safe”
 * - échappe tout HTML
 * - supporte **gras** et *italique*
 * - autorise <strong>/<b> et <em>/<i> si l'utilisateur les a mis
 * - convertit \n en <br />
 */
function toRichHtml(src: string) {
  // normaliser retours
  let s = String(src ?? "").replace(/\r\n?/g, "\n");

  // échapper tout
  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // markdown **bold** / *em*
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // autoriser explicitement <strong>/<b>/<em>/<i> écrits par l'éditeur
  s = s
    .replace(/&lt;(strong|b)&gt;/g, "<$1>")
    .replace(/&lt;\/(strong|b)&gt;/g, "</$1>")
    .replace(/&lt;(em|i)&gt;/g, "<$1>")
    .replace(/&lt;\/(em|i)&gt;/g, "</$1>");

  // retours à la ligne
  s = s.replace(/\n/g, "<br />");
  return s;
}

export default function CaseFollowup({
  blocks,
  publicId,
  hideEditButton,
}: {
  blocks?: any[];
  publicId?: string;
  hideEditButton?: boolean;
}) {
  const normalized = normalizeBlocks(blocks);

  // ⛔️ Pas de defaults en public : si vide, on affiche un encart d'information.
  if (!normalized.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <div className="font-semibold mb-1">No public update yet</div>
        <p className="text-sm">
          This case doesn’t have a public follow-up published yet. If you are the owner,
          open the admin editor to add or publish an update.
        </p>
        {!hideEditButton && publicId && (
          <div className="mt-3">
            <a
              href={`/case/${publicId}?edit=1`}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
            >
              ✏️ Open editor
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideEditButton && publicId && (
        <div className="flex justify-end mb-1">
          <a
            href={`/case/${publicId}?edit=1`}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
          >
            ✏️ Modifier
          </a>
        </div>
      )}

      {normalized.map((b, i) => (
        <div
          key={b.id ?? `${b.title}-${i}`}
          className="rounded-2xl border border-emerald-200 bg-white overflow-hidden"
        >
          {/* Header vert doux */}
          <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
              </span>
              <span className="font-semibold text-emerald-900 text-lg">{b.title}</span>
            </div>
            <span className="text-sm text-emerald-700">Close</span>
          </div>

          {/* Corps blanc avec rendu riche */}
          <div className="px-6 py-5 leading-relaxed text-gray-900 bg-white">
            {b.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="mb-4"
                dangerouslySetInnerHTML={{ __html: toRichHtml(p) }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
