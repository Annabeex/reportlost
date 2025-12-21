import type { CategorySpec } from "./index";

export const documentsSpec: CategorySpec = {
  label: "Documents",
  title: "Documents Lost & Found",

  intro: [
    "Find recent reports related to lost and found documents such as IDs, passports, driver’s licenses, and official papers.",
    "When important documents go missing, recording accurate details can help speed up identification if they are later recovered.",
  ],

  whyReport: [
    "Create a clear record of the document type and loss circumstances",
    "Help match found documents with owners without exposing sensitive information",
    "Keep a reference point when contacting authorities or lost-and-found services",
  ],

  howToDescribe: [
    "Document type (ID, passport, license, certificate, etc.)",
    "Issuing country or authority",
    "General appearance (color, format, cover type)",
    "Approximate place and date of loss",
    "Any visible but non-sensitive distinguishing features",
  ],

  faq: [
    {
      q: "Is it safe to report a lost document online?",
      a: "Yes, as long as you avoid sharing sensitive numbers. Focus on physical characteristics instead.",
    },
    {
      q: "Should I still report a document if I already replaced it?",
      a: "Yes. Found documents are often turned in later and can still be returned or properly disposed of.",
    },
    {
      q: "Can someone else claim my document?",
      a: "Claims usually require verification, which helps prevent misuse.",
    },
  ],

  ctaLabel: "Report a lost document",
};
