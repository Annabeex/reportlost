import type { CategorySpec } from "./index";

export const bagSuitcaseSpec: CategorySpec = {
  label: "Bags & Suitcases",
  title: "Bags & Suitcases Lost & Found",

  intro: [
    "Browse recent reports of lost and found bags and suitcases, including backpacks, handbags, carry-on bags, and checked luggage.",
    "If you lost a bag or suitcase, submitting a report helps record identifying details and supports matching if a similar item is reported found.",
  ],

  whyReport: [
    "Document the bag type, size, color, and brand in one place",
    "Make your report easier to match with bags or suitcases that are later found",
    "Create a clear reference when checking with airlines, stations, hotels, or lost-and-found desks",
  ],

  howToDescribe: [
    "Bag type (backpack, handbag, tote, duffel, suitcase, carry-on, etc.)",
    "Color, material, and approximate size",
    "Brand or logo, if visible",
    "Contents inside the bag (general description, no sensitive details)",
    "Approximate location and date of loss",
  ],

  faq: [
    {
      q: "Should I report a bag lost during travel?",
      a: "Yes. Bags are frequently reported found after being left on trains, buses, planes, or in terminals and hotels.",
    },
    {
      q: "What details help most for identifying a bag or suitcase?",
      a: "Color, size, brand, unique tags, stickers, or damage are often the easiest identifiers.",
    },
    {
      q: "Can I report a bag even if I don’t remember everything inside?",
      a: "Yes. A general description of the bag itself is usually sufficient to start a match.",
    },
  ],

  ctaLabel: "Report a lost bag or suitcase",
};
