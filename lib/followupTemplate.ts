// lib/followupTemplate.ts
// Modèle du compte rendu remis au client (page /case/<public_id>).
//
// Généré depuis le dossier admin, au moment où Anna écrit au client : elle voit
// la liste des établissements du dossier, décoche ce qu'elle ne retient pas,
// puis publie. Le client, lui, n'a aucun bouton : la page est en lecture seule.
//
// Note : components/CaseFollowupEditor.tsx garde ses propres defaults pour le
// bouton « Insert template » de l'éditeur manuel. Les deux disent la même chose,
// mais l'éditeur applique en plus les modèles personnalisés du localStorage.

export type TemplateBlock = { id: string; title: string; paragraphs: string[] };

export type TemplateEstablishment = {
  name: string;
  notes?: string | null;
};

function uid(seed: string) {
  return `${seed}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Une ligne par établissement retenu, dans le style des blocs existants. */
export function establishmentLines(list: TemplateEstablishment[]): string {
  return list
    .map((e) => {
      const name = String(e.name || "").trim();
      if (!name) return "";
      const role = String(e.notes || "").trim();
      return role ? `✅ ${name} — ${role}` : `✅ ${name}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function buildFollowupBlocks(opts: {
  publicId?: string | null;
  lostId?: string | null;
  city?: string | null;
  establishments?: TemplateEstablishment[];
}): TemplateBlock[] {
  const publicId = String(opts.publicId || "").trim();
  const lostId = String(opts.lostId || "").trim();
  const city = String(opts.city || "").trim();
  const anon = publicId ? `item${publicId}@reportlost.org` : "your case inbox";
  const lines = establishmentLines(opts.establishments || []);

  const outreach: string[] = [
    "We notify local lost & found desks and common drop-off points when relevant: police non-emergency lines, transit agencies, airport lost & found, and nearby institutions such as hotels, hospitals and universities. Your report reference travels with every message, so a physical return can be matched to your case quickly.",
  ];
  if (lines) {
    outreach.push(
      `Reached out for your case${city ? ` in ${city}` : ""}:\n\n${lines}`,
      "For best results, you can also contact these desks directly or visit in person with proof of ownership. Mentioning your reference number lets them connect your visit to the report we filed."
    );
  }

  const blocks: TemplateBlock[] = [
    { id: uid("outreach"), title: "Local notifications & Authority outreach", paragraphs: outreach },
    {
      id: uid("db"),
      title: "Database & Partners searches",
      paragraphs: [
        "We search the public and partner lost-and-found sources most likely to list found items in your area: national and regional aggregators, municipal pages, transit and airport listings, university systems, police logs, classifieds, and active local groups. We also create alerts on your report's keywords.",
        "Current result: no exact match at the time of writing. These checks are repeated automatically and reviewed by hand.",
      ],
    },
    {
      id: uid("anon"),
      title: "Anonymous Contact Address — Safety & Anti-Scam Measures",
      paragraphs: [
        `✅ We created an inbox dedicated to your case: **${anon}**. Finders write to that address, our moderators read the messages and pass on the credible ones. Your personal email is never published.`,
        "Messages are checked before they reach you: advertising, spam and attempted scams are filtered out, and a claim is only forwarded once it holds up.",
      ],
    },
    {
      id: uid("pub"),
      title: "Online publication & Accessibility",
      paragraphs: [
        "Your public report is live in our database, readable on desktop, tablet and mobile. We publish structured metadata with it so search engines can read and index the listing properly.",
      ],
    },
    {
      id: uid("seo"),
      title: "Search Engines & Feed Distribution",
      paragraphs: [
        "The report is submitted to the major search engines and to our syndicated feeds. This helps crawlers find the listing; how fast it is indexed remains their decision, not ours.",
        ["✅ Google", "✅ Bing", "✅ Yahoo!", "✅ DuckDuckGo, Yandex, Ecosia, Aol, Ask"].join("\n"),
      ],
    },
    {
      id: uid("social"),
      title: "Social Media & Community Posting",
      paragraphs: [
        `We post the report on our public pages and in the local groups that matter${city ? ` around ${city}` : ""}, and prepare a neighbourhood template. Facebook and Nextdoor are where most recoveries actually happen; Instagram and X are supplementary.`,
        ...(lostId
          ? [
              "We created a search visual for your report, published alongside the alert so your item is recognisable at a glance:",
              `IMAGE:/api/poster/${lostId}`,
            ]
          : []),
      ],
    },
    {
      id: uid("specialist"),
      title: "Specialist Channels & Partners",
      paragraphs: [
        "Where it fits your item, we also push the listing to specialised networks: pet recovery platforms, resale marketplaces, institutional pages and local classified boards.",
      ],
    },
    {
      id: uid("monitor"),
      title: "Automated Monitoring & Human Verification",
      paragraphs: [
        "Automated scanning, image comparison and human review work together. The web is scanned on your keywords every day during the first week, then weekly, then monthly, for twelve months. Every credible match is read by a person before it reaches you.",
      ],
    },
    {
      id: uid("match"),
      title: "What Happens If We Find a Match",
      paragraphs: [
        "We ask the finder for verification photos through the anonymous inbox, and we compare identifying marks with your description.",
        "We contact you as soon as a lead holds up, with what to do next. Your private details are never disclosed.",
        "We recommend a handover in a public place, and we coordinate with the police when the situation calls for it.",
      ],
    },
  ];

  return blocks;
}
