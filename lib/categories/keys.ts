export type CategorySpec = {
  label: string;
  title: string;
  intro: string[];
  whyReport: string[];
  howToDescribe: string[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
};

export const keysSpec: CategorySpec = {
  label: "Keys",
  title: "Keys Lost & Found",

  intro: [
    "Explore recent reports of lost and found keys, including house keys, car keys, and key sets.",
    "If you misplaced your keys, filing a report allows important details to be recorded and checked against newly found items.",
  ],

  whyReport: [
    "Document where and when the keys were likely lost",
    "Make the description searchable if someone reports finding a matching set",
    "Keep a clear record in case the keys are recovered later",
  ],

  howToDescribe: [
    "Type of keys (house, car, office, storage, etc.)",
    "Number of keys on the ring",
    "Keychain or accessory attached",
    "Approximate location and date of loss",
    "Any distinctive marks, tags, or colors",
  ],

  faq: [
    {
      q: "Should I report lost keys even if I already replaced them?",
      a: "Yes. Reporting lost keys can still help if they are found later or returned to a public location.",
    },
    {
      q: "Can I report keys lost in a public place?",
      a: "Yes. Many keys are found in public areas such as streets, transit stations, or buildings and are later reported.",
    },
    {
      q: "Is it safe to describe my keys?",
      a: "Avoid sharing sensitive details like addresses. Focus on physical characteristics and accessories instead.",
    },
  ],

  ctaLabel: "Report a lost key set",
};
