// WhatHappensNext.tsx
'use client';

import { Mail, ShieldCheck, Share2, MapPin, Send, UserCheck, Search, FolderCheck } from 'lucide-react';

interface Props {
  formData: any;
  onNext: () => void;
  onBack: () => void;
  fullScreen?: boolean;
}

export default function WhatHappensNext({ formData, onNext, onBack, fullScreen }: Props) {
  return (
    <section className={`bg-gray-50 ${fullScreen ? 'w-full min-h-screen px-8 py-12' : 'p-6'} mx-auto`}>
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">You have just submitted a report.</h2>
          <p className="text-gray-700 text-lg">Here’s what happens next.</p>
        </div>

        <p className="text-center text-gray-600 max-w-xl mx-auto">
          Your declaration has been registered. We will initiate the search. A member of our team will be your personal point of contact.
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
            <FolderCheck className="text-blue-600 w-6 h-6 mt-1" />
            <div>
              <p className="font-semibold text-gray-800">Review of your report</p>
              <p className="text-gray-600 text-sm">A real person will read your declaration in detail.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
            <Search className="text-blue-600 w-6 h-6 mt-1" />
            <div>
              <p className="font-semibold text-gray-800">Search for likely loss areas</p>
              <p className="text-gray-600 text-sm">We cross-check your information with various local, regional, and national databases.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
            <Send className="text-blue-600 w-6 h-6 mt-1" />
            <div>
              <p className="font-semibold text-gray-800">Targeted forwarding</p>
              <p className="text-gray-600 text-sm">If necessary, we contact locations or services that may hold your item (trains, hotels, police…).</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
            <Mail className="text-blue-600 w-6 h-6 mt-1" />
            <div>
              <p className="font-semibold text-gray-800">Anonymization & posting</p>
              <p className="text-gray-600 text-sm">We post a notice online, without your personal data. An anonymous e-mail is generated to receive replies.</p>
              <div className="mt-1 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">anonymous@email.report</div>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
            <Share2 className="text-blue-600 w-6 h-6 mt-1" />
            <div>
              <p className="font-semibold text-gray-800">Smart dissemination</p>
              <p className="text-gray-600 text-sm">Your notice is referenced on Google + social networks (if relevant). The aim: for the finder to be able to find you easily.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
            <UserCheck className="text-blue-600 w-6 h-6 mt-1" />
            <div>
              <p className="font-semibold text-gray-800">Human follow-up</p>
              <p className="text-gray-600 text-sm">For 30 days, we’re available to update, relaunch, or close your report.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
            <ShieldCheck className="text-blue-600 w-6 h-6 mt-1" />
            <div>
              <p className="font-semibold text-gray-800">Privacy & Security</p>
              <p className="text-gray-600 text-sm">We never sell your data. The service is encrypted and fully compliant with international privacy laws.</p>
            </div>
          </div>
        </div>

        <hr className="my-12" />

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-gray-900 text-center">Your report summary</h3>
          <ul className="space-y-3 text-gray-800 text-base">
            <li><strong>Item:</strong> {formData.item}</li>
            <li><strong>Description:</strong> {formData.description}</li>
            <li><strong>Date:</strong> {formData.date}</li>
            <li><strong>Time slot:</strong> {formData.timeSlot || 'Not specified'}</li>
            <li><strong>Location of loss:</strong> {formData.lossCity}, {formData.lossNeighborhood}, {formData.lossStreet}</li>
            <li><strong>Transport:</strong> {formData.transport ? 'Yes' : 'No'}</li>
            {formData.transport && (
              <ul className="ml-4 text-sm text-gray-700 space-y-1">
                <li><strong>From:</strong> {formData.departurePlace}</li>
                <li><strong>To:</strong> {formData.arrivalPlace}</li>
                <li><strong>Departure time:</strong> {formData.departureTime}</li>
                <li><strong>Arrival time:</strong> {formData.arrivalTime}</li>
                <li><strong>Travel number:</strong> {formData.travelNumber}</li>
              </ul>
            )}
            <li><strong>Name:</strong> {formData.firstName} {formData.lastName}</li>
            <li><strong>Email:</strong> {formData.email}</li>
            {formData.phone && <li><strong>Phone:</strong> {formData.phone}</li>}
            {formData.address && <li><strong>Address:</strong> {formData.address}</li>}
          </ul>
        </div>

        <div className="flex justify-between pt-10">
          <button onClick={onBack} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded">
            Back
          </button>
          <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded">
            Proceed to payment
          </button>
        </div>
      </div>
    </section>
  );
}
