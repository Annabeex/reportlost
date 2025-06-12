'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const markdown = `
## Terms of Service – ReportLost.org

_Last updated: [DATE]_

### 1. Independent Platform
ReportLost.org is a privately operated platform that helps individuals take all reasonable steps to recover lost items in the United States. We are **not affiliated with any federal or state government**, law enforcement, public agency, transportation provider, or official lost & found service.

### 2. Nature of the Service
Our service includes:
- Completing official online forms on your behalf,
- Sharing your lost item report across our platform and relevant digital groups or social media,
- Following up when appropriate to help facilitate recovery.

### 3. Contributions & Payments
Submitting a report requires a **non-refundable contribution**, the amount of which is chosen by the user. Payment is due regardless of whether the lost item is ultimately found.

> In accordance with U.S. consumer protection principles, this contribution is clearly disclosed before payment. Given the nature of the service (digital, on-demand work), users **waive any right to a refund**, except in the event of an error caused by our platform (e.g., duplicate billing).

### 4. No Guarantee of Recovery
While we apply reasonable efforts and proven methods to help, **we cannot guarantee** that any item will be recovered. You acknowledge and agree that ReportLost.org is an auxiliary service and **not a substitute for filing a police report or official transportation claim**.

### 5. Publication and Public Sharing
By submitting a report, you authorize us to:
- Publish its content (anonymized or not, depending on your choice) on our platform,
- Share the report with relevant public groups (e.g. Facebook, Reddit, Telegram, Craigslist),
- Contact third-party services (transport companies, municipalities, etc.) as needed.

We reserve the right to redact sensitive or inappropriate content before distribution.

### 6. Data Collection and Privacy
We collect only the information necessary to process and share your report (contact, item description, location, optional photos). All payment data is processed via **Stripe**, a PCI-DSS compliant payment processor.

- **Data is encrypted at rest and in transit.**
- **We never sell or rent your data.**
- **We comply with the California Consumer Privacy Act (CCPA)** and apply similar protections to all U.S. users, including:
  - The right to request access to your data,
  - The right to request deletion,
  - The right to opt-out of data sharing (we don’t sell data anyway).
- Data is retained for **up to 24 months** unless deletion is requested earlier.

See our [Privacy Policy](/privacy) for full details.

### 7. Intellectual Property
All content on ReportLost.org (text, design, logos, code) is protected under **U.S. copyright law** and international treaties. Any reproduction or reuse without permission is strictly prohibited.

### 8. Liability Limitation
To the maximum extent allowed by law:
- We are not liable for loss of opportunity, financial damage, or indirect losses resulting from the use of this service.
- We do not guarantee the accuracy of user-submitted reports or third-party responses.
- You are responsible for the truthfulness of your submission.

### 9. Jurisdiction and Applicable Law
This agreement is governed by the laws of the State of **California**, considered among the strictest U.S. states for consumer protection and privacy.

All legal disputes shall be resolved in the courts of **San Francisco County, California**, unless otherwise required by local consumer laws.

### 10. Contact Information
ReportLost.org is operated by:  
**[Your Entity Name]**  
123 Example Street, San Francisco, CA 94110  
Email: support@reportlost.org  
Phone: +1 (555) 123‑4567

---

These terms are binding upon use of the ReportLost.org service. Continued use implies acceptance. We recommend you print or save a copy for your records.
`;

export default function LegalPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 prose prose-sm md:prose-base">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </main>
  );
}
