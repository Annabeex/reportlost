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
              .map((p: any) => (typeof p === "string" ? p : ""))
              .filter((p: string) => p !== "")
          : (typeof b?.content === "string" ? [b.content] : []);
      return { id: b?.id, title, paragraphs };
    })
    .filter((b) => b.title || b.paragraphs.length);
}

/** ✅ Defaults (affichés si DB vide) */
const DEFAULT_BLOCKS: FollowupBlock[] = [
  {
    title: "Database & Partners searches",
    paragraphs: [
      "We search the full spectrum of public and partner lost-&-found sources that are most likely to list found items in your area: national & regional aggregators, municipal pages, transit & airport listings, university systems, police logs, classifieds, and active local groups and create alerts for the report keywords",
      "✅ Search in the Reportmyloss database\n✅ Search in the foundrop database\n✅ Search in the chargerback database\n✅ Search in the iLost.co united states database\n✅ Search in the Lost-and-found.org database",
      "Current result: No exact match found at time of publication. We repeat these checks automatically and manually",
    ],
  },
  {
    title: "Local notifications & Authority outreach",
    paragraphs: [
      "We notify local lost & found desks and common drop-off points when relevant: police non-emergency lines, transit agencies, airport lost & found, and nearby institutions (hotels, hospitals, universities). We include your report reference so physical returns can be matched quickly.",
      "✅ NYPD units covering East River Park — the 7th Precinct (Lower East Side) and the 9th Precinct (East Village). For best results, please call the lost and found office or visit the office in person with proof of ownership if you have.",
    ],
  },
  {
    title: "Anonymous Contact Address - Safety & Anti-Scam Measures",
    paragraphs: [
      "✅ We created a case-specific anonymous inbox for this report. Finders can message this address; our moderators screen messages and forward verified leads to you. Your personal email is never published publicly or in social media.",
      "Our team ensures the veracity of the content of the messages received and filters unsolicited emails (advertising, spam, scam attempts, etc.).",
    ],
  },
  {
    title: "Online publication & Accessibility",
    paragraphs: [
      "Your public report is live in our database and partners such as lost-found.org. Optimized for desktop, tablet and mobile. We publish structured metadata to help search engines find and index the listing.",
    ],
  },
  {
    title: "Search Engines & Feed Distribution",
    paragraphs: [
      "We submit the report to major search engines and our syndicated feeds. This helps crawlers discover the listing faster; indexing timing is controlled by the search engines themselves.",
      "✅ Google\n✅ Bing\n✅ Yahoo!\n✅ DuckDuckGo, Yandex Search, Ecosia, Aol, Ask",
    ],
  },
  {
    title: "Social Media & Community Posting",
    paragraphs: [
      "We post the report to our public Facebook page and local groups, prepare a Nextdoor template, and publish short alerts on X and Instagram. Facebook and Nextdoor are typically the most effective for recoveries; Instagram and TikTok are supplementary.",
      "Facebook wallets group, Facebook NY and lost and found groups",
    ],
  },
  {
    title: "Specialist Channels & Partners",
    paragraphs: [
      "When appropriate we push the listing to specialized networks (pet recovery platforms, resale marketplaces, institutional pages) and local classified boards.",
    ],
  },
  {
    title: "Automated Monitoring & Human Verification",
    paragraphs: [
      "We combine automated scans, image-similarity checking, and human review. Active monitoring runs with multiple daily checks.",
    ],
  },
  {
    title: "What Happens If We Find a Match",
    paragraphs: [
      "We verify photos and identifying marks.",
      "We request verification photos from the finder via the anonymous inbox.",
      "We notify you immediately with instructions; we never publish your private data.",
      "We advise a safe, public handoff and coordinate with police if needed.",
    ],
  },
];

/** Mini assainisseur : on échappe tout, puis on ré-autorise `<strong>` et on convertit les sauts de ligne en `<br>` ; on permet aussi `**gras**`. */
function toSafeHTML(text: string): string {
  let s = String(text ?? "");
  // escape
  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // markdown **bold**
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // allow <strong> that were typed literally (unescape those only)
  s = s.replace(/&lt;strong&gt;/g, "<strong>").replace(/&lt;\/strong&gt;/g, "</strong>");
  // line breaks
  s = s.replace(/\r?\n/g, "<br />");
  return s;
}

function AccordionItem({
  block,
  defaultOpen = false,
}: {
  block: FollowupBlock;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-2xl border border-emerald-200 bg-white mb-6 overflow-hidden"
      {...(defaultOpen ? { open: true } : {})}
    >
      {/* Bandeau titre vert doux */}
      <summary className="flex items-center justify-between cursor-pointer select-none px-5 py-4 bg-emerald-50 border-b border-emerald-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
          </span>
          <span className="font-semibold text-emerald-900 text-lg">{block.title}</span>
        </div>
        <span className="text-sm text-emerald-700 group-open:hidden">Close</span>
        <span className="text-sm text-emerald-700 hidden group-open:inline">Open</span>
      </summary>

      {/* Corps sur fond blanc */}
      <div className="px-6 py-5 leading-relaxed text-gray-900 bg-white">
        {block.paragraphs.map((p, idx) => (
          <div
            key={idx}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: toSafeHTML(p) }}
          />
        ))}
      </div>
    </details>
  );
}

export default function CaseFollowup({
  blocks,
  hideEditButton,
}: {
  /** Contenu DB (peut être vide) */
  blocks?: any[];
  /** Forcer à masquer le bouton éditer en mode public */
  hideEditButton?: boolean;
}) {
  const normalized = normalizeBlocks(blocks);
  const toRender = normalized.length ? normalized : DEFAULT_BLOCKS;

  return (
    <div>
      {/* aucun bouton "Modifier" en mode public */}
      {!hideEditButton && (
        <div className="hidden" />
      )}

      {toRender.map((b, i) => (
        <AccordionItem key={b.id ?? `${b.title}-${i}`} block={b} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
