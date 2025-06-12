'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section className="bg-white w-full px-8 pt-12 pb-8 mx-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-10">
          <div className="w-full md:w-1/2">
            <Image
              src="/images/usa-map-gray.svg"
              alt="United States Map"
              width={600}
              height={400}
              className="mx-auto"
              priority
            />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lost and Found Services in the United States
            </h1>
            <p className="text-gray-700 mb-6">
              Report and recover lost items from various cities and states across the United States of America.
            </p>
            <Link
              href="/report"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold"
            >
              Report a Lost item
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 w-full min-h-screen px-8 py-12 mx-auto">
        <div className="max-w-4xl mx-auto prose lg:prose-xl">
          <h1>Welcome to ReportLost.org – The Lost & Found Service for the United States</h1>
          <p><strong>ReportLost.org</strong> is your dedicated online platform for reporting, finding, and recovering lost items anywhere in the United States. Whether it happened in a bustling airport, on public transportation, or simply out in a local park, we help reconnect people with their missing belongings through technology and human assistance.</p>
          <Image src="/images/lost-and-found-illustration.png" alt="Illustration of lost items" width={800} height={400} />
          <h2>How It Works</h2>
          <ol>
            <li>Submit a detailed report with as much information as possible.</li>
            <li>We analyze and match your report with databases and local groups.</li>
            <li>Your report is shared with appropriate authorities and relevant services.</li>
            <li>Receive real-time updates and connect with the team if your item is found.</li>
          </ol>
          <h2>Why ReportLost.org?</h2>
          <ul>
            <li>✅ Available 24/7 online</li>
            <li>✅ Covers all U.S. cities and states</li>
            <li>✅ Combines AI-powered analysis with human follow-up</li>
            <li>✅ Trusted by thousands of users</li>
            <li>✅ Private, anonymous submissions available</li>
          </ul>
          <h2>Use Cases: Who Is This For?</h2>
          <p>We serve everyone who’s experienced the stress of losing something important:</p>
          <ul>
            <li>Tourists who lost items while traveling in the U.S.</li>
            <li>Citizens who've misplaced phones, bags, or documents in transit</li>
            <li>Businesses seeking to centralize lost property reports</li>
            <li>Event organizers handling missing items from attendees</li>
          </ul>
          <h2>Where It Works</h2>
          <p>Our service is currently available across the entire United States, including major hubs like New York, Los Angeles, Chicago, Houston, and smaller cities and towns. Whether you lost something in a taxi, train station, or beach resort, our national coverage increases your chance of recovery.</p>
          <h2>Security and Transparency</h2>
          <p>All personal data is encrypted and treated with the highest level of confidentiality. You remain in control of what is shared and where. Our team is trained to protect your privacy and only communicate with verified channels.</p>
          <Image src="/images/security-icon.png" alt="Security and data protection" width={600} height={300} />
          <h2>How to Start</h2>
          <p>Click on “Report” in the navigation bar above, fill in the form, and leave the rest to us. It takes less than 5 minutes to submit a declaration.</p>
          <p><strong>Need help?</strong> Visit our <Link href="/help">Help Center</Link> or <Link href="/contact">Contact Us</Link>.</p>
          <h2>Join a Community That Cares</h2>
          <p>More than just a lost and found, ReportLost.org is a network of real people, real support, and real results. We believe that every item lost deserves a chance to be found. Together, let’s reduce loss and increase peace of mind, one report at a time.</p>
        </div>
      </section>
    </>
  );
}
