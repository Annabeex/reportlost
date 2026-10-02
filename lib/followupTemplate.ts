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
  contribution?: number | null;
  establishments?: TemplateEstablishment[];
}): TemplateBlock[] {
  const publicId = String(opts.publicId || "").trim();
  const lostId = String(opts.lostId || "").trim();
  const city = String(opts.city || "").trim();
  const lines = establishmentLines(opts.establishments || []);
  const contribution = Number(opts.contribution || 0);
  const hasMonitoring = contribution >= 12;
  const hasTeamAssistance = contribution >= 25;
  const monitoringMonths = hasTeamAssistance ? 12 : 6;

  const blocks: TemplateBlock[] = [
    {
      id: uid("pub"),
      title: "Public listing",
      paragraphs: [
        "Your report is published as a public listing on ReportLost. The page uses a case-specific relay address so someone can reply without seeing your personal email address.",
      ],
    },
  ];

  if (hasMonitoring) {
    blocks.push({
      id: uid("monitor"),
      title: "Public-web monitoring",
      paragraphs: [
        `Your selected search service includes public-web monitoring for ${monitoringMonths} months. Checks run daily during the first week, then weekly and monthly. Potential matches are reviewed before notification. Monitoring does not cover private groups or content inaccessible to public search tools.`,
      ],
    });
  }

  if (hasTeamAssistance) {
    blocks.push({
      id: uid("outreach"),
      title: "Local outreach",
      paragraphs: [
        `Team-assisted search includes relevant local outreach${city ? ` in ${city}` : ""}. The organizations below are included in this case follow-up record. Each organization sets its own filing and response procedures.`,
        ...(lines ? [lines] : []),
      ],
    });
    blocks.push({
      id: uid("social"),
      title: "Local notice",
      paragraphs: [
        "A visual notice can be submitted to relevant local pages and community groups where posting is available. Group rules vary by location; some groups require the report owner to post directly.",
        ...(lostId ? [`IMAGE:/api/poster/${lostId}`] : []),
      ],
    });
  }

  blocks.push({
    id: uid("match"),
    title: "Potential matches",
    paragraphs: [
      hasMonitoring
        ? "Potential matches from the selected monitoring service are reviewed before notification. A notification includes the public source so you can assess the information and follow the relevant organization's process."
        : "If someone replies to the public listing, you can assess the information and follow the relevant organization's process.",
      "Keep a private identifying detail off the public listing so it can help confirm ownership when you contact a finder or an office.",
    ],
  });

  return blocks;
}
