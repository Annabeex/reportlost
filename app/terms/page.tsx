'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const termsContent = `
## Terms of Use – ReportLost.org

Welcome to ReportLost.org. By accessing or using our platform, you agree to comply with the following terms:

### 1. Scope of Use

ReportLost.org is an independent platform designed to assist users in taking proactive steps to recover lost items. It is not affiliated with any public or private institution.

Use of the platform is entirely at your own discretion and risk.

### 2. User Responsibilities

By submitting a report, you certify that the information you provide is accurate and truthful. You agree not to:

- Submit false or misleading information,
- Post content that is abusive, unlawful, or infringes on third-party rights,
- Misuse the platform for fraudulent purposes.

### 3. Service Limitations

We offer assistance in locating lost items through digital means, including:
- Helping fill out official online forms,
- Sharing reports on social platforms or public directories,
- Communicating with potential recovery partners.

We do **not guarantee** item recovery, nor do we act as a substitute for legal filings or transport company claims.

### 4. Contributions

Users must pay a **non-refundable contribution** when submitting a report. This fee covers platform operation and outreach efforts.

Refunds are only considered in case of technical error (e.g. duplicate billing).

### 5. Intellectual Property

All materials on ReportLost.org are the intellectual property of the site or its licensors. Reproduction without permission is strictly prohibited.

### 6. Data Protection

Data is collected and processed in accordance with our [Privacy Policy](/privacy). Sensitive data is encrypted, and no personal data is sold or monetized.

### 7. Limitation of Liability

To the fullest extent permitted by law, ReportLost.org shall not be liable for:

- Indirect, incidental, or consequential damages,
- Data loss or misuse,
- Third-party interactions initiated via our platform.

### 8. Governing Law

These Terms are governed by the laws of **California**, USA. Any disputes shall be resolved in the courts of **San Francisco County**, unless otherwise required by applicable consumer laws.

### 9. Modifications

We reserve the right to modify these Terms at any time. Continued use of the site implies acceptance of the most current version.

### 10. Contact

For any legal questions:

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
