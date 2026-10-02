import type { CategorySpec } from "./index";

export const petsSpec: CategorySpec = {
  label: "Pets",
  title: "Lost & Found Pets",

  intro: [
    "View recent reports of lost and found pets, including dogs, cats, and other domestic animals.",
    "If your pet is missing, sharing accurate details can help others recognize and report sightings.",
  ],

  whyReport: [
    "Centralize key identifying information in one place",
    "Make reports visible to people who may encounter your pet",
    "Create a dated reference for your records",
  ],

  howToDescribe: [
    "Animal type and breed",
    "Color, size, and markings",
    "Collar, tags, or microchip information (no numbers)",
    "Last known location and time",
    "Behavioral traits that could help recognition",
  ],

  faq: [
    {
      q: "Should I report a lost pet immediately?",
      a: "A report creates a searchable listing. You can also contact local shelters, animal control and veterinary clinics directly.",
    },
    {
      q: "Can I update my pet report later?",
      a: "Yes. Additional details or sightings can be added if available.",
    },
    {
      q: "What if someone finds my pet?",
      a: "Clear descriptions help confirm ownership before reunification.",
    },
  ],

  ctaLabel: "Report a lost pet",
};
