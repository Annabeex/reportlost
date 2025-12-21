import type { CategorySpec } from "./index";

export const clothesSpec: CategorySpec = {
  label: "Clothes",
  title: "Clothes Lost & Found",

  intro: [
    "Browse reports of lost and found clothing items, including jackets, coats, shoes, hats, and accessories.",
    "If you left clothing behind in a public place or venue, describing it accurately can help reconnect it with you.",
  ],

  whyReport: [
    "Log specific details such as size, color, and type of clothing",
    "Increase the chances of recognition if a similar item is reported found",
    "Create a point of reference when checking with venues or organizers",
  ],

  howToDescribe: [
    "Clothing type (jacket, sweater, shoes, hat, scarf, etc.)",
    "Color, size, and fabric",
    "Brand or label, if known",
    "Where the item may have been left",
    "Any distinctive features (logos, patterns, damage)",
  ],

  faq: [
    {
      q: "Is it worth reporting everyday clothing?",
      a: "Yes. Clothing is frequently recovered, especially when it has distinctive features.",
    },
    {
      q: "Can I report multiple clothing items at once?",
      a: "It’s best to submit separate reports if the items are very different.",
    },
    {
      q: "Do clothing items get found often?",
      a: "Yes. Many are turned in at venues, events, and transportation hubs.",
    },
  ],

  ctaLabel: "Report lost clothing",
};
