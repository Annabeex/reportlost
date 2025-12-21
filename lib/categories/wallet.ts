export type CategorySpec = {
  label: string;
  title: string;
  intro: string[];
  whyReport: string[];
  howToDescribe: string[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
};

export const walletSpec: CategorySpec = {
  label: "Wallet",
  title: "Wallet Lost & Found",

  intro: [
    "Browse recent reports of lost and found wallets.",
    "If you lost your wallet, submitting a report helps centralize key details and increase visibility.",
  ],

  whyReport: [
    "Centralize essential details (cards, ID, location, date)",
    "Make your report searchable if a matching item is found",
    "Create a time-stamped record of the loss",
  ],

  howToDescribe: [
    "Type (bi-fold, card holder, clutch)",
    "Color and material",
    "Cards or documents inside (no numbers needed)",
    "Approximate location and date",
    "Any unique marks or damage",
  ],

  faq: [
    {
      q: "What should I do immediately after losing a wallet?",
      a: "Cancel cards, report the loss, and file a detailed report to document the incident.",
    },
    {
      q: "Can I report a wallet lost days ago?",
      a: "Yes. Reports remain useful even after several days, especially if the item is found later.",
    },
    {
      q: "Is reporting a wallet free?",
      a: "You can submit a report for free and choose optional search support.",
    },
  ],

  ctaLabel: "Report a lost wallet",
};