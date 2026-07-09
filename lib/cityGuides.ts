// lib/cityGuides.ts
// Contenu enrichi par ville, piloté par les données (un seul composant générique
// les affiche : components/CityGuide.tsx). Pour ajouter une ville : ajouter une
// entrée ici et l'inclure dans le tableau `cityGuides`. Aucun autre fichier à toucher.
//
// Champs rendus en HTML (peuvent contenir <strong>, utiliser &amp; pour "&") :
//   heroSubtitle, steps[].body, intro[], cards[].body
// Champs rendus en texte brut (utiliser "&" et apostrophes normales) :
//   tous les autres (titres, faq, areas, social, cta bodies…)

export type GuideLink = { label: string; href: string };
export type GuideStep = { icon: string; iconBg: string; title: string; body: string };
export type GuideCard = { icon: string; iconBg: string; title: string; body: string; links?: GuideLink[] };
export type GuideArea = { name: string; blurb: string; href?: string };
export type GuideFaq = { q: string; a: string };

export type CityGuide = {
  state: string; // "NY"
  citySlug: string; // city_ascii en minuscules, ex "new york"
  badge: string;
  h1: string;
  heroSubtitle: string; // HTML
  imageAltFallback: string;
  stepsHeading: string;
  steps: GuideStep[]; // body = HTML
  intro: string[]; // HTML
  guideHeading: string;
  guideSubtitle: string;
  cards: GuideCard[]; // body = HTML
  midCtaHeading: string;
  midCtaBody: string;
  areasHeading: string;
  areasSubtitle: string;
  areas: GuideArea[];
  socialHeading: string;
  socialSubtitle: string;
  social: [string, string][];
  faqHeading: string;
  faq: GuideFaq[];
  nearby: GuideLink[];
  finalCtaHeading: string;
  finalCtaBody: string;
  ctaLabel: string;
  finalCtaLabel: string;
  disclaimer: string;
};

