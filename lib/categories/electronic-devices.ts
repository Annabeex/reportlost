import type { CategorySpec } from "./index";

export const electronicDevicesSpec: CategorySpec = {
  label: "Electronic Devices",
  title: "Electronic Devices Lost & Found",

  intro: [
    "See recent reports of lost and found electronic devices such as tablets, laptops, cameras, game consoles, and smartwatches.",
    "If you lost an electronic device, filing a report helps capture identifying details and supports faster matching when a similar item is reported found.",
  ],

  whyReport: [
    "Collect key identifiers in one place (brand, model, color, case, accessories)",
    "Make your report easier to compare against newly found devices",
    "Create a clear record you can reference when contacting venues or support services",
  ],

  howToDescribe: [
    "Device type (tablet, laptop, camera, headphones, smartwatch, etc.)",
    "Brand and model (and storage size if relevant)",
    "Color and any case/cover details",
    "Accessories included (charger, earbuds, bag, protective sleeve)",
    "Approximate location and date of loss",
  ],

  faq: [
    {
      q: "Should I include serial numbers in my report?",
      a: "Avoid posting sensitive identifiers publicly. You can note that you have them available for verification if needed.",
    },
    {
      q: "What details help most for matching a device?",
      a: "Brand/model, color, case type, and any unique marks or stickers are usually the most helpful for identification.",
    },
    {
      q: "What should I do right away if I lost a device?",
      a: "If possible, enable lost mode or tracking, secure your accounts, and submit a detailed report with clear identifying features.",
    },
  ],

  ctaLabel: "Report a lost electronic device",

  relatedLinks: [
    {
      label: "Phone Lost & Found",
      href: "/lost-and-found/category/phone",
      note: "Looking for phones? Visit our dedicated page for lost and found phones.",
    },
  ],
};
