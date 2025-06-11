'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import Image from 'next/image';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  contribution: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
}

function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <Link href="/">
        <div className="flex items-center space-x-2">
          <Image src="/images/logo-reportlost.png" alt="ReportLost Logo" width={160} height={40} priority />
        </div>
      </Link>
      <div className="space-x-4 text-sm text-gray-700">
        <Link href="/report">Report</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-16 py-8 px-4 text-sm text-gray-600">
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Company</h4>
          <ul className="space-y-1">
            <li><Link href="/about">About us</Link></li>
            <li><Link href="/team">Our team</Link></li>
            <li><Link href="/careers">Careers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Support</h4>
          <ul className="space-y-1">
            <li><Link href="/help">Help center</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Legal</h4>
          <ul className="space-y-1">
            <li><Link href="/terms">Terms of use</Link></li>
            <li><Link href="/privacy">Privacy policy</Link></li>
            <li><Link href="/cookies">Cookie policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Follow</h4>
          <ul className="space-y-1">
            <li><a href="#">Twitter</a></li>
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs mt-6">© {new Date().getFullYear()} ReportLost. All rights reserved.</div>
    </footer>
  );
}

export default function ReportContribution({ contribution, onChange, onBack }: Props) {
  const [proceedToPayment, setProceedToPayment] = useState(false);

  if (proceedToPayment) {
    return (
      <>
        <Navbar />
        <section className="bg-gray-50 w-full min-h-screen px-8 py-12 mx-auto">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Payment</h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm amount={contribution} />
            </Elements>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <section className="bg-gray-50 w-full min-h-screen px-8 py-12 mx-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Support Our Work</h2>
          <p className="text-gray-700">
            You choose how much to support our work. Your contribution helps us process your report, contact relevant services, and share it effectively.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              name="contribution"
              min="0"
              max="300"
              value={contribution}
              onChange={onChange}
              className="w-full"
            />
            <span className="text-lg font-medium">${contribution}</span>
          </div>

          {Number(contribution) < 12 && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 text-sm text-gray-700 space-y-2 rounded-md">
              <p>💡 The amount of remuneration you have currently selected is lower than the minimum amount set up on the platform to ensure a minimum income for our platform team members.</p>
              <p>It's useful to know that the amount you have currently selected is not the final remuneration that Daryl will receive: it is necessary to deduct all taxes and charges, fees of our payment partner, hosting fees of the platform, software and plugin fees...</p>
              <p>The diffusion of your report to one or more services, the search for correlation(s) in lost and found databases, your report being published and broadcasted on our platform and on social networks, the transmissions by e-mail and/or telephone requires full time work for our team.</p>
              <p>🌐 Our platform welcomes more than 1000 visitors every day and our goal is to help you as much as possible in your process following the loss of an item.</p>
              <p>✔️ Thanks to your retribution, we can devote time and energy on a daily basis to manage and disseminate the many reports we receive each day, a BIG Thank you!</p>
              <p>A financial retribution allows us to thank a member of the team for the time and energy devoted to the diffusion and the research of your lost item(s).</p>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <button
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              onClick={onBack}
            >
              Back
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setProceedToPayment(true)}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
