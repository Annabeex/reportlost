// lib/stateGuides.ts
// Guides juridiques par État, rédigés et vérifiés À LA MAIN (sources citées
// en commentaire). Rendus sur /lost-and-found/[state] + FAQ JSON-LD.
// Ajouter un État = ajouter une entrée ici, rien d'autre à faire.

export type StateGuide = {
  stateName: string;
  updated: string; // ex: "July 2026"
  intro: string[];
  law: { icon: string; title: string; body: string }[];
  whereTitle: string;
  whereBody: string;
  faq: { q: string; a: string }[];
  disclaimer: string;
};

export const stateGuides: Record<string, StateGuide> = {
  // Sources vérifiées (juillet 2026) :
  // - Civil Code §2080-2080.10 (Justia / leginfo.legislature.ca.gov)
  // - Penal Code §485 (shouselaw.com et confrères)
  CA: {
    stateName: "California",
    updated: "July 2026",
    intro: [
      "California is one of the few states with a real legal framework for lost property, and knowing it changes what you should do in the first 48 hours. The rules come mainly from Civil Code sections 2080 to 2080.10, and they apply statewide, from Los Angeles to the smallest mountain town.",
      "The short version: a finder who picks up your item has legal duties, police departments have holding obligations, and you have a window of time to come forward. ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "⚖️",
        title: "The finder's duty (Civil Code §2080)",
        body: "Anyone who takes charge of a found item becomes its legal custodian and must inform the owner if known, and return it without demanding a reward (only reasonable costs of care can be charged). If the owner is unknown and the item is worth $100 or more, the finder must hand it over to the local police or sheriff within a reasonable time.",
      },
      {
        icon: "🕒",
        title: "The 90-day police window (Civil Code §2080.2)",
        body: "Police and sheriff departments must notify the owner when their identity is reasonably ascertainable, and hold found property for at least 90 days. This is your key deadline: an item turned in anywhere in California should still be claimable for three months. For items worth $250 or more, if no owner appears after 90 days, a notice is published in a local newspaper; seven days later, ownership can legally transfer to the finder, or the item is auctioned when it was found by a public employee on duty.",
      },
      {
        icon: "🚔",
        title: "Keeping a found item can be theft (Penal Code §485)",
        body: "California treats pocketing a found item as theft when the finder had a reasonable way to identify the owner and made no effort to return it: petty theft up to $950 of value, grand theft above. This law is your ally: it motivates honest finders and businesses to turn items in.",
      },
    ],
    whereTitle: "Where items end up in California",
    whereBody:
      "Most found items funnel to a handful of places: the property and evidence unit of the city police or county sheriff, the lost & found desk of the venue itself (hotels, malls, transit, airports each keep their own), and for pets, county animal services. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do California police keep found property?",
        a: "At least 90 days by law. High-value items may be held longer through the publication process, but never count on it: file your report as early as possible.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "What if my lost item was worth less than $100?",
        a: "The finder has no legal duty to hand it to the police, so venue lost & found desks and community groups matter even more. That is where our social alerts and match watch do most of the work.",
      },
      {
        q: "Is a reward mandatory in California?",
        a: "No. Finders may only charge reasonable costs for caring for the item. Offering a reward is your choice, never an obligation.",
      },
      {
        q: "What about lost bank accounts or uncashed checks?",
        a: "That is a different system: financial assets go to the California State Controller's unclaimed property program, not to police lost & found. ReportLost handles physical items.",
      },
    ],
    disclaimer:
      "This page provides general information about California law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },
};
