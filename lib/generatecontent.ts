type CityData = {
  city: string;
  malls: any[];
  parks: any[];
  tourism_sites: any[];
};

function extractNames(input: any[], max: number): string[] {
  return Array.isArray(input)
    ? input.filter(h => typeof h.name === 'string').map(h => h.name).slice(0, max)
    : [];
}

const intros = [
  "Have you recently lost something in {city}?",
  "Looking to report a lost item in {city}?",
  "Lost something in {city}? Don’t worry — here’s what you can do.",
  "Report your lost property in {city} easily and securely.",
  "An item went missing in {city}? Start your recovery process here.",
  "Misplaced a personal belonging in {city}?",
  "Need help finding a lost item in {city}?",
  "Recently forgot something in {city}?",
  "Lost something in {city}? Here are the steps to take.",
  "Have you misplaced an item while in {city}?",
  "If you have lost or found an item in {city}, this page will guide you through the appropriate steps.",
  "Whether you have misplaced a personal item or found someone else’s belongings in {city}, you can report it here.",
  "This page provides helpful information for those who have lost or discovered an item in {city}.",
  "Losing or finding an item in {city} can happen quickly — here's how to handle the situation.",
  "If you recently lost something in {city}, or came across an item that may belong to someone else, you’re in the right place.",
  "Every day in {city}, personal belongings are lost or found. Here's how to act responsibly.",
  "This guide explains how to report a lost item or declare a found object within {city}.",
  "You may use this page to report a missing item, or to inform us about an item you’ve found in {city}.",
  "Many items go missing or are recovered in public spaces across {city}. This page helps you take the right action.",
  "If you need to declare the loss of an object or have found something in {city}, we are here to help.",
  "Whether you are searching for a lost item or reporting one found in {city}, we’ve outlined everything you need to know.",
  "In a city like {city}, it is not uncommon to misplace or come across a lost item — here is what to do.",
  "This page outlines the recommended procedure for reporting lost and found items in {city}.",
  "If you have come across an item that appears to be lost, or are looking for something you misplaced in {city}, this service is for you.",
  "Residents and visitors of {city} can use this service to report lost property or declare an object found.",
  "This resource is intended for anyone who has lost or found personal property in {city}.",
  "Found an item in {city}? Or lost something important? Read on to find out how to report it properly.",
  "If you believe you’ve lost something in {city} — or if you’ve found something — please follow the instructions below.",
  "This page helps individuals who are trying to recover a lost item or return a found object in {city}.",
  "Reporting a lost or found item in {city} is a simple process — here’s how it works.",
  "If you have lost an item in {city}, please follow the steps outlined below.",
  "To report a lost or found item in the city of {city}, please refer to the information below.",
  "The following guidelines are provided for individuals who have lost an item in {city}.",
  "Residents and visitors of {city} may report lost items using the procedure described here.",
  "If you believe you have lost an item in {city}, you are encouraged to file a report promptly.",
  "For assistance with a lost item in {city}, please consult the instructions below.",
  "This page is intended for individuals seeking to report a lost or found item in {city}.",
  "If an item has gone missing in {city}, official reporting options are available here."
];

const titleTemplates = [
  "Lost and Found in {city}",
  "Lost an Item in {city}?",
  "How to Report a Lost or Found Item in {city}",
  "Submit a Lost or Found Report in {city}",
  "{city} Lost Item Guide",
  "What to Do If You Lost Something in {city}",
  "Found Something in {city}? Here's How to Report It",
  "Declare a Lost Item – {city} Residents and Visitors",
  "{city}: Report a lost item",
  "Think you lost something in {city}?",
  "Lost or found item in {city}: What should you do?",
    "Lost and Found in {city}",
  "Lost an Item in {city}?",
  "How to Report a Lost or Found Item in {city}",
  "Submit a Lost or Found Report in {city}",
  "{city} Lost Item Guide",
  "What to Do If You Lost Something in {city}",
  "Found Something in {city}? Here's How to Report It",
  "Report Missing or Recovered Items in {city}",
  "Looking for a Lost Item in {city}?",
  "Steps to Take for Lost Items in {city}",
  "{city}: How to Handle Lost and Found",
  "Return or Recover Items in {city}",
  "Lost Property Services in {city}",
  "Have You Lost Something in {city}?",
  "Declare a Lost Item – {city} Residents and Visitors",
  "Lost Items in {city}: Official Steps",
  "{city} Object Lost or Found? Start Here",
  "Item Left Behind in {city}? Report It",
  "Found a Lost Object in {city}? Learn What to Do",
  "Declare or Recover Property in {city}",
  "Did you lose an item in {city}?",
  "Did you misplace something in {city}?",
  "Lost item in {city} – What to do?",
  "Report a lost or found item in {city}",
  "{city}: Report a lost item",
  "{city}: Lost and Found",
  "Lost or found item in {city}: What should you do?",
  "Think you lost something in {city}?",
  "Recently forgot something in {city}?"
];

const phrase1Options = [
  "Some of these locations may forward lost items to local police or internal services.",
  "Items found in these spots are often handed over to law enforcement or venue staff.",
  "It’s common for lost belongings to be transferred to the police or internal lost & found.",
  "These venues sometimes pass recovered items to official channels.",
  "Police stations or in-house services may receive items lost at these places.",
  "Often, retrieved items end up with the police or are stored locally by the venue.",
  "Lost objects might be collected by on-site staff or redirected to authorities.",
  "Certain places have internal procedures to manage and forward lost items.",
  "These areas may cooperate with police to centralize found items.",
  "Recovered belongings may be sent to local authorities or managed internally.",
  "There’s a chance items are forwarded to official lost property services.",
  "In some cases, these spots collaborate with the police for object recovery.",
  "Venue staff might log and send items to the appropriate services.",
  "It’s possible that lost items are turned in to municipal or venue services.",
  "Authorities or staff at these places may temporarily hold found objects."
];

