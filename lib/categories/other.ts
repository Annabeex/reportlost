import type { CategorySpec } from "./index";

export const otherSpec: CategorySpec = {
  label: "Other Items",
  title: "Other Lost & Found Items",

  intro: [
    "Browse reports for lost and found items that don’t fit standard categories.",
    "If you misplaced an unusual or miscellaneous item, providing a clear description can still make matching possible.",
  ],

  whyReport: [
    "Capture essential identifying details even for uncommon items",
    "Make the report searchable alongside other found objects",
    "Keep a reference you can use when checking with lost-and-found locations",
  ],

  howToDescribe: [
    "What the item is and how it’s typically used",
    "Size, shape, and color",
    "Materials or components",
    "Where and when it was last seen",
    "Anything that makes it recognizable",
  ],

  faq: [
    {
      q: "What qualifies as an ‘other’ item?",
      a: "Any item that doesn’t clearly fit a specific category can be reported here.",
    },
    {
      q: "Can uncommon items still be matched?",
      a: "Yes. Detailed descriptions often make recognition possible.",
    },
    {
      q: "Should I choose ‘other’ if I’m unsure?",
      a: "Yes. It’s better to report the item than not report it at all.",
    },
  ],

  ctaLabel: "Report a lost item",
};
