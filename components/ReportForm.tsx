'use client';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function WhatHappensNext({ onNext, onBack }: Props) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Here’s what happens next</h2>
      <p className="text-gray-700">
        Your declaration has been registered. We will initiate the search. A member of our team will be your personal point of contact.
      </p>

      <div className="space-y-4">
        <Step icon="📄" title="Review of your report" text="A real person will read your declaration in detail." />
        <Step icon="📍" title="Search for likely loss areas" text="We cross-check your information with local, regional, and national databases." />
        <Step icon="📬" title="Targeted forwarding" text="We contact services that may hold your item (trains, hotels, police…)" />
        <Step icon="✉️" title="Anonymization & posting" text="We post a notice online, without your personal data. An anonymous email is generated." />
        <Step icon="📣" title="Smart dissemination" text="Your notice is shared on Google & social media, if relevant." />
        <Step icon="👩‍💼" title="Human follow-up" text="For 30 days, we’re available to update, relaunch, or close your report." />
      </div>

      <div className="flex justify-between mt-6">
        <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded" onClick={onBack}>
          Back
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="bg-blue-100 p-2 rounded">
        <span className="text-blue-600">{icon}</span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-700 text-sm">{text}</p>
      </div>
    </div>
  );
}