const phrase2Options = [
 "If you have a specific suspicion, contacting certain places directly may help.",
"You can still reach out to a specific location if you recall where you may have lost the item.",
  "In some cases, it may be worth calling individual locations you recently visited.",
  "If you suspect where the loss occurred, a direct inquiry could prove useful.",
  "Feel free to contact a particular venue if you have a clear idea of where you were.",
  "For targeted cases, individual follow-up with venues can be considered.",
  "You may still choose to contact locations on your own if you feel confident about the place.",
  "If one spot comes to mind, checking with them can’t hurt.",
  "A quick call to a place you suspect might yield helpful info.",
  "If you have a lead, following it directly may complement our search.",
  "You’re always free to double-check with a specific location if you prefer.",
  "Should you remember a likely location, it might be worth contacting them.",
  "If something rings a bell, you could reach out to that venue as a precaution.",
  "Acting on a hunch by calling a place can sometimes do the trick.",
  "Individual contact may still be useful when you have a strong guess."
];

const phrase3Options = [
  "But rest assured — we handle these steps on your behalf.",
"But no worries: our team takes care of these efforts for you.",
  "But don't stress — we’re already reaching out where it matters.",
  "But you can relax — we’re covering these checks for you.",
  "But there's no need to do it all alone — we’re handling this.",
  "But we're already in action — managing outreach and coordination.",
  "But we’ve got you covered: these steps are part of our process.",
  "But trust us — this kind of follow-up is included in your report.",
  "But our system already covers this part of the recovery process.",
  "But we make sure these efforts are taken care of on your behalf.",
  "But part of our service is doing this so you don’t have to.",
  "But we take on this responsibility so you can focus on other things.",
  "But you're not alone — we’re actively following up for you.",
  "But this is where we step in: we’re already checking those places.",
  "But let us worry about that — we’ve already started these steps."
];

const phrase4Options = [
  "Our system matches similar reports automatically, while a real person tracks your case locally.",
"We combine automation and human review to ensure no match goes unnoticed.",
  "Our AI scans for relevant signals, and a human assistant refines the search nearby.",
  "Smart algorithms flag potential matches, and our team takes it further on the ground.",
  "You benefit from both AI-driven detection and manual investigation in your area.",
  "We blend machine learning with real human oversight for deeper recovery.",
  "Algorithms check incoming data, and a person validates and expands your search.",
  "Your case is analyzed by our software and followed manually by someone on our team.",
  "We run continuous matching and real-time human monitoring of your file.",
  "The search is automated and human-assisted to maximize local reach.",
  "You get advanced detection and personalized tracking from our staff.",
  "Behind the scenes, an algorithm watches while a real agent works for you.",
  "We don’t just rely on software — every case has a human behind it too.",
  "Your report triggers a smart system and a dedicated person to help recover your item.",
  "Machine support plus local human follow-up: it’s how we maximize your chances."
];

const phrase5Options = [
   "💡 Reporting your loss here gives you dual tracking: human and automated.",
 "💡 Your declaration activates both smart detection and real human support.",
  "💡 With us, you gain both algorithmic precision and personal attention.",
  "💡 A two-fold system — tech and people — works to recover your item.",
  "💡 Combining human insight with data matching boosts recovery chances.",
  "💡 Submit your report and benefit from an integrated recovery engine.",
  "💡 This hybrid process gives you maximum coverage: digital + human.",
  "💡 The combined effort of software and people increases your odds.",
  "💡 You’re backed by a smart system and a caring professional.",
  "💡 Each loss triggers both search automation and personal support.",
  "💡 Our layered process improves the likelihood of return significantly.",
  "💡 You benefit from human follow-up and algorithmic vigilance.",
  "💡 One click starts both local help and digital tracking.",
  "💡 Our approach links algorithms with real-time human review.",
  "💡 Human-AI synergy: your best ally to get your lost item back."
];

function randomFromArray(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function generateContent(cityData: CityData): { text: string, title: string } {
  const { city, malls, parks, tourism_sites } = cityData;

  const mallExamples = extractNames(malls, 2);
  const parkExamples = extractNames(parks, 2);
  const tourismExamples = extractNames(tourism_sites, 3);

  const mallText = mallExamples.length ? ` (e.g., ${mallExamples.join(', ')})` : '';
  const parkText = parkExamples.length ? ` (e.g., ${parkExamples.join(', ')})` : '';
  const tourismText = tourismExamples.length
    ? `In ${city}, the most visited tourist places include: ${tourismExamples.join(', ')}.`
    : '';

  const intro2Variants = [
    `Think about the places you visited recently: hotels, restaurants, malls${mallText}, parks${parkText}, or tourist attractions. ${tourismText}`,
    `You might have left something behind at a mall${mallText}, a park${parkText}, or a tourist site. ${tourismText}`,
    `Lost items are often found in busy spots like malls${mallText}, public parks${parkText}, or city landmarks. ${tourismText}`,
    // ...
  ];

  const intro = randomFromArray(intros).replace(/{city}/g, city);
  const intro2 = randomFromArray(intro2Variants);
  const phrase1 = randomFromArray(phrase1Options);
  const phrase2 = randomFromArray(phrase2Options);
  const phrase3 = randomFromArray(phrase3Options);
  const phrase4 = randomFromArray(phrase4Options);
  const phrase5 = randomFromArray(phrase5Options);
  const title = randomFromArray(titleTemplates).replace(/{city}/g, city);

  return {
    text: [intro, '', intro2, '', phrase1, phrase2, '', phrase3, '', phrase4, '', phrase5].join('\n\n'),
    title,
  };
}



