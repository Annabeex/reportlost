export type CategorySpec = {
  label: string;
  title: string;
  intro: string[];
  whyReport: string[];
  howToDescribe: string[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
};

export const jewelrySpec: CategorySpec = {
  label: "Jewelry",
  title: "Jewelry Lost & Found",

  intro: [
    "View recent reports of lost and found jewelry, including rings, necklaces, bracelets, earrings, and watches.",
    "If you lost a piece of jewelry, submitting a report helps capture identifying details and makes it easier to compare against newly found items.",
  ],

  whyReport: [
    "Record key identifiers (type, metal, stones, engravings) in one place",
    "Increase the chances of a match if a similar item is reported found",
    "Create a dated reference you can use when following up with venues or lost-and-found desks",
  ],

  howToDescribe: [
    "Type (ring, necklace, bracelet, earrings, watch, etc.)",
    "Metal color/material (gold, silver, platinum, stainless steel, etc.)",
    "Stones or features (diamond, pearls, charm, pendant shape, brand)",
    "Any engraving, initials, or distinctive marks",
    "Approximate location and date of loss",
  ],

  faq: [
    {
      q: "Should I include serial numbers or appraisals in my report?",
      a: "You can mention that documentation exists, but avoid posting sensitive numbers. Focus on physical identifiers and unique details.",
    },
    {
      q: "What details help most for matching jewelry?",
      a: "Metal type, stone color/cut, brand hallmarks, and engravings are often the most reliable identifiers.",
    },
    {
      q: "Can I report jewelry lost a while ago?",
      a: "Yes. Jewelry is sometimes found later during cleaning or renovations, so older reports can still be useful.",
    },
  ],

  ctaLabel: "Report lost jewelry",
};
