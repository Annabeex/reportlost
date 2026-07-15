'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const privacyContent = `
## Privacy Policy – ReportLost.org

_Last updated: July 15, 2026_

### 1. Who We Are

ReportLost.org is an independent platform operated by an independent operator based in the European Union. We are committed to protecting your privacy and handling personal data responsibly.

---

### 2. Data We Collect

We collect only the information strictly necessary to operate the service:

- Contact details (such as name and email address),
- Information related to lost or found items (description, location, date),
- Optional photos or supporting information you choose to provide,
- Optional contact and identification details (phone number, postal address, date of birth). The date of birth is requested only because some police departments require it when we file a lost property report on your behalf,
- An optional private verification detail about your item, used solely by our team to verify ownership claims. It is **never published**.

All data is provided voluntarily by users.

**What appears publicly:** a published report shows the item description, category, city and date of loss. Your name, email address, phone number, postal address, date of birth and private verification detail are never published. Finders reach you through a protected relay email address, so your personal email is not exposed.

---

### 3. How We Use Your Data

Your data is used solely to:

- Create and display reports on ReportLost.org,
- Facilitate communication related to lost and found items,
- Provide optional assistance services when requested,
- Respond to user inquiries and support requests.

We **do not sell, rent, or monetize** personal data.

---

### 4. Data Sharing

We only share personal data when necessary and appropriate:

- With third parties involved in lost-and-found efforts: as part of paid assistance, we may share your contact details with public organizations (such as a police department, city services or animal control) when filing or following up on your report. Private establishments (hotels, venues, businesses) are given a protected relay address, not your personal email,
- With technical service providers required to operate the platform.

Our service providers (subprocessors) are:

- **Stripe** (payments): payment processing is handled exclusively by Stripe, a PCI-DSS compliant processor. ReportLost.org does **not store** credit card or payment details,
- **Supabase** (database and file storage),
- **Vercel** (website hosting),
- **Zoho Mail** and **Mailgun** (sending and receiving email),
- **Anthropic** (AI assistance used by our team to process report content; this data is not used to train AI models),
- **Google** (AI generation of city illustration images; no personal data is involved).

Automated match searches use your item's description, city and date of loss on public web sources. They never include your name or contact details.

---

### 5. Legal Basis and User Rights

As an operator based in the European Union, we process personal data in accordance with the **General Data Protection Regulation (GDPR)**.

Users have the right to:
- Request access to their personal data,
- Request correction or deletion of their data,
- Object to or restrict certain processing activities.

We also apply similar transparency and control principles to users located outside the European Union, including users in the United States.

**California residents (CCPA/CPRA):** you have the right to know what personal information we collect, to request its deletion, and to non-discrimination for exercising these rights. We do **not sell or share** personal information as defined by the CCPA.

To exercise these rights, contact us at: support@reportlost.org

---

### 6. Data Retention

We retain report-related data only for as long as necessary to support matching and assistance purposes: the active duration of your report (6 or 12 months depending on the plan), plus a reasonable archival period.

In general, data is retained for **up to 24 months**, unless deletion is requested earlier or required by law. Correspondence related to paid cases may be kept for the same period to document the work performed.

---

### 7. Data Security

We take reasonable technical and organizational measures to protect personal data, including:

- Encryption of data in transit and at rest where appropriate,
- Restricted access to authorized personnel only,
- Regular review of security practices.

---

### 8. Cookies and Analytics

ReportLost.org uses a limited number of cookies or similar technologies to:

- Ensure basic site functionality,
- Understand overall site usage through privacy-respecting analytics.

Where applicable, analytics are configured to minimize the collection of personal data. You may disable cookies in your browser settings at any time.

---

### 9. Children’s Privacy

ReportLost.org is not intended for use by children under the age of 13. We do not knowingly collect personal data from children.

---

### 10. Policy Updates

We may update this Privacy Policy from time to time. The most current version will always be available on this page.

---

### 11. Contact

If you have any questions about this Privacy Policy or how your data is handled, you may contact:

**ReportLost.org**  
Email: support@reportlost.org
`;

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-sm text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-sm md:prose-base">
        <ReactMarkdown>{privacyContent}</ReactMarkdown>
      </div>
    </main>
  );
}
