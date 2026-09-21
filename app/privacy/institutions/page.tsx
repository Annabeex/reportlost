// app/privacy/institutions/page.tsx — notice de confidentialité du SERVICE AUX
// ÉTABLISSEMENTS (portail /campus et /org, pages publiques /campus/<slug> et
// /at/<slug>). Volontairement séparée de /privacy, qui décrit le site grand
// public et n'est pas modifiée.
//
// ⚠️ Chaque durée et chaque affirmation ci-dessous décrit ce que le code fait
// réellement (app/api/org-maintenance, lib/orgPhotos.ts, app/api/org/analyze-item,
// components/orgPublic). Si l'un change, cette page change avec lui.
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";

export const metadata: Metadata = {
  title: "Privacy notice for institutional lost and found pages | ReportLost",
  description:
    "What is collected on the lost and found pages ReportLost operates for universities and organizations, who sees it, and how long it is kept.",
  alternates: { canonical: "https://reportlost.org/privacy/institutions" },
};

const content = `
_Last reviewed: September 21, 2026_

This notice covers the lost and found pages and staff tools that ReportLost.org operates for universities, colleges, schools and other organizations ("the institution"). It does not replace the [general ReportLost privacy policy](/privacy), which covers the public ReportLost website.

### 1. Who is responsible for what

The institution decides what is recorded in its lost and found inventory, who on its staff has access, and how long found items are held. ReportLost.org provides the software and hosts the data on the institution's behalf, and uses it only to run this service.

ReportLost.org is an independent service operated from the European Union.

### 2. What is collected, and from whom

**If you report a lost item to an institution:** what you lost, the date and place, your description, your name and email address, and your phone number if you give one.

**If you hand in or report a found item:** what the item is, the date and place, an optional photo and description, your email address, and your name if you give one.

**If you claim an item:** your name, email address, phone number if you give one, and the description you write to show that the item is yours.

**If you are a staff member of the institution:** your work email address, your role, and a record of the actions you take on items (logged, returned, transferred), kept as the institution's audit trail. Passwords are stored in hashed form by our authentication provider and are never visible to us.

The service does not connect to the institution's student information system, ID card system or any other internal system. It only holds what people type into its forms.

### 3. What is public, and what is not

A public lost and found page shows, for each item, a generic category (for example "Keys" or "Backpack"), the date, and the place where it was found. Nothing else.

The detailed description of an item, its photo, its storage location, and every name, email address and phone number are never shown publicly. They are visible only to the staff of the institution concerned.

Photos are kept in private storage. They are displayed to the institution's staff through links that expire after a few hours.

### 4. Who sees your data

- **The institution's lost and found staff** see the reports, claims and hand-in forms addressed to their institution, including the contact details given in them. Staff of one institution cannot see another institution's data.
- **Another member of the public**, in one case only: if you found an item and kept it, the institution may give your email address to a person whose description of the item it has checked, so that you can arrange the handover. The form says so before you submit it.
- **ReportLost.org** may access the data to operate, secure and support the service.

We do not sell personal data, and we do not use it for advertising.

### 5. Automated reading of photos

When a staff member uses the "automatic scan" option, the photo of the item is sent to an AI model operated by Anthropic, which returns a suggested description. The staff member reviews and corrects it before saving. Photos sent through the public hand-in form are not processed this way. No decision about a person is made automatically: possible matches between a lost report and a found item are suggestions, and a staff member decides.

### 6. How long data is kept

These periods are applied automatically every day.

- **Photo of an item that has left the office** (returned, transferred, donated, discarded): 30 days after it left.
- **Record of an item that has left the office**: 12 months after it left.
- **Item still held by the office**: as long as the institution holds it.
- **Hand-in form for an item the office never confirmed receiving**: 6 months.
- **Finder's contact details, once the office has confirmed it received the item**: 90 days.
- **Lost item report**: 12 months.
- **Unused staff invitation**: 30 days after it expires.

An institution can delete a hand-in form or close a report earlier.

### 7. Service providers

The service relies on the following providers, each acting on our instructions: Supabase (database, authentication, file storage), Vercel (hosting), Zoho (email delivery), and Anthropic (automated reading of photos, only as described in section 5).

### 8. Security

Access to an institution's data requires a staff account attached to that institution, and every request is checked against that membership on the server. Data is encrypted in transit. Photos and records are not reachable with the public credentials used by the website. No system is free of risk; if an incident affects an institution's data, we inform that institution without undue delay.

### 9. Your choices

You can ask for a copy of the data you submitted, or for its correction or deletion, by writing to the institution's lost and found office or to us. We act on requests addressed to us in coordination with the institution concerned.

### 10. Children

These pages are not directed at children under 13, and we do not knowingly collect personal data from them.

### 11. Analytics

Pages of the ReportLost website count visits anonymously (page opened, type of traffic source). No personal data is attached to these counts, and the staff tools set no advertising or tracking cookies. A session stored in the browser keeps staff members signed in.

### 12. Contact

**ReportLost.org**
Email: support@reportlost.org
`;

export default function InstitutionsPrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-sm text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Privacy notice for institutional lost and found pages</h1>
      <div className="prose prose-sm md:prose-base">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </main>
  );
}
