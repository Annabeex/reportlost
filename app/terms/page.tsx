'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const termsContent = `
## Terms of Use – ReportLost.org

_Last updated: [DATE]_

Welcome to ReportLost.org. By accessing or using this platform, you agree to the following Terms of Use.

### 1. Independent Platform

ReportLost.org is an independent platform operated by an independent operator based in the European Union. The platform helps users document lost and found items and, where applicable, request additional search assistance.

ReportLost.org is **not affiliated with any government entity**, law enforcement agency, transportation provider, or official lost & found service.

Use of the platform is voluntary and at your own discretion.

---

### 2. Scope of the Service

ReportLost.org offers:

**A) Free reporting**
- Submission of lost item and found item reports,
- Publication of reports on ReportLost.org to improve online visibility and searchability.

**B) Optional paid assistance**
- Human review and manual follow-up actions,
- Outreach to relevant lost-and-found services or locations,
- Additional visibility actions depending on the selected assistance plan.

Details and pricing for paid assistance are clearly displayed before purchase.

---

### 3. User Responsibilities

By submitting a report, you confirm that:
- The information provided is accurate and truthful to the best of your knowledge,
- You have the right to share the submitted content,
- You will not submit unlawful, misleading, abusive, or fraudulent content.

ReportLost.org reserves the right to remove or redact content that violates these Terms.

---

### 4. Payments and Refunds

Submitting a report is **free**.

Optional paid assistance plans may be offered. When a paid assistance plan is purchased, fees generally cover work that may begin shortly after purchase (review, preparation, outreach, monitoring, and related actions).

For this reason, paid assistance fees are generally **non-refundable** once work has started. Refunds may be considered in limited cases, such as a technical billing error or platform malfunction.

---

### 5. No Guarantee of Recovery

ReportLost.org applies reasonable efforts to assist users but **does not guarantee** that any item will be found or returned.

The platform is an auxiliary service and does **not replace** official procedures such as filing a police report or submitting claims with transportation providers or venues.

---

### 6. Found Item Identification

When reporting a found item, users may upload photos. Automated tools, including image recognition, may be used to help identify objects and suggest descriptive labels.

Users remain responsible for the accuracy of submitted reports.

---

### 7. Data Protection and Privacy

Personal data is processed in accordance with our [Privacy Policy](/privacy).

- We do not sell or rent personal data,
- Sensitive data is protected using appropriate security measures,
- Users may request access to or deletion of their data, subject to applicable laws and operational requirements.

---

### 8. Intellectual Property

All content on ReportLost.org, including text, design, logos, and code, is protected under applicable intellectual property laws. Unauthorized reproduction or use is prohibited.

---

### 9. Limitation of Liability

To the fullest extent permitted by law, ReportLost.org shall not be liable for:
- Indirect, incidental, or consequential damages,
- Losses resulting from third-party interactions,
- Inaccuracies in user-submitted content or external responses.

---

### 10. Governing Law and Dispute Resolution

These Terms are governed by applicable law. Users may also benefit from mandatory protections under their local consumer laws.

In the event of a dispute, we encourage users to contact support@reportlost.org first so we may attempt to resolve the matter amicably.

---

### 11. Modifications

We may update these Terms from time to time. Continued use of the platform constitutes acceptance of the most recent version.

---

### 12. Contact

For questions regarding these Terms:

**ReportLost.org**  
Email: support@reportlost.org
`;

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-sm text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Terms of Use</h1>
      <div className="prose prose-sm md:prose-base">
        <ReactMarkdown>{termsContent}</ReactMarkdown>
      </div>
    </main>
  );
}
