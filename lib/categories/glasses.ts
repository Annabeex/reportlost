export type CategorySpec = {
  label: string;
  title: string;
  intro: string[];
  whyReport: string[];
  howToDescribe: string[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
};

export const glassesSpec: CategorySpec = {
  label: "Glasses",
  title: "Glasses Lost & Found",

  intro: [
    "Browse recent reports of lost and found glasses, including prescription glasses and sunglasses.",
    "If you lost your glasses, submitting a report helps document key details and makes it easier to identify a matching item if one is found.",
  ],

  whyReport: [
    "Record essential details such as frame type, color, and lens characteristics",
    "Make your report searchable if similar glasses are reported found",
    "Create a clear reference you can use when checking with venues or lost-and-found desks",
  ],

  howToDescribe: [
    "Type (prescription glasses or sunglasses)",
    "Frame color, material, and shape",
    "Lens details (clear, tinted, polarized, prescription)",
    "Case description, if applicable",
    "Approximate location and date of loss",
  ],

  faq: [
    {
      q: "Should I report glasses even if they are not expensive?",
      a: "Yes. Glasses are often returned regardless of value, especially when they can be clearly identified.",
    },
    {
      q: "What details help most when identifying glasses?",
      a: "Frame color, lens type, brand, and any visible wear or distinctive marks are especially useful.",
    },
    {
      q: "Can I report glasses lost in public transportation?",
      a: "Yes. Glasses are frequently found on buses, trains, and in stations and can be reported after being turned in.",
    },
  ],

  ctaLabel: "Report lost glasses",
};
