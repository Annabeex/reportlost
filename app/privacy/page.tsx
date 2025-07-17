'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const privacyContent = `
## Privacy Policy – ReportLost.org

_Last updated: [DATE]_

### 1. Data We Collect
We collect only the information strictly necessary to process and share your lost item report:
- Contact details (name, email, phone),
- Item description and circumstances of loss,
- Optional photos or supporting information.

All data is provided voluntarily by the user.

### 2. Use of Data
Your data is used to:
- Create and display your report on our platform,
- Share it with relevant third parties (if authorized),
- Process payment and manage user communication.

We never sell or rent your data.

### 3. Data Sharing
We only share your data:
- With third parties involved in lost & found efforts, with your consent,
- With service providers (e.g. Stripe) necessary for payment processing.

Stripe is PCI-DSS compliant. We do not store payment details ourselves.

### 4. Your Rights
We comply with the **California Consumer Privacy Act (CCPA)** and apply similar standards to all U.S. users.

You have the right to:
- Request a copy of your data,
- Request deletion of your data,
- Opt-out of data sharing.

To exercise these rights, contact us at: support@reportlost.org

### 5. Data Retention
We retain report data for **up to 24 months**, unless deletion is requested earlier.

### 6. Data Security
- Data is encrypted at rest and in transit,
- Only authorized personnel can access your data,
- We conduct regular security reviews.

### 7. Cookies & Tracking
We use minimal cookies for:
- Basic site functionality,
- Anonymous analytics (e.g. Google Analytics, Plausible).

You can disable cookies in your browser at any time.

### 8. Children’s Privacy
This service is not intended for users under the age of 13. We do not knowingly collect personal data from children.

### 9. Updates
We may update this policy from time to time. The latest version will always be available on this page.

### 10. Contact
If you have any questions about this Privacy Policy, please contact us:

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
