'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Mail, Globe, Search, Users, BellRing, ShieldCheck, Clock } from "lucide-react";

type Report = {
  caseId: string;
  dateReported?: string;
  itemTitle?: string;
  itemType?: string;
  city?: string;
  state?: string;
  anonymousEmail?: string;
  notificationEmail?: string;
  supportPhone?: string;
};

export default function ReportDetailsPanel({
  report,
}: {
  report: Report;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    databaseSearches: true,
    localNotifications: false,
    anonEmail: false,
    onlinePub: false,
    indexFeeds: false,
    social: false,
    partners: false,
    monitoring: false,
    matchFlow: false,
    safety: false,
    userTips: false,
    recommendations: false,
    scams: false,
    notifications: false,
    pricing: false,
    faq: false,
    checklist: false,
    contact: false,
  });

  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  const panels: {
    key: string;
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }[] = [
    {
      key: "databaseSearches",
      title: "Database & Partner Searches",
      icon: <Search className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            We search the full spectrum of public and partner lost-&-found sources that are
            most likely to list found items in your area: national & regional aggregators,
            municipal pages, transit & airport listings, university systems, police logs,
            classifieds, and active local groups.
          </p>
          <p>
            <strong>Current result:</strong> No exact match found at time of publication. We
            repeat these checks automatically and manually (see Monitoring & Verification).
          </p>
        </div>
      ),
    },

    {
      key: "localNotifications",
      title: "Local Notifications & Authority Outreach",
      icon: <BellRing className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            We notify local lost & found desks and common drop-off points when relevant: police
            non-emergency lines, transit agencies, airport lost & found, and nearby
            institutions (hotels, hospitals, universities). We include your report reference
            so physical returns can be matched quickly.
          </p>
          <p>
            <em>Premium option:</em> we can call and follow up on your behalf — useful for
            time-sensitive or high-value items.
          </p>
        </div>
      ),
    },

    {
      key: "anonEmail",
      title: "Anonymous Contact Address",
      icon: <Mail className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            We created a case-specific anonymous inbox: <code>{report.anonymousEmail || "case-xxxx@reportlost.org"}</code>.
            Finders can message this address; our moderators screen messages and forward verified
            leads to you. Your personal email is never published publicly.
          </p>
        </div>
      ),
    },

    {
      key: "onlinePub",
      title: "Online Publication & Accessibility",
      icon: <Globe className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            Your public report is live in our database and optimized for desktop, tablet and
            mobile. We publish structured metadata to help search engines find and index the
            listing.
          </p>
        </div>
      ),
    },

    {
      key: "indexFeeds",
      title: "Search Engines & Feed Distribution",
      icon: <Users className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            We submit the report to major search engines and our syndicated feeds. This helps
            crawlers discover the listing faster — indexing timing is controlled by the
            search engines themselves.
          </p>
        </div>
      ),
    },

    {
      key: "social",
      title: "Social Media & Community Posting",
      icon: <Users className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            We post the report to our public Facebook page and local groups, prepare a Nextdoor
            template, and publish short alerts on X and Instagram. Facebook and Nextdoor are
            typically the most effective for recoveries; Instagram and TikTok are
            supplementary.
          </p>
        </div>
      ),
    },

    {
      key: "partners",
      title: "Specialist Channels & Partners",
      icon: <Globe className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            When appropriate we push the listing to specialized networks (pet recovery
            platforms, resale marketplaces, institutional pages) and local classified boards.
          </p>
        </div>
      ),
    },

    {
      key: "monitoring",
      title: "Automated Monitoring & Human Verification",
      icon: <Clock className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            We combine automated scans, image-similarity checking, and human review. Active
            monitoring runs for <strong>30 days</strong> with multiple daily checks. After 30
            days the listing is archived and scanned at a reduced frequency unless you request
            removal.
          </p>
        </div>
      ),
    },

    {
      key: "matchFlow",
      title: "What Happens If We Find a Match",
      icon: <ShieldCheck className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <ol>
            <li>We verify photos and identifying marks.</li>
            <li>We request verification photos from the finder via the anonymous inbox.</li>
            <li>We notify you immediately with instructions; we never publish your private data.</li>
            <li>We advise a safe, public handoff and coordinate with police if needed.</li>
          </ol>
        </div>
      ),
    },

    {
      key: "safety",
      title: "Safety & Anti-Scam Measures",
      icon: <ShieldCheck className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            Our moderators screen messages and flag suspicious requests. We recommend public
            meetups, traceable payment methods for rewards, and that you never share your home
            address publicly.
          </p>
        </div>
      ),
    },

    {
      key: "userTips",
      title: "How You Can Search Effectively",
      icon: <Search className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <ul>
            <li>Use precise keywords (brand, color, serial number, neighborhood).</li>
            <li>Apply recent-date filters in search engines and group posts.</li>
            <li>Use reverse image search (Google Images / TinEye) when you have photos.</li>
            <li>Check Craigslist, Nextdoor and local Facebook groups daily.</li>
            <li>Visit local lost & found counters with proof of ownership.</li>
          </ul>
        </div>
      ),
    },

    {
      key: "recommendations",
      title: "Recommendations to Improve Recovery Odds",
      icon: <Users className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            Consider adding small labels or QR-coded contact info to keys and valuables,
            keeping clear photos and serial numbers, and using tracking devices for high-value
            portable items.
          </p>
        </div>
      ),
    },

    {
      key: "scams",
      title: "Common Scam Signals",
      icon: <ShieldCheck className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            Be cautious if a finder asks for payment before verification, demands unusual
            shipping arrangements, or refuses to provide clear verification photos.
          </p>
        </div>
      ),
    },

    {
      key: "notifications",
      title: "Notifications & How We Keep You Informed",
      icon: <Mail className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            Verified leads are forwarded to <code>{report.notificationEmail || report.anonymousEmail || "your contact"}</code>.
            Live status updates are available on your report page.
          </p>
        </div>
      ),
    },

    {
      key: "pricing",
      title: "Why This Service Is Priced",
      icon: <Globe className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            The fee covers manual vetting, daily automated and manual searches, outreach to
            institutions, the anonymous inbox moderation, verification protocols, and secure
            handoff guidance. These combined services materially increase recovery odds and
            reduce scam exposure.
          </p>
        </div>
      ),
    },

    {
      key: "faq",
      title: "FAQ — Quick Answers",
      icon: <Users className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            <strong>How long do you monitor?</strong> Active for 30 days, passive thereafter.
          </p>
          <p>
            <strong>Can I edit my report?</strong> Yes — updates trigger renewed outreach and
            re-indexing.
          </p>
        </div>
      ),
    },

    {
      key: "checklist",
      title: "Immediate Checklist — What You Should Do Now",
      icon: <Clock className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <ol>
            <li>Upload clear photos showing identifying marks or serial numbers.</li>
            <li>Check the anonymous inbox for verified leads.</li>
            <li>Visit local lost & found counters with proof of ownership.</li>
            <li>Set up a Google Alert for the report keywords (we can help).</li>
          </ol>
        </div>
      ),
    },

    {
      key: "contact",
      title: "Contact & Escalation",
      icon: <Mail className="w-5 h-5 text-green-700" />,
      children: (
        <div className="prose max-w-none text-sm leading-relaxed">
          <p>
            Support email: <code>support@reportlost.org</code>
          </p>
          <p>Phone (premium): {report.supportPhone || "(optional)"}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">Report ID: {report.caseId}</h1>
        <p className="text-sm text-slate-600">Submitted on {report.dateReported || "—"} • Item: <span className="font-medium">{report.itemTitle || report.itemType || "—"}</span> • Location: {report.city || "—"}, {report.state || "—"}</p>
      </header>

      <div className="grid gap-4">
        {panels.map((p) => (
          <section key={p.key} className="rounded-lg border border-green-100 bg-white shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 focus:outline-none"
              onClick={() => toggle(p.key)}
              aria-expanded={!!open[p.key]}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-100">{p.icon}</div>
                <div>
                  <h3 className="text-left text-sm font-medium text-green-800">{p.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{open[p.key] ? 'Open' : 'Details'}</span>
                <motion.span
                  animate={{ rotate: open[p.key] ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <ChevronRight className="w-5 h-5 text-green-700" />
                </motion.span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {open[p.key] && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  <div className="p-6 border-t border-green-100 bg-white">
                    {p.children}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ))}
      </div>

      <footer className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          <p>
            Need help? <a className="text-green-700 font-semibold" href={`mailto:support@reportlost.org`}>support@reportlost.org</a>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-green-200 bg-white text-sm shadow-sm hover:bg-green-50"
          >
            Copy report link
          </button>

          <a
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm shadow-sm hover:bg-green-700"
            href={`mailto:${report.anonymousEmail || 'case-xxxx@reportlost.org'}?subject=Update%20on%20report%20${report.caseId}`}
          >
            Email anonymous inbox
          </a>
        </div>
      </footer>
    </div>
  );
}
