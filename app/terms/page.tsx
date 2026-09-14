'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const termsContent = `
## Terms of Use – ReportLost.org

_Last updated: July 15, 2026_

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
- Publication of reports on ReportLost.org to improve online visibility and searchability. A published report is a **public page**: it can be read by anyone and indexed by search engines. You may ask us to remove it at any time by writing to support@reportlost.org from the address used for the report.

**B) Optional paid assistance**

One assistance plan is offered at checkout, as a one-time fee. Lost pets are handled under the same plan, with priority processing. A reduced plan covering the automated deliverables alone is offered afterwards to users who chose the free listing:

**Active search ($25)** covers six deliverables, for 12 months from activation:

1. **Filing with the competent lost-property service.** We transmit your report to the service responsible for the loss location, in most cases the local police department or the municipal lost-property office. This is done provided we hold the information that service requires; where local rules oblige the owner to file personally, we provide the relevant office, reporting link and step-by-step instructions instead.
2. **Outreach to the places likely to hold the item.** Selected from your loss location: transport operator, hotel, restaurant, venue, airport, taxi company, nearby businesses and surrounding lost-property desks.
3. **Creation and distribution of a visual notice.** Published on social media and in the relevant local groups, including private groups we are members of. The notice displays an anonymous relay email address linked to your case, so finders can contact you without your personal address or phone number being disclosed.
4. **Automated web monitoring for 12 months.** An AI search engine scans public web sources using your item's keywords, every day for the first week, then once a week, then once a month. Potential matches are reviewed by a team member before being forwarded to you. Monitoring does not cover content inaccessible to public search tools.
5. **A loss report certificate**, issued on our website and downloadable from your case page. It records your declaration and its date. **It is not an official document and does not replace a police report or any document issued by a public authority.**
6. **A printable sheet of QR stickers**, to be printed on adhesive paper. Each code routes a finder to the anonymous relay address linked to your case.

**Pet Priority ($25)** is the same plan applied to a lost animal, with time-critical handling: outreach to local shelters, animal control and rescue services, and publication in local lost pet groups, private ones included.

**Automatic search ($12)** is offered only to users who have already chosen the free listing, and is not available as an alternative at checkout. It covers deliverables 4, 5 and 6 above and nothing else, with automated web monitoring running for **6 months** instead of 12. No filing with a lost-property service, no outreach to third parties and no visual notice are carried out under this plan.

There is no partial or free-choice contribution: the amounts above are fixed, and a report is either published free of charge or handled under one of the plans described here.

Where a police department or public office accepts lost property reports filed by a third party, we file the report on your behalf. Where local rules require the owner to file personally, we provide the appropriate contact details, links and instructions instead.

Details and pricing for paid assistance are clearly displayed before purchase.

---

### 3. User Responsibilities

By submitting a report, you confirm that:
- The information provided is accurate and truthful to the best of your knowledge,
- You have the right to share the submitted content,
- You will not submit unlawful, misleading, abusive, or fraudulent content.

Because a published report is public, do not write identifying numbers in the free-text fields. Before publication we automatically filter out email addresses, phone numbers, social security numbers, and long sequences of digits such as IMEI, card or licence numbers. This filtering is a safeguard, not a guarantee: you remain responsible for what you write.

ReportLost.org reserves the right to remove or redact content that violates these Terms.

---

### 4. Payments and Refunds

Submitting a report is **free**.

Paid assistance plans are one-time fees, not subscriptions, and are processed securely by Stripe. When a plan is purchased, the fee covers work that begins shortly after purchase (review, preparation, outreach, keeping the report active in our matching search, and related actions) for the duration stated in the plan.

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