// ======================================================================
// NEW YORK CITY
// ======================================================================
const newYork: CityGuide = {
  state: "NY",
  citySlug: "new york",
  badge: "New York City, NY · Lost & Found",
  h1: "Lost something in New York City? Report it and get it back.",
  heroSubtitle:
    "One report and we route it to the right <strong>NYPD precinct</strong>, the relevant <strong>MTA, taxi and airport lost &amp; found</strong>, and active <strong>local social channels</strong>.",
  imageAltFallback: "View of New York City",
  stepsHeading: "How we help you recover it in New York",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. You report the loss", body: "Describe the item and where you lost it. The more detail, the better the match." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. We route it to the right places", body: "The NYPD precinct covering that spot, plus MTA / TLC / airport lost &amp; found and the right social groups." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. You get matched & notified", body: "If someone finds or turns in your item, you're alerted to arrange pickup." },
  ],
  intro: [
    `With more than 8 million residents and over 60 million visitors a year, New York City is one of the easiest places in the world to lose a phone, a wallet, a set of keys — or even a pet. The good news: the city has dozens of well-run lost-and-found systems. The hard part is knowing which one handles your case. Report it here and we point you to the right channel and the NYPD precinct that covers exactly where you lost it.`,
    `Whether it happened on the subway, in a yellow cab, at JFK or LaGuardia, in a Midtown hotel or a Central Park bench, acting fast makes a real difference — most lost-and-found offices work on strict deadlines.`,
  ],
  guideHeading: "Exactly what to do, based on where you lost it",
  guideSubtitle:
    "New York has dozens of separate lost-and-found systems. Reporting to the wrong one wastes days — here is the right channel for each.",
  cards: [
    {
      icon: "🚇", iconBg: "bg-blue-100", title: "Subway, bus or Staten Island Railway (MTA)",
      body: `Tell the nearest station booth agent, or file a claim with <strong>NYC Transit Lost &amp; Found</strong> at lostandfound.mta.info or by calling <strong>511</strong> (24/7). Items are held at least <strong>3 months</strong>; the central office is by appointment only, after they contact you.`,
      links: [{ label: "File an MTA claim →", href: "https://lostandfound.mta.info/" }, { label: "How it works", href: "https://www.mta.info/lost-and-found" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Yellow/green cab, Uber or Lyft",
      body: `For taxis, report to <strong>311</strong> with the <strong>medallion number</strong> from your receipt. No receipt? A card statement often shows it (e.g. "NYCTAXI AB123"). For Uber/Lyft, use the in-app "I lost an item" flow. We generate the exact info to include.`,
      links: [{ label: "Report a taxi loss (311) →", href: "https://portal.311.nyc.gov/article/?kanumber=KA-01045" }, { label: "TLC lost property", href: "https://www.nyc.gov/site/tlc/passengers/report-lost-property.page" }],
    },
    {
      icon: "👮", iconBg: "bg-indigo-100", title: "Handed to the police (NYPD Property Clerk)",
      body: `Found valuables are often vouchered by the <strong>NYPD Property Clerk</strong> in the borough where they were turned in. Bring ID. <strong>Important:</strong> for non-evidence property, claim it <strong>within 120 days</strong> or it may be disposed of. We tell you which precinct covers your loss location.`,
      links: [{ label: "NYPD Property Clerk →", href: "https://www.nyc.gov/site/nypd/services/vehicles-property/property-clerk.page" }],
    },
    {
      icon: "✈️", iconBg: "bg-sky-100", title: "JFK, LaGuardia or Newark",
      body: `Lost it at security? Contact <strong>TSA lost &amp; found</strong> for that airport. On the plane or at the gate? Contact your <strong>airline</strong>. Elsewhere in the terminal, the airport's Port Authority lost &amp; found handles it. We point you to the right desk.`,
      links: [{ label: "Port Authority lost & found →", href: "https://www.panynj.gov/port-authority/en/help-center/lost-and-found.html" }, { label: "Contact TSA", href: "https://www.tsa.gov/contact-center/travelers" }],
    },
    {
      icon: "🌳", iconBg: "bg-green-100", title: "Street, park, shop or venue",
      body: `Ask the venue's front desk or security first (museums, malls, stadiums and hotels keep their own lost &amp; found). For items lost on the street, the nearest NYPD precinct is best — and a public alert on local groups raises the odds an honest finder reaches you.`,
      links: [{ label: "NYC311 lost & found →", href: "https://portal.311.nyc.gov/" }],
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `File a lost-pet report with <strong>Animal Care Centers of NYC (ACC)</strong> and search their found database daily — it links to <strong>Petco Love Lost</strong> facial recognition. Any shelter or vet scans for a <strong>microchip</strong>, so keep your details current. Post to neighborhood groups and Nextdoor fast.`,
      links: [{ label: "ACC lost & found →", href: "https://www.nycacc.org/services/lost-and-found/" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }],
    },
  ],
  midCtaHeading: "Don't wait — the first 48 hours matter most",
  midCtaBody: "Lost & found offices clear items on strict deadlines. Get in the system now.",
  areasHeading: "Lost something in a specific NYC neighborhood?",
  areasSubtitle:
    "New York City spans five boroughs and hundreds of neighborhoods. Pick the area closest to where you lost your item — each has its own transit hubs, precincts and hotspots.",
  areas: [
    { name: "Manhattan", href: "/lost-and-found/ny/new-york", blurb: "Midtown, Times Square, the Financial District, SoHo, Greenwich Village, the Upper East & West Sides, Harlem and Chelsea. Highest density of taxis, subway lines and tourist sites — and the most lost phones and wallets." },
    { name: "Brooklyn", href: "/lost-and-found/ny/brooklyn", blurb: "Williamsburg, DUMBO, Park Slope, Bushwick and Downtown Brooklyn. Busy nightlife and transit hubs like Atlantic Terminal mean plenty of items left on trains and in bars." },
    { name: "Queens", href: "/lost-and-found/ny/queens", blurb: "Astoria, Long Island City, Flushing and Jamaica — plus both JFK and LaGuardia airports, so a large share of luggage and travel-document losses happen here." },
    { name: "The Bronx", href: "/lost-and-found/ny/bronx", blurb: "Yankee Stadium, the Bronx Zoo, Fordham and the Grand Concourse. Event days and the 4/B/D lines are common spots for misplaced belongings." },
    { name: "Staten Island", href: "/lost-and-found/ny/staten-island", blurb: "The Staten Island Ferry and the SIR railway. Items lost on the ferry or railway go through the MTA / Staten Island Railway lost & found." },
  ],
  socialHeading: "Amplify your report on New York's social channels",
  socialSubtitle:
    "Most items come back through a person, not an office. We help you create a clean, shareable post and point you to the most active NYC communities:",
  social: [
    ["Facebook groups", "“NYC Lost & Found”, borough & neighborhood groups"],
    ["Reddit", "r/nyc, r/AskNYC, borough subreddits"],
    ["Nextdoor", "Your exact neighborhood — great for pets"],
    ["X / Twitter", "Tag the line, station or venue"],
    ["Instagram", "Local lost-pet & community pages"],
    ["Building / campus boards", "Universities, coworking, residential"],
  ],
  faqHeading: "New York lost & found — frequently asked questions",
  faq: [
    { q: "How do I report something lost on the NYC subway?", a: "Tell the nearest station booth agent, then file a claim with NYC Transit Lost & Found online (lostandfound.mta.info) or by calling 511. Items are held for at least three months." },
    { q: "I left something in a New York taxi — what now?", a: "Call 311 with the medallion number from your receipt. If you paid by card, your statement often shows it. For Uber/Lyft use the in-app lost-item flow." },
    { q: "How long does the NYPD hold found property?", a: "It depends on value, but for non-evidence property you should claim it within 120 days of it being vouchered, or it may be disposed of." },
    { q: "My pet is lost in NYC — where do I start?", a: "File a lost-pet report with Animal Care Centers of NYC (ACC), search their found database daily, and use the linked Petco Love Lost facial-recognition search. Keep your microchip info current." },
    { q: "Is ReportLost.org official / does it replace the police?", a: "No — we're an independent service that helps you report to the right official channels faster and amplify your search across social communities. The official offices hold the items." },
  ],
  nearby: [
    { label: "Brooklyn", href: "/lost-and-found/ny/brooklyn" },
    { label: "Queens", href: "/lost-and-found/ny/queens" },
    { label: "The Bronx", href: "/lost-and-found/ny/bronx" },
    { label: "Staten Island", href: "/lost-and-found/ny/staten-island" },
    { label: "Yonkers, NY", href: "/lost-and-found/ny/yonkers" },
    { label: "Jersey City, NJ", href: "/lost-and-found/nj/jersey-city" },
    { label: "Newark, NJ", href: "/lost-and-found/nj/newark" },
    { label: "Hoboken, NJ", href: "/lost-and-found/nj/hoboken" },
  ],
  finalCtaHeading: "Ready to get your item back?",
  finalCtaBody: "One report. Every relevant channel in New York City.",
  ctaLabel: "Report my lost item →",
  finalCtaLabel: "Start my report →",
  disclaimer:
    "ReportLost.org is an independent service and is not affiliated with the MTA, NYPD, TLC, the Port Authority or the City of New York. Official lost-and-found offices retain and release found property.",
};

// ======================================================================
// LOS ANGELES
// ======================================================================
const losAngeles: CityGuide = {
  state: "CA",
  citySlug: "los angeles",
  badge: "Los Angeles, CA · Lost & Found",
  h1: "Lost something in Los Angeles? Report it and get it back.",
  heroSubtitle:
    "One report and we route it to the right <strong>LAPD area</strong>, the relevant <strong>Metro, LAX and rideshare lost &amp; found</strong>, and active <strong>local social channels</strong>.",
  imageAltFallback: "View of Los Angeles",
  stepsHeading: "How we help you recover it in Los Angeles",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. You report the loss", body: "Describe the item and where you lost it. The more detail, the better the match." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. We route it to the right places", body: "The LAPD area covering that spot, plus Metro / LAX / rideshare lost &amp; found and the right social groups." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. You get matched & notified", body: "If someone finds or turns in your item, you're alerted to arrange pickup." },
  ],
  intro: [
    `Spread across roughly 500 square miles, Los Angeles is a city where losing a phone, a wallet, a set of keys — or a pet — can happen anywhere from a Metro train to a beach in Venice. The good news is that LA has several dedicated lost-and-found systems. The hard part is knowing which one handles your case. Report it here and we point you to the right channel and the LAPD area that covers exactly where you lost it.`,
    `Whether it happened on the Metro, at LAX, in a rideshare, at a Hollywood venue or on the Westside, acting fast matters — most lost-and-found offices hold items on strict deadlines.`,
  ],
  guideHeading: "Exactly what to do, based on where you lost it",
  guideSubtitle:
    "Los Angeles has many separate lost-and-found systems. Reporting to the wrong one wastes days — here is the right channel for each.",
  cards: [
    {
      icon: "🚇", iconBg: "bg-blue-100", title: "Metro bus or train (and Metrolink)",
      body: `File a Lost Item Report online with Metro. You'll get a reference number by email; wait 3 business days, then verify at the Lost &amp; Found office. Items are held 90 days. Lost it on a Metrolink train? Call or text 800-371-5465.`,
      links: [{ label: "File a Metro report →", href: "https://lostandfound.metro.net/" }, { label: "Metrolink", href: "https://metrolinktrains.com/customer-service/lost--found/" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Uber, Lyft or taxi",
      body: `Use the app's "I lost an item" flow to contact your driver (Uber and Lyft both have one). For a traditional taxi, call the company directly with your trip time, pickup and drop-off. We help you gather the exact details.`,
    },
    {
      icon: "👮", iconBg: "bg-indigo-100", title: "Handed to the police (LAPD)",
      body: `The LAPD doesn't run a lost &amp; found, but found property goes into its Property System and is held for 90 days. File a lost-property report through the LAPD's online reporting service, or call 1-877-ASK-LAPD. We tell you which LAPD area covers your loss location.`,
      links: [{ label: "File an LAPD report →", href: "https://www.lapdonline.org/file-a-police-report/" }, { label: "How LAPD property works", href: "https://www.lapdonline.org/does-the-los-angeles-police-department-have-a-lost-and-found-section/" }],
    },
    {
      icon: "✈️", iconBg: "bg-sky-100", title: "LAX airport",
      body: `For items lost in public areas (gates, baggage, curbside, LAX-IT), submit a claim to LAX Airport Police Lost &amp; Found. Property is held about 97 days and mailed to you. On a plane or at the gate? Contact your airline instead.`,
      links: [{ label: "LAX Lost & Found →", href: "https://www.flylax.com/lax-comments-and-contact-us/lost-and-found" }],
    },
    {
      icon: "🌴", iconBg: "bg-green-100", title: "Street, beach, shop or venue",
      body: `Ask the venue's front desk or security first (malls, museums, stadiums, hotels and Union Station keep their own lost &amp; found). For items lost outdoors, a public alert on local groups is often what gets an honest finder to reach you.`,
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `File a report with LA Animal Services and search Petco Love Lost — LA shelters use it as the main lost-and-found tool through the LA Lost Pet Coalition. Contact your microchip company, and keep your details current. In county areas, use LA County Animal Care.`,
      links: [{ label: "LA Animal Services →", href: "https://www.laanimalservices.com/lost-pet" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }, { label: "LA County", href: "https://animalcare.lacounty.gov/if-you-lost-your-pet/" }],
    },
  ],
  midCtaHeading: "Don't wait — the first 48 hours matter most",
  midCtaBody: "Lost & found offices clear items on strict deadlines. Get in the system now.",
  areasHeading: "Lost something in a specific LA area?",
  areasSubtitle:
    "Los Angeles is huge and spread out. Knowing the area helps you target the right transit hub, LAPD division and local hotspots.",
  areas: [
    { name: "Downtown LA (DTLA)", blurb: "Union Station, the Financial District, the Arts District and LA Live. Union Station has its own lost & found, and Metro's A/B/D/E lines converge here." },
    { name: "Hollywood & Los Feliz", blurb: "Hollywood Blvd, the Walk of Fame, Griffith Observatory and Los Feliz. High foot traffic and nightlife mean lots of phones and wallets left behind." },
    { name: "Westside (Westwood, UCLA, Brentwood)", blurb: "UCLA has its own campus lost & found; for items lost off-campus, LAPD's West LA area and rideshare lost-item flows are your best bet." },
    { name: "Venice & the coast", blurb: "The Venice Boardwalk, Abbot Kinney and the beaches. Items lost on the sand are rarely recovered — post a public alert fast." },
    { name: "The San Fernando Valley", blurb: "Sherman Oaks, Van Nuys, North Hollywood and Studio City. Metro's B/G lines and Hollywood Burbank Airport serve the Valley." },
    { name: "Koreatown, Silver Lake & Echo Park", blurb: "Dense, transit-heavy neighborhoods with busy bars and restaurants — check the venue first, then Metro Lost & Found." },
  ],
  socialHeading: "Amplify your report on LA's social channels",
  socialSubtitle:
    "Most items come back through a person, not an office. We help you create a clean, shareable post and point you to the most active LA communities:",
  social: [
    ["Facebook groups", "“LA Lost & Found”, neighborhood & Valley groups"],
    ["Reddit", "r/LosAngeles, r/AskLosAngeles"],
    ["Nextdoor", "Your exact neighborhood — great for pets"],
    ["X / Twitter", "Tag the Metro line, station or venue"],
    ["Instagram", "Local lost-pet & community pages"],
    ["Building / campus boards", "UCLA, USC, coworking, residential"],
  ],
  faqHeading: "Los Angeles lost & found — frequently asked questions",
  faq: [
    { q: "How do I report something lost on LA Metro (bus or train)?", a: "File a Lost Item Report online at lostandfound.metro.net or in person at the Metro Lost & Found office (3571 Pasadena Ave). You'll get a reference number by email; wait 3 business days before checking. Items are held for 90 days." },
    { q: "Does the LAPD have a lost and found?", a: "No. The LAPD does not run a lost and found. Found property goes into their Property System and is held for 90 days. You can still file a lost-property report through the LAPD's online reporting service or by calling 1-877-ASK-LAPD." },
    { q: "I lost something at LAX — what do I do?", a: "For items lost in public areas of the airport, submit a claim to LAX Airport Police Lost & Found (they use the Crowdfind system). Property is held about 97 days and is mailed to you at your expense. For items left on a plane or at the gate, contact your airline; for a rideshare or taxi, contact that company directly." },
    { q: "I left something in an Uber, Lyft or taxi in LA.", a: "Use the app's 'I lost an item' flow to contact your driver (Uber and Lyft both have one). For a traditional taxi, call the taxi company directly with your trip details." },
    { q: "My pet is lost in Los Angeles — where do I start?", a: "File a report with LA Animal Services and use Petco Love Lost — LA shelters use it as the main lost-and-found tool through the LA Lost Pet Coalition. Contact your microchip company too, and make sure your details are current." },
    { q: "Is ReportLost.org official or does it replace the police?", a: "No. ReportLost.org is an independent service that helps you report to the right official channels faster and amplify your search across local social communities. The official offices retain and release the items." },
  ],
  nearby: [
    { label: "Long Beach", href: "/lost-and-found/ca/long-beach" },
    { label: "Santa Monica", href: "/lost-and-found/ca/santa-monica" },
    { label: "Pasadena", href: "/lost-and-found/ca/pasadena" },
    { label: "Glendale", href: "/lost-and-found/ca/glendale" },
    { label: "Burbank", href: "/lost-and-found/ca/burbank" },
    { label: "Inglewood", href: "/lost-and-found/ca/inglewood" },
    { label: "Beverly Hills", href: "/lost-and-found/ca/beverly-hills" },
    { label: "Anaheim", href: "/lost-and-found/ca/anaheim" },
  ],
  finalCtaHeading: "Ready to get your item back?",
  finalCtaBody: "One report. Every relevant channel in Los Angeles.",
  ctaLabel: "Report my lost item →",
  finalCtaLabel: "Start my report →",
  disclaimer:
    "ReportLost.org is an independent service and is not affiliated with LA Metro, the LAPD, Los Angeles World Airports (LAX), LA Animal Services or the City of Los Angeles. Official lost-and-found offices retain and release found property.",
};

// ======================================================================
// CHICAGO
// ======================================================================
const chicago: CityGuide = {
  state: "IL",
  citySlug: "chicago",
  badge: "Chicago, IL · Lost & Found",
  h1: "Left something behind in Chicago? Report it and start the search.",
  heroSubtitle:
    "File one report and we'll point you to the right <strong>Chicago Police district</strong>, the relevant <strong>CTA, airport and rideshare lost &amp; found</strong>, and the local groups that actually get items returned.",
  imageAltFallback: "View of Chicago",
  stepsHeading: "How ReportLost helps you recover it in Chicago",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Tell us what & where", body: "A quick description of the item and the spot you lost it is all we need to get started." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. We match it to the right desk", body: "CTA, an airport office, the Chicago Police district for that block, and the busiest local groups." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. We alert you on a match", body: "When your item surfaces, you hear about it and can arrange to pick it up." },
  ],
  intro: [
    `From the 'L' platforms downtown to the lakefront and the neighborhoods, Chicago is a big, busy city where a phone, a wallet, a bag — or a pet — can slip away in a moment. The city runs several lost-and-found systems, but they don't talk to each other, so the trick is starting with the right one. Report it here and we'll send you to the correct channel and the police district that covers where it happened.`,
    `On the CTA, at O'Hare or Midway, in a rideshare, or at a Loop restaurant — the sooner you report, the better your odds. Several offices hold items for only a few weeks before moving them on.`,
  ],
  guideHeading: "Where to report — depending on where you lost it",
  guideSubtitle:
    "Each part of Chicago's lost-and-found network handles different places. Start with the right one and you save days.",
  cards: [
    {
      icon: "🚆", iconBg: "bg-blue-100", title: "CTA bus or 'L' train (and Metra)",
      body: `Report your item to the CTA online or through the Ventra app. Left it on a Metra commuter train? That's a separate lost-and-found — use Metra's form instead.`,
      links: [{ label: "CTA Lost & Found →", href: "https://www.transitchicago.com/lostandfound/" }, { label: "Metra", href: "https://metra.com/lost-and-found" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Rideshare or taxi",
      body: `Uber and Lyft both have an in-app "I lost an item" option that connects you to your driver. For a metered cab, phone the company with your trip time and route. We help you pull those details together.`,
    },
    {
      icon: "👮", iconBg: "bg-indigo-100", title: "Turned in to the police (CPD)",
      body: `Recovered property is held by the CPD's Evidence &amp; Recovered Property Section. Bring your inventory receipt and a photo ID. Heads up: you generally have <strong>30 days</strong> to claim it before it can be disposed of.`,
      links: [{ label: "How CPD property works →", href: "https://www.chicagopolice.org/police-records-procedures/notice-to-owners-of-property/" }],
    },
    {
      icon: "✈️", iconBg: "bg-sky-100", title: "O'Hare or Midway",
      body: `O'Hare's Lost &amp; Found is in Terminal 2 (lower level); Midway has its own Communication Center. Security-checkpoint items go through TSA, and anything left on the plane or at the gate is handled by your airline.`,
      links: [{ label: "O'Hare →", href: "https://www.flychicago.com/ohare/ServicesAmenities/services/Pages/lostfound.aspx" }, { label: "Midway", href: "https://www.flychicago.com/midway/ServicesAmenities/services/Pages/lostfound.aspx" }],
    },
    {
      icon: "🏙️", iconBg: "bg-green-100", title: "Street, park, shop or venue",
      body: `Ask the front desk or security first — stadiums, museums, hotels and Union Station keep their own lost &amp; found. For anything lost outdoors, a public alert on Chicago groups is often what brings it back.`,
      links: [{ label: "Chicago 311 →", href: "https://311.chicago.gov/" }],
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `Watch the Chicago Animal Care &amp; Control listings on petharbor.com/chicago, text LOST to 1-855-LOST312 for step-by-step help, and post to Petco Love Lost. A microchip is the single best way to be reunited — keep yours up to date.`,
      links: [{ label: "Chicago Animal Care →", href: "https://www.chicago.gov/city/en/depts/cacc/provdrs/care/svcs/lost_pet_recovery.html" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }],
    },
  ],
  midCtaHeading: "The clock is ticking — report it today",
  midCtaBody: "Chicago offices clear unclaimed items on tight timelines. Get your report in the system now.",
  areasHeading: "Which Chicago neighborhood did you lose it in?",
  areasSubtitle:
    "Chicago is a city of neighborhoods, each with its own transit stops, police district and hotspots. Pinning down the area speeds everything up.",
  areas: [
    { name: "The Loop & River North", blurb: "Downtown offices, Millennium Park, Union Station and the busiest CTA transfers. Rush-hour crowds mean plenty of phones and wallets left on the 'L'." },
    { name: "North Side (Lincoln Park, Lakeview, Wrigleyville)", blurb: "Game days at Wrigley, lakefront paths and a dense bar scene — check the venue first, then CTA Lost & Found." },
    { name: "Wicker Park & Logan Square", blurb: "The Blue Line to O'Hare runs through here, so items lost on the way to the airport often turn up on this corridor." },
    { name: "South Side (Hyde Park, Bronzeville)", blurb: "The University of Chicago, Metra Electric and the Museum of Science and Industry. Campus and museum desks keep their own lost & found." },
    { name: "West Loop & Pilsen", blurb: "Restaurant Row, the United Center and a growing transit hub. Venues and rideshares are the first places to check." },
  ],
  socialHeading: "Get more eyes on it across Chicago's communities",
  socialSubtitle:
    "A returned item usually comes from a helpful stranger, not an office. We help you write a clean, shareable post and aim it at the most active Chicago communities:",
  social: [
    ["Facebook groups", "Neighborhood & “Chicago Lost & Found” groups"],
    ["Reddit", "r/chicago, r/AskChicago"],
    ["Nextdoor", "Your block — especially useful for pets"],
    ["X / Twitter", "Tag the CTA line, station or venue"],
    ["Instagram", "Local lost-pet & community pages"],
    ["Campus & building boards", "UChicago, Loop offices, residential"],
  ],
  faqHeading: "Chicago lost & found — quick answers",
  faq: [
    { q: "Where do I report an item left on a CTA bus or 'L' train?", a: "Submit a lost-item report to CTA online (via transitchicago.com/lostandfound), through the Ventra app, or by contacting Customer Service. If it happened on a Metra commuter train instead, use Metra's separate lost-and-found." },
    { q: "Does the Chicago Police Department keep lost property?", a: "Recovered property is handled by the CPD's Evidence & Recovered Property Section (1011 S. Homan Ave). If your inventory receipt says the item is available for return, bring it with a photo ID. Claim it within 30 days — after that it can be sold, donated or destroyed under city code." },
    { q: "I lost something at O'Hare or Midway.", a: "For O'Hare, contact the airport Lost & Found (Terminal 2, lower level). For Midway, call the Communication Center. Items left at a TSA checkpoint go through TSA, and anything left on the plane or at the gate is handled by your airline." },
    { q: "What about an Uber, Lyft or taxi?", a: "Open the app's lost-item help to reach your driver (Uber and Lyft both offer this). For a metered cab, call the taxi company with your pickup time and route." },
    { q: "My pet went missing in Chicago — what's the first step?", a: "Check the Chicago Animal Care & Control listings (petharbor.com/chicago), text LOST to 1-855-LOST312 for guidance, and post to Petco Love Lost. Have any shelter or vet scan for a microchip and keep your registration current." },
    { q: "Is ReportLost.org an official city service?", a: "No — we're independent. We help you reach the correct official channels quickly and spread the word across local communities. The official lost-and-found offices are the ones that hold and release recovered items." },
  ],
  nearby: [
    { label: "Evanston", href: "/lost-and-found/il/evanston" },
    { label: "Oak Park", href: "/lost-and-found/il/oak-park" },
    { label: "Cicero", href: "/lost-and-found/il/cicero" },
    { label: "Naperville", href: "/lost-and-found/il/naperville" },
    { label: "Aurora", href: "/lost-and-found/il/aurora" },
    { label: "Skokie", href: "/lost-and-found/il/skokie" },
    { label: "Schaumburg", href: "/lost-and-found/il/schaumburg" },
    { label: "Joliet", href: "/lost-and-found/il/joliet" },
  ],
  finalCtaHeading: "Ready to track it down?",
  finalCtaBody: "One report reaches every channel that matters in Chicago.",
  ctaLabel: "Report my lost item →",
  finalCtaLabel: "Start my report →",
  disclaimer:
    "ReportLost.org is an independent service and is not affiliated with the CTA, the Chicago Police Department, the Chicago Department of Aviation, Chicago Animal Care & Control or the City of Chicago. Official lost-and-found offices retain and release found property.",
};

// ======================================================================
// HOUSTON
// ======================================================================
const houston: CityGuide = {
  state: "TX",
  citySlug: "houston",
  badge: "Houston, TX · Lost & Found",
  h1: "Lost something in Houston? Report it and we'll route it to the right hands.",
  heroSubtitle:
    "Send one report and we'll connect you with the right <strong>HPD property channel</strong>, the relevant <strong>METRO, airport and rideshare lost &amp; found</strong>, and the local groups most likely to spot it.",
  imageAltFallback: "View of Houston",
  stepsHeading: "How ReportLost gets your item back in Houston",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Describe your loss", body: "Tell us the item and roughly where and when it went missing — details make the match." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. We send it to the right office", body: "METRO, the airport, the HPD property channel for that area, and the busiest Houston groups." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. You get the good news", body: "If it turns up, we let you know so you can arrange to collect it." },
  ],
  intro: [
    `As the largest city in Texas and one of the most spread-out in the country, Houston gives a lost phone, wallet or pet a lot of ground to disappear into — from the METRORail downtown to the Galleria, the Medical Center and two major airports. Each has its own lost-and-found process, and they work independently. Report it here and we'll steer you to the right one and the police area that covers where it happened.`,
    `Whether it slipped away on a Park &amp; Ride bus, at IAH or Hobby, in a rideshare, or at a Montrose restaurant, don't sit on it — some offices only hold items for about a month.`,
  ],
  guideHeading: "The right place to report, by where it went missing",
  guideSubtitle:
    "Houston's lost-and-found offices don't overlap. Match your situation below and skip the runaround.",
  cards: [
    {
      icon: "🚈", iconBg: "bg-blue-100", title: "METRO bus, METRORail or Park & Ride",
      body: `Call 713-658-0854 or email METRO with your item description and route or vehicle number. If it's found, you'll get a claim number and pick it up at the RideStore on Main Street. Items are held around 30 days.`,
      links: [{ label: "METRO Lost & Found →", href: "https://www.ridemetro.org/riding-metro/lost-and-found" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Uber, Lyft or taxi",
      body: `Both Uber and Lyft let you report a lost item and message your driver from the app. For a taxi, call the company directly with your pickup time and route. We help you assemble the details that speed it up.`,
    },
    {
      icon: "👮", iconBg: "bg-indigo-100", title: "Turned in to the police (HPD)",
      body: `The HPD Property Division stores found and unclaimed property. To claim an item, email Property.Investigations@Houstontx.gov with a description and proof of ownership. Public notices stay up for at least 90 days.`,
      links: [{ label: "HPD found property →", href: "https://www.houstontx.gov/police/divisions/property/found_abandoned_or_unclaimed_property.htm" }],
    },
    {
      icon: "✈️", iconBg: "bg-sky-100", title: "IAH or Hobby airport",
      body: `Bush Intercontinental (IAH) and Hobby (HOU) each run their own Lost &amp; Found with an online form. Checkpoint items go through TSA at that airport; anything left on board is held by your airline.`,
      links: [{ label: "IAH →", href: "https://www.fly2houston.com/iah/lost-and-found/" }, { label: "Hobby", href: "https://www.fly2houston.com/hou/lost-and-found/" }],
    },
    {
      icon: "🤠", iconBg: "bg-green-100", title: "Street, mall, shop or venue",
      body: `Front desks and security at malls, stadiums, museums and hotels keep their own lost &amp; found — always ask there first. For anything lost in public, a shareable alert to Houston groups widens the net fast.`,
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `Report and search on Petco Love Lost, and check BARC (the city shelter) at 3200 Carr St. The Houston SPCA and Houston Humane Society help too. If your pet has a microchip, contact the chip company right away.`,
      links: [{ label: "BARC lost pets →", href: "https://www.houstontx.gov/barc/lost_pet.html" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }, { label: "Houston SPCA", href: "https://houstonspca.org/resources-programs/found-animals/" }],
    },
  ],
  midCtaHeading: "Move quickly — most items don't wait around",
  midCtaBody: "Several Houston offices hold unclaimed items for only weeks. File your report now.",
  areasHeading: "Which part of Houston did you lose it in?",
  areasSubtitle:
    "Houston is enormous and car-centric. Knowing the district points you to the right transit hub, police station and the venues worth calling first.",
  areas: [
    { name: "Downtown & Midtown", blurb: "The theater district, sports venues and the METRORail Red Line. The METRO RideStore on Main Street is where recovered transit items are picked up." },
    { name: "The Galleria & Uptown", blurb: "Houston's biggest shopping district — malls and hotels keep their own lost & found, so ask the front desk before anything else." },
    { name: "Texas Medical Center & Museum District", blurb: "One of the busiest medical complexes in the world, plus Rice University and the museums. Campus and hospital desks handle their own found items." },
    { name: "Montrose & The Heights", blurb: "Walkable, restaurant- and bar-heavy neighborhoods where items are most often left at venues — a quick call usually beats waiting." },
    { name: "Energy Corridor & the west side", blurb: "Sprawling office parks and Park & Ride commuter routes. Items lost on a Park & Ride bus go through METRO Lost & Found." },
  ],
  socialHeading: "Spread the word across Houston",
  socialSubtitle:
    "More often than not, an honest neighbor is what reunites you with your item. We help you post a clean alert to the Houston communities that see the most traffic:",
  social: [
    ["Facebook groups", "Neighborhood & “Houston Lost & Found” groups"],
    ["Reddit", "r/houston, r/askhouston"],
    ["Nextdoor", "Your subdivision — great for pets"],
    ["X / Twitter", "Tag the METRO route, station or venue"],
    ["Instagram", "Local lost-pet & community pages"],
    ["Campus & office boards", "Rice, UH, TMC, Energy Corridor"],
  ],
  faqHeading: "Houston lost & found — your questions answered",
  faq: [
    { q: "How do I get back something left on a METRO bus or train?", a: "Call METRO Lost & Found at 713-658-0854 or email LostAndFound@RideMETRO.org with a description and your route or vehicle number. If it's found, you'll get a claim number and can pick it up at the RideStore, 1900 Main Street. Items are held about 30 days." },
    { q: "How does the Houston Police Department handle found property?", a: "Found and unclaimed property is managed by the HPD Property Division (1202 Washington Ave). To claim an item, email Property.Investigations@Houstontx.gov with a description and proof of ownership. Public notices of found property stay up for at least 90 days." },
    { q: "I lost something at Bush Intercontinental (IAH) or Hobby (HOU).", a: "Each airport has its own Lost & Found with an online form — IAH and Hobby are handled separately. Security-checkpoint items go through TSA at that airport, and anything left on the plane is held by your airline." },
    { q: "What about an Uber, Lyft or taxi ride?", a: "Use the app's lost-item feature to message your driver (both Uber and Lyft have one). For a taxi, call the company with your trip time and pickup/drop-off details." },
    { q: "My pet is missing in Houston — where do I begin?", a: "Search and report on Petco Love Lost, and check BARC (the city shelter) at 3200 Carr St or call 832-395-9084. The Houston SPCA and Houston Humane Society can help too. If your pet is microchipped, alert the chip company right away." },
    { q: "Are you the city's official lost and found?", a: "No. ReportLost.org is an independent service that helps you reach the right official channels faster and spread the word locally. The official offices are the ones that store and release recovered property." },
  ],
  nearby: [
    { label: "Sugar Land", href: "/lost-and-found/tx/sugar-land" },
    { label: "Pearland", href: "/lost-and-found/tx/pearland" },
    { label: "Pasadena", href: "/lost-and-found/tx/pasadena" },
    { label: "Baytown", href: "/lost-and-found/tx/baytown" },
    { label: "Katy", href: "/lost-and-found/tx/katy" },
    { label: "The Woodlands", href: "/lost-and-found/tx/the-woodlands" },
    { label: "Galveston", href: "/lost-and-found/tx/galveston" },
    { label: "Spring", href: "/lost-and-found/tx/spring" },
  ],
  finalCtaHeading: "Ready to get it back?",
  finalCtaBody: "One report covers every channel that counts in Houston.",
  ctaLabel: "Report my lost item →",
  finalCtaLabel: "Start my report →",
  disclaimer:
    "ReportLost.org is an independent service and is not affiliated with METRO, the Houston Police Department, the Houston Airport System, BARC or the City of Houston. Official lost-and-found offices retain and release found property.",
};

// ======================================================================
// PHOENIX
// ======================================================================
const phoenix: CityGuide = {
  state: "AZ",
  citySlug: "phoenix",
  badge: "Phoenix, AZ · Lost & Found",
  h1: "Lost something in Phoenix? Report it and let's track it down.",
  heroSubtitle:
    "One report and we'll steer you to the right <strong>Phoenix Police property bureau</strong>, the relevant <strong>Valley Metro, Sky Harbor and rideshare lost &amp; found</strong>, and the local groups most likely to help.",
  imageAltFallback: "View of Phoenix",
  stepsHeading: "How we help you get it back in the Valley",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Log what you lost", body: "A short description and the spot it went missing is enough for us to get moving." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. We aim it at the right desk", body: "Valley Metro, Sky Harbor, the Phoenix Police property bureau, and the busiest Valley groups." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. We flag any match", body: "If your item shows up, you'll know — and can set up a pickup." },
  ],
  intro: [
    `Across the Valley of the Sun — from downtown Phoenix and the light rail to Sky Harbor and the desert trailheads — a phone, wallet or pet can go missing just about anywhere. Phoenix has a handful of separate lost-and-found systems, and each covers different ground. Report it here and we'll direct you to the right one and the police area that covers where it happened.`,
    `On Valley Metro, at PHX, in a rideshare or at a Scottsdale-adjacent resort, timing counts — Sky Harbor, for instance, holds most items only about ten days.`,
  ],
  guideHeading: "Pick the right lost & found for your situation",
  guideSubtitle:
    "Phoenix's offices each cover different places. Start with the one below that fits, and you'll save yourself days of calls.",
  cards: [
    {
      icon: "🚈", iconBg: "bg-blue-100", title: "Valley Metro rail or bus",
      body: `Items are handled by City of Phoenix Public Transit. Call (602) 534-5053 to confirm before you go — most are at Central Station (302 N. 1st Ave), though some routes are held in Tempe.`,
      links: [{ label: "Valley Metro Lost & Found →", href: "https://www.valleymetro.org/lost-found" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Uber, Lyft or taxi",
      body: `Report the item and message your driver from the Uber or Lyft app. For a taxi, call the company with your pickup time and route. We help you gather the details that get a faster reply.`,
    },
    {
      icon: "👮", iconBg: "bg-indigo-100", title: "Turned in to the police (Phoenix PD)",
      body: `Recovered property is held by the Phoenix Police Property Management Bureau (100 E. Elwood St). Bring ID and proof of ownership. For unclaimed items, you usually have <strong>30 days</strong> from publication to claim.`,
      links: [{ label: "Claim police property →", href: "https://www.phoenix.gov/police/resources-information/unclaimed-property" }],
    },
    {
      icon: "✈️", iconBg: "bg-sky-100", title: "Sky Harbor (PHX)",
      body: `For terminals, the PHX Sky Train, buses or parking, contact Sky Harbor Lost &amp; Found. Items are held only about 10 days (keys 30). Checkpoint items go through TSA; anything on the plane is held by your airline.`,
      links: [{ label: "Sky Harbor Lost & Found →", href: "https://www.skyharbor.com/at-the-airport/services/lost-found/" }],
    },
    {
      icon: "🌵", iconBg: "bg-green-100", title: "Street, trail, shop or venue",
      body: `Resorts, malls, stadiums and museums keep their own lost &amp; found, so ask the front desk first. For anything lost outdoors or on a trail, a public alert to Valley groups is often what brings it home.`,
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `Report and search on Petco Love Lost, and check Maricopa County Animal Care &amp; Control (602-506-7387). Note the county doesn't impound stray cats, but you can still list them. Alert your microchip company and keep your details current.`,
      links: [{ label: "Maricopa County →", href: "https://www.maricopa.gov/162/Lost-Found-Pet" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }, { label: "AZ Humane", href: "https://www.azhumane.org/lost-a-pet/" }],
    },
  ],
  midCtaHeading: "Don't let the window close",
  midCtaBody: "Some Phoenix offices only hold items for about ten days. Get your report in now.",
  areasHeading: "Which part of Phoenix did you lose it in?",
  areasSubtitle:
    "Phoenix is vast and low-density. Knowing the area helps you target the right transit stop, police precinct and the venues worth calling first.",
  areas: [
    { name: "Downtown & the light rail corridor", blurb: "Sports arenas, ASU Downtown and the Valley Metro Rail line along Central Ave. Central Station is where many recovered transit items end up." },
    { name: "Midtown & Uptown", blurb: "The museums, Park Central and the Camelback corridor. Venues and offices along the rail line keep their own lost & found." },
    { name: "Camelback, Arcadia & Biltmore", blurb: "Resorts, golf and upscale shopping — hotels and clubs almost always log found items at the front desk, so start there." },
    { name: "Sky Harbor & the airport area", blurb: "PHX, the Sky Train and the rental-car center. Items in the terminals or on the Sky Train go through Sky Harbor Lost & Found." },
    { name: "North Phoenix, Deer Valley & Ahwatukee", blurb: "Spread-out residential areas and trailheads. Items lost on a hike are rarely handed in — a public alert is your best shot." },
  ],
  socialHeading: "Get more eyes on it across the Valley",
  socialSubtitle:
    "Most items come back thanks to a helpful stranger, not an office. We help you post a clean alert to the Phoenix-area communities with the most reach:",
  social: [
    ["Facebook groups", "Neighborhood & “Phoenix Lost & Found” groups"],
    ["Reddit", "r/phoenix, r/askphoenix"],
    ["Nextdoor", "Your neighborhood — great for pets"],
    ["X / Twitter", "Tag the Valley Metro line, station or venue"],
    ["Instagram", "Local lost-pet & community pages"],
    ["Campus & office boards", "ASU, downtown, Sky Harbor area"],
  ],
  faqHeading: "Phoenix lost & found — common questions",
  faq: [
    { q: "Where do I report an item left on Valley Metro rail or a bus?", a: "Items found on Valley Metro light rail and buses are handled by the City of Phoenix Public Transit team, usually at the Central Station office (302 N. 1st Ave). Call (602) 534-5053 first to confirm your item is there — some routes are held at a Tempe facility instead." },
    { q: "How do I claim property held by the Phoenix Police?", a: "Contact the Phoenix Police Property Management Bureau at (602) 261-8371 (100 E. Elwood St). You'll need government ID and proof of ownership. For unclaimed items, you generally have 30 days from the date of publication to make a claim." },
    { q: "I lost something at Sky Harbor (PHX).", a: "For terminals, the PHX Sky Train, buses or parking, call Sky Harbor Lost & Found at 602-273-3333 or email lostandfound@phoenix.gov. Items are held only about 10 days (keys 30). Checkpoint items go through TSA; anything left on the plane is held by your airline." },
    { q: "What about a rideshare or taxi?", a: "Uber and Lyft both have an in-app 'I lost an item' option to reach your driver. For a taxi, call the company directly with your trip time and route." },
    { q: "My pet is lost in the Phoenix area — what should I do?", a: "Report and search on Petco Love Lost, and check Maricopa County Animal Care & Control (602-506-7387; West shelter at 2500 S. 27th Ave). Note the county doesn't impound stray cats, but you can still list them online. The Arizona Humane Society can help, and a microchip is your best chance at a fast reunion." },
    { q: "Is ReportLost.org an official government service?", a: "No. We're an independent service that helps you reach the right official channels faster and get the word out locally. The official offices are the ones that store and release recovered property." },
  ],
  nearby: [
    { label: "Tempe", href: "/lost-and-found/az/tempe" },
    { label: "Scottsdale", href: "/lost-and-found/az/scottsdale" },
    { label: "Mesa", href: "/lost-and-found/az/mesa" },
    { label: "Glendale", href: "/lost-and-found/az/glendale" },
    { label: "Chandler", href: "/lost-and-found/az/chandler" },
    { label: "Gilbert", href: "/lost-and-found/az/gilbert" },
    { label: "Peoria", href: "/lost-and-found/az/peoria" },
    { label: "Surprise", href: "/lost-and-found/az/surprise" },
  ],
  finalCtaHeading: "Ready to find it?",
  finalCtaBody: "One report reaches every channel that matters across Phoenix.",
  ctaLabel: "Report my lost item →",
  finalCtaLabel: "Start my report →",
  disclaimer:
    "ReportLost.org is an independent service and is not affiliated with Valley Metro, the Phoenix Police Department, Phoenix Sky Harbor International Airport, Maricopa County Animal Care & Control or the City of Phoenix. Official lost-and-found offices retain and release found property.",
};

// ======================================================================
// Registre + lookup
// ======================================================================
export const cityGuides: CityGuide[] = [newYork, losAngeles, chicago, houston, phoenix];

export function getCityGuide(state: string, cityAscii: string): CityGuide | null {
  const st = (state || "").toUpperCase();
  const slug = String(cityAscii || "").trim().toLowerCase();
  return cityGuides.find((g) => g.state === st && g.citySlug === slug) ?? null;
}
