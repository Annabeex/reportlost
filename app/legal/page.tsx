'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const markdown = `
## Terms of Service – ReportLost.org

_Last updated: [DATE]_

### 1. Independent Platform
ReportLost.org is an independently operated platform, operated by an independent operator based in the European Union, that helps people document lost and found items and, where applicable, request additional search assistance. We are **not affiliated with any federal or state government**, law enforcement, public agency, transportation provider, or official lost & found service.


### 2. Nature of the Service
ReportLost.org provides two types of services:

**A) Free reporting (available to everyone):**
- Submit a lost item report or a found item report,
- Publish a report on ReportLost.org to make it easier to discover online (including via search engines).

**B) Optional paid assistance (selected plans):**
- Human oversight and manual follow-up actions related to a report,
- Outreach to relevant lost-and-found services and locations when appropriate,
- Additional visibility actions such as creating a shareable visual and distributing it on selected channels.

### 3. Reporting Is Free / Optional Paid Assistance
Submitting a report is **free**.

ReportLost.org also offers **optional paid assistance plans** that may include manual follow-up work performed by a member of our team. The availability, scope, and pricing of these plans are displayed before purchase.

Payments are due regardless of whether an item is ultimately found.

### 4. Refund Policy
When a paid assistance plan is purchased, the fee generally covers **work that may begin shortly after purchase** (review, preparation, outreach, monitoring, and related actions). For this reason, paid assistance fees are typically **non-refundable** once work has started.

Refunds may be granted in limited cases, such as:
- a technical billing error (e.g., duplicate charge),
- a clear platform malfunction preventing access to the paid assistance.

If you believe a billing error occurred, contact us at support@reportlost.org.

### 5. No Guarantee of Recovery
We use reasonable efforts to support recovery, but **we cannot guarantee** that any item will be found or returned. ReportLost.org is an auxiliary service and **not a substitute for filing an official claim** with a transportation provider, venue, or public lost & found service, or for filing a police report when appropriate.

### 6. Found Item Identification (Photos)
When reporting a found item, you may upload a photo. If available, automated tools (including image recognition) may be used to help identify the object and suggest descriptive labels.

You may also describe the item manually. You remain responsible for ensuring your report is accurate.

### 7. Publication and Sharing
By submitting a report, you authorize ReportLost.org to:
- Publish report content on our platform,
- Display the report in relevant categories or pages to improve discoverability,
- Share the report through selected channels when appropriate (especially for paid assistance plans),
- Contact third-party services (transport companies, municipalities, venues, etc.) when relevant and when permitted by the chosen assistance plan.

We may redact or remove sensitive, unlawful, or inappropriate content before publication or distribution.

### 8. Data Collection and Privacy
We collect only the information necessary to process and display reports (contact details, item description, location, optional photos).

All payment data is processed via **Stripe**, a PCI-DSS compliant payment processor.

- **We do not sell or rent your data.**
- You may request access or deletion of your data, subject to legal and operational requirements.
- Data is retained for a limited period for matching and service purposes unless deletion is requested earlier, where applicable.

See our [Privacy Policy](/privacy) for full details.

### 9. Intellectual Property
All content on ReportLost.org (text, design, logos, code) is protected under applicable copyright and intellectual property laws. Any reproduction or reuse without permission is prohibited.

### 10. Liability Limitation
To the maximum extent allowed by law:
- We are not liable for indirect or consequential losses resulting from the use of the service.
- We do not guarantee the accuracy of user-submitted reports or third-party responses.
- You are responsible for the truthfulness and legality of your submission and for complying with applicable laws.

### 11. Governing Law and Disputes
These terms are governed by applicable law. Consumers may also benefit from mandatory protections under their local consumer laws. If a dispute arises, we encourage contacting support@reportlost.org first so we can attempt to resolve it amicably.

### 12. Contact Information
For questions about these Terms, contact:  
Email: support@reportlost.org  

---

These terms are binding upon use of the ReportLost.org service. Continued use implies acceptance. We recommend you save a copy for your records.
`;

export default function LegalPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 prose prose-sm md:prose-base">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </main>
  );
}
