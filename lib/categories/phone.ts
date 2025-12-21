export type CategorySpec = {
  label: string;
  title: string;
  intro: string[];
  whyReport: string[];
  howToDescribe: string[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
};

export const phoneSpec: CategorySpec = {
  label: "Phone",
  title: "Phone Lost & Found",

  intro: [
    "Browse recent reports of lost and found phones, including iPhone and Android devices.",
    "If you lost your phone, submitting a report helps document identifying details and supports matching if a similar device is reported found.",
  ],

  whyReport: [
    "Capture key identifiers (brand, model, color, case) in one place",
    "Make the report easier to compare against newly found phones",
    "Create a clear record you can reference when contacting venues or support services",
  ],

  howToDescribe: [
    "Brand and model (iPhone, Samsung Galaxy, Google Pixel, etc.)",
    "Color and storage size (if relevant)",
    "Case/cover details (material, color, pattern)",
    "Distinctive marks (stickers, cracks, lockscreen wallpaper description)",
    "Approximate location and date of loss",
  ],

  faq: [
    {
      q: "Should I include my IMEI or serial number in the report?",
      a: "Avoid posting sensitive identifiers publicly. You can note that you have them available for verification if needed.",
    },
    {
      q: "What should I do right away if I lost my phone?",
      a: "Enable lost mode or tracking if available, secure your accounts, and submit a detailed report with clear identifying features.",
    },
    {
      q: "Can I still report a phone if it’s turned off?",
      a: "Yes. A detailed description can still help if someone finds it and reports it later.",
    },
  ],

  ctaLabel: "Report a lost phone",
};
