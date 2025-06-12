'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const cookiesContent = `
## Cookie Policy – ReportLost.org

_Last updated: [DATE]_

### 1. What Are Cookies?
Cookies are small text files stored on your device when you visit a website. They help websites remember your actions and preferences over time.

We use **minimal cookies** and tracking technologies to improve your experience and measure traffic.

### 2. Types of Cookies We Use

- **Essential Cookies**: Required for basic site functionality (e.g., remembering your form input during the report process).
- **Analytics Cookies**: Used anonymously to understand traffic (e.g., Google Analytics or Plausible).
- **No advertising cookies** are set or used on ReportLost.org.

### 3. Managing Cookies

You can manage or disable cookies through your browser settings at any time. Note that disabling essential cookies may impact site functionality.

Most browsers allow you to:
- View the cookies stored,
- Delete them individually or all at once,
- Block or allow cookies per website.

### 4. Third-Party Services

We may use tools such as:
- **Stripe** for secure payment,
- **Google Analytics** or **Plausible** for traffic insights.

These tools may set their own cookies and are subject to their respective privacy policies.

### 5. Do Not Track (DNT)

We respect your browser's **Do Not Track** signal where supported, although some third-party tools may not.

### 6. Updates

We may update this cookie policy to reflect changes in practices or regulations. The latest version will always be available on this page.

### 7. Contact

For questions about our cookie use, contact us at:

**ReportLost.org**  
123 Example Street, San Francisco, CA 94110  
Email: support@reportlost.org
`;

export default function CookiesPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-sm text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Cookie Policy</h1>
      <div className="prose prose-sm md:prose-base">
        <ReactMarkdown>{cookiesContent}</ReactMarkdown>
      </div>
    </main>
  );
}
