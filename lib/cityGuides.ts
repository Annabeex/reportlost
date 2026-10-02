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
  h1: "Lost and found information for New York City",
  heroSubtitle:
    "Use this guide to identify lost-and-found contacts for the <strong>NYPD</strong>, <strong>MTA, taxis and airports</strong>, venues and local services. ReportLost is independent; available options are shown before a report is submitted.",
  imageAltFallback: "View of New York City",
  stepsHeading: "How to report a lost item in New York",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Record the loss", body: "Note the item’s identifying details, the date and the place where it may have been left." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. Check the relevant contact", body: "Use the official agency or venue links below. ReportLost’s available options and included services are shown on the report form." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. Review replies and potential matches", body: "For paid search options, potential public-web matches are reviewed before notification. Replies from agencies and venues follow their own procedures." },
  ],
  intro: [
    `New York City has separate lost-and-found processes for transit, taxis, airports, police, venues and animal services. The guide below lists contact details and filing instructions for common situations.`,
    `Transit providers, airports, police departments and venues each have their own lost-property process and claim policies. Use the contact details below for the place where the item may have been left.`,
  ],
  guideHeading: "Lost-and-found contacts by location type",
  guideSubtitle:
    "Transit providers, airports, agencies and venues maintain separate lost-and-found processes. The links below identify the relevant contact for each type of location.",
  cards: [
    {
      icon: "🚇", iconBg: "bg-blue-100", title: "Subway, bus or Staten Island Railway (MTA)",
      body: `Tell the nearest station booth agent, or file a claim with <strong>NYC Transit Lost &amp; Found</strong> at lostandfound.mta.info or by calling <strong>511</strong> (24/7). The agency lists a minimum holding period of <strong>3 months</strong>; the central office is by appointment after it contacts a claimant.`,
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
      body: `Ask the venue's front desk or security first (museums, malls, stadiums and hotels keep their own lost &amp; found). For items lost on the street, contact the relevant NYPD precinct. A public listing can also share item details with local residents through the protected relay.`,
      links: [{ label: "NYC311 lost & found →", href: "https://portal.311.nyc.gov/" }],
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `File a lost-pet report with <strong>Animal Care Centers of NYC (ACC)</strong> and search their found database — it links to <strong>Petco Love Lost</strong> facial recognition. Ask shelters or veterinary clinics about microchip scans, and keep your registration details current. You can also post in neighborhood groups and Nextdoor.`,
      links: [{ label: "ACC lost & found →", href: "https://www.nycacc.org/services/lost-and-found/" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }],
    },
  ],
  midCtaHeading: "Choose a report option",
  midCtaBody: "Create a free public listing, add six months of automatic web monitoring for $12, or choose team-assisted search for $25 and 12 months of monitoring.",
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
  socialHeading: "New York community channels",
  socialSubtitle:
    "Local social channels provide another way to share a report. These are examples of NYC community channels:",
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
    { q: "Is ReportLost.org official / does it replace the police?", a: "No. ReportLost is independent. Official agencies and venues handle their own filing procedures and retain and release found property. Paid team-assisted search includes relevant local outreach." },
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
  finalCtaHeading: "Create a lost-item report",
  finalCtaBody: "Review the available report options and official channels for New York City.",
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
  h1: "Lost and found information for Los Angeles",
  heroSubtitle:
    "Use this guide to identify lost-and-found contacts for the <strong>LAPD</strong>, <strong>Metro, LAX and rideshare providers</strong>, venues and local services. ReportLost is independent; available options are shown before a report is submitted.",
  imageAltFallback: "View of Los Angeles",
  stepsHeading: "How to report a lost item in Los Angeles",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Record the loss", body: "Note the item’s identifying details, the date and the place where it may have been left." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. Check the relevant contact", body: "Use the official agency or venue links below. ReportLost’s available options and included services are shown on the report form." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. Review replies and potential matches", body: "For paid search options, potential public-web matches are reviewed before notification. Replies from agencies and venues follow their own procedures." },
  ],
  intro: [
    `Los Angeles has separate lost-and-found processes for Metro, airports, police, rideshare providers, venues and animal services. The guide below lists contact details and filing instructions for common situations.`,
    `Transit providers, airports, police departments and venues each have their own lost-property process and claim policies. Use the contact details below for the place where the item may have been left.`,
  ],
  guideHeading: "Lost-and-found contacts by location type",
  guideSubtitle:
    "Transit providers, airports, agencies and venues maintain separate lost-and-found processes. The links below identify the relevant contact for each type of location.",
  cards: [
    {
      icon: "🚇", iconBg: "bg-blue-100", title: "Metro bus or train (and Metrolink)",
      body: `File a Lost Item Report online with Metro. You'll get a reference number by email; wait 3 business days, then verify at the Lost &amp; Found office. The agency lists a 90-day holding period. For Metrolink trains, call or text 800-371-5465.`,
      links: [{ label: "File a Metro report →", href: "https://lostandfound.metro.net/" }, { label: "Metrolink", href: "https://metrolinktrains.com/customer-service/lost--found/" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Uber, Lyft or taxi",
      body: `Use the app's "I lost an item" flow to contact an Uber or Lyft driver. For a traditional taxi, contact the company with your trip time, pickup and drop-off.`,
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
      body: `Ask the venue's front desk or security first (malls, museums, stadiums, hotels and Union Station keep their own lost &amp; found). For items lost outdoors, a public listing on local groups can share the item details with nearby residents.`,
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `File a report with LA Animal Services and search Petco Love Lost — LA shelters use it as the main lost-and-found tool through the LA Lost Pet Coalition. Contact your microchip company, and keep your details current. In county areas, use LA County Animal Care.`,
      links: [{ label: "LA Animal Services →", href: "https://www.laanimalservices.com/lost-pet" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }, { label: "LA County", href: "https://animalcare.lacounty.gov/if-you-lost-your-pet/" }],
    },
  ],
  midCtaHeading: "Choose a report option",
  midCtaBody: "Create a free public listing, add six months of automatic web monitoring for $12, or choose team-assisted search for $25 and 12 months of monitoring.",
  areasHeading: "Lost something in a specific LA area?",
  areasSubtitle:
    "Los Angeles is huge and spread out. Knowing the area helps you target the right transit hub, LAPD division and local hotspots.",
  areas: [
    { name: "Downtown LA (DTLA)", blurb: "Union Station, the Financial District, the Arts District and LA Live. Union Station has its own lost & found, and Metro's A/B/D/E lines converge here." },
    { name: "Hollywood & Los Feliz", blurb: "Hollywood Blvd, the Walk of Fame, Griffith Observatory and Los Feliz. High foot traffic and nightlife mean lots of phones and wallets left behind." },
    { name: "Westside (Westwood, UCLA, Brentwood)", blurb: "UCLA has its own campus lost & found; for items lost off-campus, LAPD's West LA area and rideshare lost-item flows are your best bet." },
    { name: "Venice & the coast", blurb: "The Venice Boardwalk, Abbot Kinney and the beaches. For items lost on the sand, check with the relevant beach or city service and share a public listing if useful." },
    { name: "The San Fernando Valley", blurb: "Sherman Oaks, Van Nuys, North Hollywood and Studio City. Metro's B/G lines and Hollywood Burbank Airport serve the Valley." },
    { name: "Koreatown, Silver Lake & Echo Park", blurb: "Dense, transit-heavy neighborhoods with busy bars and restaurants — check the venue first, then Metro Lost & Found." },
  ],
  socialHeading: "Los Angeles community channels",
  socialSubtitle:
    "Local social channels provide another way to share a report. These are examples of LA community channels:",
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
    { q: "Is ReportLost.org official or does it replace the police?", a: "No. ReportLost.org is independent. Official agencies and venues handle their own filing procedures and retain and release found property. Paid team-assisted search includes relevant local outreach." },
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
  finalCtaHeading: "Create a lost-item report",
  finalCtaBody: "Review the available report options and official channels for Los Angeles.",
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
  h1: "Lost and found information for Chicago",
  heroSubtitle:
    "Use this guide to identify lost-and-found contacts for the <strong>Chicago Police</strong>, <strong>CTA, airports and rideshare providers</strong>, venues and local services. ReportLost is independent; available options are shown before a report is submitted.",
  imageAltFallback: "View of Chicago",
  stepsHeading: "How to report a lost item in Chicago",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Record the loss", body: "Note the item’s identifying details, the date and the place where it may have been left." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. Check the relevant contact", body: "Use the official agency or venue links below. ReportLost’s available options and included services are shown on the report form." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. Review replies and potential matches", body: "For paid search options, potential public-web matches are reviewed before notification. Replies from agencies and venues follow their own procedures." },
  ],
  intro: [
    `Chicago has separate lost-and-found processes for CTA, airports, police, rideshare providers, venues and animal services. The guide below lists contact details and filing instructions for common situations.`,
    `CTA, airport, rideshare and venue reports each follow a different process. Review the relevant office’s current instructions and retention policy.`,
  ],
  guideHeading: "Lost-and-found contacts by location type",
  guideSubtitle:
    "Chicago's lost-and-found agencies handle different locations. Use the links below to identify the relevant office.",
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
      body: `Recovered property is held by the CPD's Evidence &amp; Recovered Property Section. Bring your inventory receipt and a photo ID. The reported claim period is generally <strong>30 days</strong>; confirm the date and process with the department.`,
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
      body: `Watch the Chicago Animal Care &amp; Control listings on petharbor.com/chicago, text LOST to 1-855-LOST312 for step-by-step help, and post to Petco Love Lost. Keep your pet’s microchip registration details current.`,
      links: [{ label: "Chicago Animal Care →", href: "https://www.chicago.gov/city/en/depts/cacc/provdrs/care/svcs/lost_pet_recovery.html" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }],
    },
  ],
  midCtaHeading: "Choose a report option",
  midCtaBody: "Create a free public listing, add six months of automatic web monitoring for $12, or choose team-assisted search for $25 and 12 months of monitoring.",
  areasHeading: "Which Chicago neighborhood did you lose it in?",
  areasSubtitle:
    "The relevant transit operator, police district or venue depends on the loss location. Use the area information below to identify likely contacts.",
  areas: [
    { name: "The Loop & River North", blurb: "Downtown offices, Millennium Park, Union Station and the busiest CTA transfers. Rush-hour crowds mean plenty of phones and wallets left on the 'L'." },
    { name: "North Side (Lincoln Park, Lakeview, Wrigleyville)", blurb: "Game days at Wrigley, lakefront paths and a dense bar scene — check the venue first, then CTA Lost & Found." },
    { name: "Wicker Park & Logan Square", blurb: "The Blue Line to O'Hare runs through here, so items lost on the way to the airport often turn up on this corridor." },
    { name: "South Side (Hyde Park, Bronzeville)", blurb: "The University of Chicago, Metra Electric and the Museum of Science and Industry. Campus and museum desks keep their own lost & found." },
    { name: "West Loop & Pilsen", blurb: "Restaurant Row, the United Center and a growing transit hub. Venues and rideshares are the first places to check." },
  ],
  socialHeading: "Chicago community channels",
  socialSubtitle:
    "Local social channels provide another way to share a report. Examples of Chicago community channels:",
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
    { q: "Is ReportLost.org an official city service?", a: "No — we're independent. We provide information about official channels and optional local outreach, depending on the service selected. The official lost-and-found offices are the ones that hold and release recovered items." },
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
  finalCtaHeading: "Create a lost-item report",
  finalCtaBody: "Review the available report options and official channels for Chicago.",
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
  h1: "Lost and found information for Houston",
  heroSubtitle:
    "Use this guide to identify lost-and-found contacts for <strong>HPD</strong>, <strong>METRO, airports and rideshare providers</strong>, venues and local services. ReportLost is independent; available options are shown before a report is submitted.",
  imageAltFallback: "View of Houston",
  stepsHeading: "How to report a lost item in Houston",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Record the loss", body: "Note the item’s identifying details, the date and the place where it may have been left." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. Check the relevant contact", body: "Use the official agency or venue links below. ReportLost’s available options and included services are shown on the report form." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. Review replies and potential matches", body: "For paid search options, potential public-web matches are reviewed before notification. Replies from agencies and venues follow their own procedures." },
  ],
  intro: [
    `Houston has separate lost-and-found processes for METRO, airports, police, rideshare providers, venues and animal services. The guide below lists contact details and filing instructions for common situations.`,
    `Transit providers, airports, rideshare companies, restaurants and venues each have their own lost-property procedures and retention policies.`,
  ],
  guideHeading: "Lost-and-found contacts by location type",
  guideSubtitle:
    "Houston's lost-and-found offices handle different locations. Use the links below to find the appropriate office.",
  cards: [
    {
      icon: "🚈", iconBg: "bg-blue-100", title: "METRO bus, METRORail or Park & Ride",
      body: `Call 713-658-0854 or email METRO with your item description and route or vehicle number. If it's found, you'll get a claim number and pick it up at the RideStore on Main Street. The reported holding period is around 30 days.`,
      links: [{ label: "METRO Lost & Found →", href: "https://www.ridemetro.org/riding-metro/lost-and-found" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Uber, Lyft or taxi",
      body: `Uber and Lyft provide in-app lost-item flows. For a taxi, contact the company with your trip time and route.`,
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
      body: `Front desks and security at malls, stadiums, museums and hotels keep their own lost &amp; found — always ask there first. For anything lost in public, a shareable notice to Houston groups provides another way to share the item details.`,
    },
    {
      icon: "🐾", iconBg: "bg-rose-100", title: "Lost pet (dog, cat, other)",
      body: `Report and search on Petco Love Lost, and check BARC (the city shelter) at 3200 Carr St. The Houston SPCA and Houston Humane Society help too. If your pet has a microchip, contact the chip company as well.`,
      links: [{ label: "BARC lost pets →", href: "https://www.houstontx.gov/barc/lost_pet.html" }, { label: "Petco Love Lost", href: "https://lost.petcolove.org/" }, { label: "Houston SPCA", href: "https://houstonspca.org/resources-programs/found-animals/" }],
    },
  ],
  midCtaHeading: "Choose a report option",
  midCtaBody: "Create a free public listing, add six months of automatic web monitoring for $12, or choose team-assisted search for $25 and 12 months of monitoring.",
  areasHeading: "Which part of Houston did you lose it in?",
  areasSubtitle:
    "Houston covers a wide area. The neighborhood details below can help identify the relevant transit hub, police station or venue.",
  areas: [
    { name: "Downtown & Midtown", blurb: "The theater district, sports venues and the METRORail Red Line. The METRO RideStore on Main Street is where recovered transit items are picked up." },
    { name: "The Galleria & Uptown", blurb: "Houston's biggest shopping district — malls and hotels keep their own lost & found, so ask the front desk before anything else." },
    { name: "Texas Medical Center & Museum District", blurb: "One of the busiest medical complexes in the world, plus Rice University and the museums. Campus and hospital desks handle their own found items." },
    { name: "Montrose & The Heights", blurb: "Walkable, restaurant- and bar-heavy neighborhoods where items are most often left at venues — contact the relevant venue for its current process." },
    { name: "Energy Corridor & the west side", blurb: "Sprawling office parks and Park & Ride commuter routes. Items lost on a Park & Ride bus go through METRO Lost & Found." },
  ],
  socialHeading: "Houston community channels",
  socialSubtitle:
    "Local social channels provide another way to share a report. These are examples of Houston community channels:",
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
    { q: "My pet is missing in Houston — where do I begin?", a: "Search and report on Petco Love Lost, and check BARC (the city shelter) at 3200 Carr St or call 832-395-9084. The Houston SPCA and Houston Humane Society can help too. If your pet is microchipped, contact the chip company as well." },
    { q: "Are you the city's official lost and found?", a: "No. ReportLost.org is an independent service that provides information about official channels and offers optional local outreach with the team-assisted service. The official offices are the ones that store and release recovered property." },
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
  finalCtaHeading: "Create a lost-item report",
  finalCtaBody: "Review the available report options and official channels for Houston.",
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
  h1: "Lost and found information for Phoenix",
  heroSubtitle:
    "Use this guide to identify lost-and-found contacts for the <strong>Phoenix Police property bureau</strong>, <strong>Valley Metro, Sky Harbor and rideshare providers</strong>, venues and local services. ReportLost is independent; available options are shown before a report is submitted.",
  imageAltFallback: "View of Phoenix",
  stepsHeading: "How to report a lost item in Phoenix",
  steps: [
    { icon: "📝", iconBg: "bg-blue-100", title: "1. Record the loss", body: "Note the item’s identifying details, the date and the place where it may have been left." },
    { icon: "📡", iconBg: "bg-blue-100", title: "2. Check the relevant contact", body: "Use the official agency or venue links below. ReportLost’s available options and included services are shown on the report form." },
    { icon: "🤝", iconBg: "bg-green-100", title: "3. Review replies and potential matches", body: "Paid search options include email notifications for reviewed potential public-web matches. Finder replies use the protected relay address." },
  ],
  intro: [
    `Phoenix has separate lost-and-found processes for Valley Metro, Sky Harbor, police, rideshare providers, venues and animal services. The guide below lists contact details and filing instructions for common situations.`,
    `On Valley Metro, at PHX, in a rideshare or at a Scottsdale-adjacent resort, Sky Harbor, for instance, publishes its own item-holding information; check its current lost-and-found instructions.`,
  ],
  guideHeading: "Phoenix lost-and-found contacts by location",
  guideSubtitle:
    "Phoenix's offices cover different locations. Use the guide below to identify the office that handles the place where the item may have been left.",
  cards: [
    {
      icon: "🚈", iconBg: "bg-blue-100", title: "Valley Metro rail or bus",
      body: `Items are handled by City of Phoenix Public Transit. Call (602) 534-5053 to confirm before you go — most are at Central Station (302 N. 1st Ave), though some routes are held in Tempe.`,
      links: [{ label: "Valley Metro Lost & Found →", href: "https://www.valleymetro.org/lost-found" }],
    },
    {
      icon: "🚕", iconBg: "bg-yellow-100", title: "Uber, Lyft or taxi",
      body: `Report the item and message your driver from the Uber or Lyft app. For a taxi, call the company with your pickup time and route. We help you gather the details that help the company identify the trip.`,
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
  midCtaHeading: "Choose a report option",
  midCtaBody: "Create a free public listing, add six months of automatic web monitoring for $12, or choose team-assisted search for $25 and 12 months of monitoring.",
  areasHeading: "Which part of Phoenix did you lose it in?",
  areasSubtitle:
    "The Phoenix area is geographically large. Neighborhood details below can help identify a nearby transit office, police unit or venue.",
  areas: [
    { name: "Downtown & the light rail corridor", blurb: "Sports arenas, ASU Downtown and the Valley Metro Rail line along Central Ave. Central Station is where many recovered transit items end up." },
    { name: "Midtown & Uptown", blurb: "The museums, Park Central and the Camelback corridor. Venues and offices along the rail line keep their own lost & found." },
    { name: "Camelback, Arcadia & Biltmore", blurb: "Resorts, golf and upscale shopping — hotels and clubs almost always log found items at the front desk, so start there." },
    { name: "Sky Harbor & the airport area", blurb: "PHX, the Sky Train and the rental-car center. Items in the terminals or on the Sky Train go through Sky Harbor Lost & Found." },
    { name: "North Phoenix, Deer Valley & Ahwatukee", blurb: "Spread-out residential areas and trailheads. Items lost on a hike are rarely handed in — a public alert is your best shot." },
  ],
  socialHeading: "Phoenix community channels",
  socialSubtitle:
    "Local social channels provide another way to share a report. These are examples of Phoenix-area community channels:",
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
    { q: "My pet is lost in the Phoenix area — what should I do?", a: "Report and search on Petco Love Lost, and check Maricopa County Animal Care & Control (602-506-7387; West shelter at 2500 S. 27th Ave). Note the county doesn't impound stray cats, but you can still list them online. The Arizona Humane Society can help, and keep your pet’s microchip registration details current." },
    { q: "Is ReportLost.org an official government service?", a: "No. We're an independent service that provides information about official channels and offers optional local outreach with the team-assisted service. The official offices are the ones that store and release recovered property." },
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
  finalCtaHeading: "Create a lost-item report",
  finalCtaBody: "Review the available report options and official channels for Phoenix.",
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
