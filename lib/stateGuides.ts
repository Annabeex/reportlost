// lib/stateGuides.ts
// Guides juridiques par État. Deux sources fusionnées :
// - les entrées ÉCRITES MAIN ci-dessous (prioritaires, sources en commentaire)
// - lib/stateGuidesGenerated.json, produit par scripts/generate-state-guides.mjs
//   (recherche Serper + rédaction IA, À RELIRE avant commit)
// Rendus sur /lost-and-found/[state] + FAQ JSON-LD.
import generatedRaw from "./stateGuidesGenerated.json";

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

const handwritten: Record<string, StateGuide> = {
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

  // Sources vérifiées (juillet 2026) :
  // - Personal Property Law Article 7-B §§251-258 (nysenate.gov / Justia)
  // - §252 (dépôt sous 10 jours, 20 $+), §253 (durées de garde par valeur)
  NY: {
    stateName: "New York",
    updated: "July 2026",
    intro: [
      "New York has one of the most structured lost property systems in the country, built into Personal Property Law Article 7-B. It covers the entire state, and New York City adds its own machinery on top, with the NYPD running one of the largest lost & found operations anywhere.",
      "Two numbers matter most here: 10 days, the deadline for a finder to deposit your item with the police, and the value of your item, because in New York the more it is worth, the longer the police must keep it for you. ReportLost works inside this framework: we file reports with the right precincts and services, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "⚖️",
        title: "The 10-day deposit rule (Personal Property Law §252)",
        body: "Anyone who finds property worth $20 or more must either return it to the owner or report the find and deposit the item at a police station within 10 days. Failing to do so is a criminal offense. In practice, this rule sends a steady stream of found items into precinct property clerks across the state.",
      },
      {
        icon: "🕒",
        title: "Holding periods scale with value (Personal Property Law §253)",
        body: "Police must keep found property for 3 months when it is worth less than $100, 6 months from $100 to $499, one year from $500 to $4,999, and three full years at $5,000 or more. A lost engagement ring or a high-end laptop stays claimable far longer than most people assume.",
      },
      {
        icon: "📮",
        title: "What happens if no one claims it",
        body: "When the owner is identified, police notify them; if the owner does not claim the item within three months of that notice, or if the holding period runs out, the item is handed to the finder. Your window is real but it closes: the earlier your loss is on record, the better your chances.",
      },
    ],
    whereTitle: "Where items end up in New York",
    whereBody:
      "Found items flow to precinct property clerks (in NYC, the NYPD Property Clerk Division), to the lost & found desks of the MTA, LIRR, Metro-North, airports and venues, and for pets to Animal Care Centers. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do New York police keep found property?",
        a: "It depends on value: 3 months under $100, 6 months from $100 to $499, one year from $500 to $4,999, and three years at $5,000 or more. High-value items have long claim windows by law.",
      },
      {
        q: "Someone found my item, do they have to turn it in?",
        a: "Yes. In New York, keeping found property worth $20 or more without reporting it within 10 days is a criminal offense. Most items of any value do reach a police property clerk.",
      },
      {
        q: "I lost something on the subway or a bus, who holds it?",
        a: "The MTA runs its own lost & found (as do LIRR and Metro-North), separate from the NYPD. Items found by riders sometimes still end up at precincts. That is why one report covering both circuits works better than calling around.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in New York?",
        a: "No. Offering a reward is your choice. Finders may not condition the return of your property on payment.",
      },
    ],
    disclaimer:
      "This page provides general information about New York law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - RCW 63.21 (app.leg.wa.gov) : déclaration sous 7 jours, fenêtre de 60 jours
  WA: {
    stateName: "Washington",
    updated: "July 2026",
    intro: [
      "Washington State handles lost property through chapter 63.21 of the Revised Code of Washington, and its system has a distinctive feature: it moves fast. Where most states give owners three months or more, Washington's core claim window is 60 days.",
      "The system is built as a deal with the finder: report the item quickly and follow the process, and you may keep it if the owner never shows up. For you as the owner, that deal has one consequence: speed matters more in Washington than almost anywhere else. ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "⚖️",
        title: "The finder's 7-day report (RCW 63.21.010)",
        body: "A finder who wants any claim to a found item must report the find within 7 days to the chief law enforcement officer of the place where it was found, surrender the item if requested, and file a notice of intent to claim. A finder who skips this process gives up any right to the item.",
      },
      {
        icon: "🕒",
        title: "The 60-day owner window",
        body: "From the day the find is reported, the owner has 60 days to come forward and establish their right to the property. If no owner appears, the item is released to the finder and legally becomes theirs. This is one of the shortest claim windows in the country, so file your report as early as you can.",
      },
      {
        icon: "🚔",
        title: "Where the item waits",
        body: "During the window, the item either stays with law enforcement or with the finder under the officer's oversight, depending on the situation. Either way, the official record of the find lives with the law enforcement agency of the city or county where it was found, which is why filing your loss with the right department matters.",
      },
    ],
    whereTitle: "Where items end up in Washington",
    whereBody:
      "Found items are recorded with the police department or county sheriff where they were found, while venues keep their own desks: Sound Transit and King County Metro for transit, Sea-Tac Airport's lost & found (one of the busiest in the country), hotels and malls, and county animal services for pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do I have to claim a found item in Washington?",
        a: "The core window is 60 days from the day the find was reported to law enforcement. After that, ownership can legally pass to the finder. It is one of the shortest windows in the country, so report your loss early.",
      },
      {
        q: "Does a finder have to turn my item in?",
        a: "A finder who wants to keep the item legally must report it within 7 days and follow the official process. A finder who does not follow the process has no legal claim to your property.",
      },
      {
        q: "I lost something at Sea-Tac or on public transit, who holds it?",
        a: "Sea-Tac Airport, Sound Transit and King County Metro each run their own lost & found, separate from police property rooms. One report covering all circuits beats calling each desk one by one.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Washington?",
        a: "No. Offering a reward is always your choice, never a legal obligation.",
      },
    ],
    disclaimer:
      "This page provides general information about Washington State law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - Florida Statutes ch. 705 (flsenate.gov / Justia) : 705.102 déclaration,
  //   705.103 procédure et garde, bascule de titre à 90 jours
  FL: {
    stateName: "Florida",
    updated: "July 2026",
    intro: [
      "Florida spells out its lost property rules in Chapter 705 of the Florida Statutes, and the system revolves around one number: 90 days. That is how long the claim window stays open once a found item enters the official circuit.",
      "Florida is also a state of airports, beaches, theme parks and rental cars, places where losing something is easy and where every venue runs its own lost & found desk on top of the legal system. ReportLost works across both circuits: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "⚖️",
        title: "Finders must report (Florida Statutes §705.102)",
        body: "Whoever finds lost or abandoned property in Florida is required to report it to a law enforcement officer. A finder who wants to claim the item if the owner never appears declares that intent when reporting, and covers the agency's costs of storage and notice. Simply pocketing a find without reporting it can be prosecuted as theft.",
      },
      {
        icon: "🕒",
        title: "The 90-day window (Florida Statutes §705.103)",
        body: "Once reported, the item enters a 90-day custodial period during which law enforcement attempts to identify the owner and publishes notice. If you claim your item within those 90 days and prove ownership, it comes back to you. If nobody does, title legally vests in the finder (or the agency).",
      },
      {
        icon: "🏖️",
        title: "Venues run their own desks first",
        body: "In practice, most items lost in Florida's hotels, airports, theme parks and rental cars never reach a police property room: they sit at the venue's own lost & found, each with its own retention policy, often much shorter than 90 days. The legal window and the practical window are not the same, and the practical one closes faster.",
      },
    ],
    whereTitle: "Where items end up in Florida",
    whereBody:
      "Found items split between police and sheriff property units (the legal circuit) and venue desks: airport lost & found offices (MIA, MCO, FLL and TPA are among the busiest in the country), theme parks, hotels, beach patrols and transit agencies, plus county animal services for pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do I have to claim a found item in Florida?",
        a: "The legal window is 90 days once the item is in law enforcement custody. Venue lost & found desks (hotels, airports, parks) set their own shorter retention policies, so act fast on both fronts.",
      },
      {
        q: "Does a finder have to turn my item in?",
        a: "Yes. Florida Statutes require finders to report lost or abandoned property to law enforcement, and keeping a find without reporting it can be prosecuted as theft.",
      },
      {
        q: "I lost something at a Florida airport or theme park, who holds it?",
        a: "The venue itself, almost always. Airports and parks run large dedicated lost & found operations separate from the police. One report covering the venue, the city and the online circuits beats calling each desk.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Florida?",
        a: "No. Offering a reward is your choice, never a legal obligation.",
      },
    ],
    disclaimer:
      "This page provides general information about Florida law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - Pas de loi d'État dédiée aux objets perdus au Texas : common law
  //   (finder vs true owner), Penal Code §31.03 (theft), politiques locales
  TX: {
    stateName: "Texas",
    updated: "July 2026",
    intro: [
      "Texas is unusual: unlike California, New York or Florida, it has no dedicated state statute for lost property. What happens to your item is governed by common law principles, the general theft statute, and above all by the policies of each police department, sheriff's office and venue.",
      "That makes Texas the state where local procedure matters most. There is no single statewide deadline working for you, only the retention policy of whoever ends up holding your item, often around 90 days but different in every city. ReportLost was built for exactly this situation: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "⚖️",
        title: "Common law: the owner always wins",
        body: "Under the common law applied in Texas, a finder has a claim to a found item against everyone except the true owner. The moment you come forward and prove ownership, your right beats the finder's, whether the item sits with a person, a business or a police property room. Your report and your proof of ownership are what activate that right.",
      },
      {
        icon: "🚔",
        title: "Keeping a find can be theft (Penal Code §31.03)",
        body: "Texas prosecutes appropriation of property with intent to deprive the owner under its general theft statute. A finder who keeps an item while having a reasonable way to identify the owner (an ID in a wallet, an engraving, a registered serial number) takes a real legal risk, with penalties scaling with the item's value.",
      },
      {
        icon: "🏢",
        title: "Every department sets its own rules",
        body: "With no statewide lost property statute, each police department and venue defines how long found items are held and how claims work; many follow a roughly 90-day practice, others differ. Mislaid items (left on a counter or a table) typically stay with the business where they were forgotten. Knowing exactly which desk to contact in your city is half the battle.",
      },
    ],
    whereTitle: "Where items end up in Texas",
    whereBody:
      "Found items land in city police or county sheriff property rooms, each with its own procedures, and in venue desks: DFW, IAH, AUS and the state's other airports, transit agencies (DART, METRO), stadiums, hotels and malls, plus city animal services for pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do Texas police keep found property?",
        a: "There is no statewide legal deadline: each department sets its own retention policy, commonly around 90 days. Because rules vary city by city, filing your report with the right department early is what protects you.",
      },
      {
        q: "Is it finders keepers in Texas?",
        a: "No. A finder only has a claim against everyone except you: if you come forward and prove ownership, the item is yours. And a finder who keeps an item while able to identify the owner risks theft charges under Penal Code 31.03.",
      },
      {
        q: "I left my item at a restaurant or store, who holds it?",
        a: "Items forgotten at a business (mislaid property) typically stay with that business, which is why our outreach contacts the exact places you visited, not just the police.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Texas?",
        a: "No. Offering a reward is your choice, never a legal obligation.",
      },
    ],
    disclaimer:
      "This page provides general information about Texas law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - ARS §12-941 / §12-942 (azleg.gov / Justia) : garde 30 jours, avis publié
  //   au-delà de 150 $, remise possible au trouveur ensuite
  AZ: {
    stateName: "Arizona",
    updated: "July 2026",
    intro: [
      "Arizona has the shortest official claim window of any large state: under Revised Statutes sections 12-941 and 12-942, found property held by a public agency can change hands after just 30 days. In Phoenix, Tucson or Flagstaff, time is not on the side of whoever lost the item.",
      "The mechanics are simple: agencies make reasonable efforts to find the owner, hold the item for 30 days, then may hand it to the finder, auction it, or keep it for agency use. ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "🕒",
        title: "The 30-day window (ARS §12-941)",
        body: "Found property turned over to a state, county, city or town agency must be kept for 30 days while reasonable efforts are made to locate and notify the owner. That is the whole official window: the shortest of any major state, which makes reporting your loss early more decisive in Arizona than almost anywhere else.",
      },
      {
        icon: "📰",
        title: "Notice for items over $150",
        body: "Before an unclaimed item worth more than $150 is finally disposed of, a notice describing it must be published or posted. That notice is a real, if narrow, second chance: it exists, but nobody should count on spotting a legal notice in time. A filed report with matching details works better.",
      },
      {
        icon: "🔄",
        title: "After 30 days: finder, auction or agency",
        body: "If nobody claims the item, it may be returned to the honest finder who turned it in, sold at public auction, or retained by the agency when it has a useful value. Either way, your legal claim path narrows sharply once the window closes.",
      },
    ],
    whereTitle: "Where items end up in Arizona",
    whereBody:
      "Found items are held by city police and county sheriff property units, while Sky Harbor and Tucson International run their own busy lost & found desks, as do Valley Metro, hotels, resorts and trailhead visitor centers; county animal care handles pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do Arizona police keep found property?",
        a: "The statutory period is 30 days, with reasonable efforts to notify the owner during that time. It is the shortest window of any large state, so file your report as early as possible.",
      },
      {
        q: "What happens to my item after 30 days?",
        a: "Unclaimed items may go to the finder who turned them in, be sold at public auction, or be kept by the agency. For items worth more than $150, a public notice must be published before final disposition.",
      },
      {
        q: "I lost something at Sky Harbor or on Valley Metro, who holds it?",
        a: "Each runs its own lost & found, separate from police property rooms, with its own retention policy. One report covering the venue, the city and the online circuits beats calling each desk.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Arizona?",
        a: "No. Offering a reward is your choice, never a legal obligation.",
      },
    ],
    disclaimer:
      "This page provides general information about Arizona law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - 18 Pa.C.S. §3924 (legis.state.pa.us / FindLaw) : theft of property lost,
  //   mislaid or delivered by mistake ; pas de régime civil dédié, politiques locales
  PA: {
    stateName: "Pennsylvania",
    updated: "July 2026",
    intro: [
      "Pennsylvania approaches lost property from the criminal side: its key rule is not a deadline but a duty. Under 18 Pa.C.S. section 3924, anyone who ends up with property they know is lost or mislaid commits theft if they keep it without taking reasonable measures to return it.",
      "There is no statewide civil timetable like California's or Arizona's: how long a found wallet waits in a Philadelphia or Pittsburgh property room is a matter of each department's policy. ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "⚖️",
        title: "The duty to return (18 Pa.C.S. §3924)",
        body: "A finder who knows an item is lost or mislaid and keeps it with intent to deprive the owner, without taking reasonable measures to return it, is guilty of theft. Penalties scale with the item's value. This is a strong incentive for honest finders and businesses to turn items in, and it works in your favor.",
      },
      {
        icon: "🏢",
        title: "No statewide clock, local policies instead",
        body: "Pennsylvania sets no single holding period for found property. Each police department, transit agency and venue defines its own retention and claim procedures, often in the range of a few months, but never guaranteed. Knowing exactly which desk holds your item in your city is the decisive step.",
      },
      {
        icon: "🏪",
        title: "Mislaid items stay where you left them",
        body: "An item forgotten on a counter, a table or a seat (mislaid property) typically remains with the business where it was left, which becomes its custodian until you return. That is why contacting the exact places you visited, quickly and with a precise description, recovers more items in Pennsylvania than any other single step.",
      },
    ],
    whereTitle: "Where items end up in Pennsylvania",
    whereBody:
      "Found items are held by city police and county property rooms under local policies, and by venue desks: SEPTA in Philadelphia and Pittsburgh Regional Transit run their own lost & found, as do PHL and PIT airports, stadiums, universities and hotels; animal care and control services handle pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do Pennsylvania police keep found property?",
        a: "There is no statewide legal deadline: each department sets its own retention policy, often a few months. Because rules vary city by city, filing your report with the right department early is what protects you.",
      },
      {
        q: "Is it finders keepers in Pennsylvania?",
        a: "No. Keeping an item you know is lost, without taking reasonable measures to return it, is theft under 18 Pa.C.S. 3924, with penalties that scale with the item's value.",
      },
      {
        q: "I lost something on SEPTA or at the airport, who holds it?",
        a: "SEPTA, Pittsburgh Regional Transit and the airports each run their own lost & found, separate from police property rooms. One report covering all circuits beats calling each desk one by one.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Pennsylvania?",
        a: "No. Offering a reward is your choice, never a legal obligation.",
      },
    ],
    disclaimer:
      "This page provides general information about Pennsylvania law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - 765 ILCS 1020 (ilga.gov / Justia) : ≤100 $ affichage + 6 mois ;
  //   >100 $ publication 3 semaines + 1 an ; double valeur si disposition anticipée
  IL: {
    stateName: "Illinois",
    updated: "July 2026",
    intro: [
      "Illinois still runs on one of the oldest lost property frameworks in the country, the Estrays and Lost Property Act (765 ILCS 1020), and its logic is refreshingly clear: the more your item is worth, the more time you get to claim it.",
      "Six months for items up to $100, a full year above that, with published notices along the way. ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "🕒",
        title: "Six months under $100 (765 ILCS 1020)",
        body: "For found goods or money worth $100 or less with no known owner, the find is advertised at the courthouse, and the owner has 6 months from the advertisement to claim. After that, ownership vests in the finder.",
      },
      {
        icon: "📰",
        title: "One year above $100",
        body: "For items worth more than $100, the county clerk publishes a notice in a newspaper for three successive weeks, and the owner has one full year to appear and claim (paying the finder's reasonable charges). Illinois gives high-value items one of the longest claim windows in the country.",
      },
      {
        icon: "⚖️",
        title: "Selling early costs double",
        body: "Anyone who sells, trades, destroys or disposes of a found item before the legal vesting period ends owes the owner double the item's value, recoverable in court. The law is firmly on the side of the original owner during the window.",
      },
    ],
    whereTitle: "Where items end up in Illinois",
    whereBody:
      "Found items are held by city police and county sheriff property units, while the CTA, Metra, O'Hare and Midway run their own high-volume lost & found desks, as do stadiums, hotels and universities; animal care and control handles pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do I have to claim a found item in Illinois?",
        a: "Six months for items worth $100 or less, one year for items worth more, counted from the legal advertisement. High-value items enjoy one of the longest windows in the country.",
      },
      {
        q: "I lost something on the CTA or at O'Hare, who holds it?",
        a: "The CTA, Metra and both airports each run their own lost & found, separate from police property rooms, with their own shorter retention policies. One report covering all circuits beats calling each desk.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Illinois?",
        a: "No, but the law does let the finder recover reasonable charges and expenses when a high-value item is claimed. A reward beyond that is your choice.",
      },
      {
        q: "What if the finder never reported the item?",
        a: "A finder who keeps an item without following the process has no legal title, and disposing of it early makes them liable for double its value. Honest reporting is strongly incentivized.",
      },
    ],
    disclaimer:
      "This page provides general information about Illinois law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - ORC §2913.02 (codes.ohio.gov) : theft ; §2933.41 / §§2981.11-2981.13 :
  //   biens perdus en garde policière, efforts raisonnables puis disposition
  OH: {
    stateName: "Ohio",
    updated: "July 2026",
    intro: [
      "Ohio has no single lost property timetable written into state law. What it has is a duty on law enforcement to make reasonable efforts to return property in their custody (Revised Code §2933.41 and related sections), a theft statute that discourages finders keepers, and department-level retention policies that vary from city to city.",
      "In practice, Columbus, Cleveland and Cincinnati each run their own property room procedures, and venues keep their own desks. ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "🚔",
        title: "Police must try to find you (ORC §2933.41)",
        body: "Property that is lost or abandoned and lands in a law enforcement agency's custody must be handled under Revised Code rules: the agency makes reasonable efforts to locate and notify the owner before any unclaimed item can be disposed of. Your filed report, with a precise description, is exactly what those efforts match against.",
      },
      {
        icon: "⚖️",
        title: "Keeping a find can be theft (ORC §2913.02)",
        body: "Ohio's theft statute covers knowingly exerting control over property with purpose to deprive the owner. A finder who keeps an item while having a reasonable way to identify its owner takes a real legal risk, with penalties scaling with value.",
      },
      {
        icon: "🏢",
        title: "Retention periods are local",
        body: "There is no statewide claim deadline for everyday found items: each department sets its retention practice under the Revised Code's disposal rules, often in the range of a few months. Knowing which property room or venue desk holds your item in your city is the decisive step.",
      },
    ],
    whereTitle: "Where items end up in Ohio",
    whereBody:
      "Found items are held by city police and county sheriff property units under local procedures, and by venue desks: COTA, RTA and Cincinnati Metro for transit, the state's airports, stadiums, universities and hotels; county animal shelters handle pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do Ohio police keep found property?",
        a: "There is no single statewide deadline: departments follow the Revised Code's rules on unclaimed property with their own retention practices, often a few months. Filing your report early with the right department is what protects you.",
      },
      {
        q: "Is it finders keepers in Ohio?",
        a: "No. Keeping an item while having a reasonable way to identify its owner can be prosecuted as theft under ORC 2913.02, and unclaimed property in police custody follows strict disposal rules.",
      },
      {
        q: "I lost something on transit or at the airport, who holds it?",
        a: "Transit agencies and airports run their own lost & found desks, separate from police property rooms. One report covering all circuits beats calling each desk one by one.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Ohio?",
        a: "No. Offering a reward is your choice, never a legal obligation.",
      },
    ],
    disclaimer:
      "This page provides general information about Ohio law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },

  // Sources vérifiées (juillet 2026) :
  // - OCGA §16-8-6 (Justia / FindLaw) : theft of lost or mislaid property,
  //   "reasonable measures to restore" ; pas de régime civil dédié
  GA: {
    stateName: "Georgia",
    updated: "July 2026",
    intro: [
      "Georgia's lost property law fits in one powerful sentence: whoever finds your item must take reasonable measures to return it before doing anything else, or they commit theft (OCGA §16-8-6). There is no statewide claim timetable on top of that, so local procedures decide how long your window stays open.",
      "Georgia is also home to the world's busiest airport, and Hartsfield-Jackson's lost & found is its own universe with its own rules. ReportLost works inside this framework: we file reports with the right local departments, alert the places you visited, and your report keeps searching for a match during your entire search period.",
    ],
    law: [
      {
        icon: "⚖️",
        title: "The duty to try (OCGA §16-8-6)",
        body: "A person who comes into control of property they know is lost or mislaid and appropriates it without first taking reasonable measures to restore it to the owner commits theft. Courts read 'reasonable measures' concretely: checking the venue's lost & found, notifying security, trying to identify the owner. The law pushes every honest find toward an official desk.",
      },
      {
        icon: "🏢",
        title: "No statewide clock, local policies instead",
        body: "Georgia sets no single holding period for everyday found items: each police department, county and venue defines its own retention and claim procedures, often a few months but never guaranteed. The practical deadline is whichever desk holds your item, which makes finding the right desk the decisive step.",
      },
      {
        icon: "✈️",
        title: "Atlanta's airport is its own circuit",
        body: "Hartsfield-Jackson processes a phenomenal flow of lost items through its own lost & found operation, separate from Atlanta police, with its own claim procedures and retention windows. Anything lost on a journey through ATL should be reported to the airport circuit and the city circuit at the same time.",
      },
    ],
    whereTitle: "Where items end up in Georgia",
    whereBody:
      "Found items are held by city police and county sheriff property units under local procedures, and by venue desks: Hartsfield-Jackson's lost & found, MARTA for transit, stadiums, hotels and universities; county animal services handle pets. ReportLost routes your report to the right ones for your city, and the city pages below give you the exact local contacts.",
    faq: [
      {
        q: "How long do Georgia police keep found property?",
        a: "There is no statewide legal deadline: each department sets its own retention policy, often a few months. Because rules vary city by city, filing your report with the right department early is what protects you.",
      },
      {
        q: "Is it finders keepers in Georgia?",
        a: "No. Under OCGA 16-8-6, keeping a found item without first taking reasonable measures to return it to the owner is theft, with penalties scaling with the item's value.",
      },
      {
        q: "I lost something at Hartsfield-Jackson or on MARTA, who holds it?",
        a: "Each runs its own lost & found, separate from police property rooms, with its own procedures. One report covering the airport, the transit agency, the city and the online circuits beats calling each desk.",
      },
      {
        q: "Do I get my item back if someone turned it in?",
        a: "Yes, by proving ownership (photos, serial number, a detail only the owner would know). That is why our reports keep one verification detail private.",
      },
      {
        q: "Is a reward mandatory in Georgia?",
        a: "No. Offering a reward is your choice, never a legal obligation.",
      },
    ],
    disclaimer:
      "This page provides general information about Georgia law as of publication and is not legal advice. Procedures vary by city and department; verify details with your local authorities.",
  },
};

// Fusion : les entrées écrites main écrasent toujours les générées.
export const stateGuides: Record<string, StateGuide> = {
  ...(generatedRaw as unknown as Record<string, StateGuide>),
  ...handwritten,
};
