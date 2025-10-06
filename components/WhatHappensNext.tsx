"use client";

import Image from "next/image";
import { formatCityWithState } from "@/lib/locationUtils";

interface Props {
  formData: any;
  onNext: () => void;
  onBack: () => void;
  fullScreen?: boolean;
}

export default function WhatHappensNext({
  formData,
  onNext,
  onBack,
  fullScreen,
}: Props) {
  const cityDisplay = formatCityWithState(formData.city, formData.state_id);
  const locationSummary = [cityDisplay, formData.loss_neighborhood, formData.loss_street]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(", ");

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    onNext();
  };

  return (
    <section
      className={`bg-gray-50 ${
        fullScreen ? "w-full min-h-screen px-8 py-12" : "p-6"
      } mx-auto`}
    >
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">
            Your report has been submitted
          </h2>
          <p className="text-gray-700 text-lg">Here's what happens next.</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-sm text-gray-700">
          {[
            {
              svg: "🗂️",
              title: "Your report is reviewed",
              desc: "Our team carefully reads and verifies the details you've provided.",
            },
            {
              svg: "🔍",
              title: "Search efforts begin",
              desc: "We compare your report to public and private lost & found databases.",
            },
            {
              svg: "📤",
              title: "Targeted transmission",
              desc: "If relevant, we forward your report to institutions like transit, hotels, or authorities.",
            },
            {
              svg: "📧",
              title: "Anonymous publication",
              desc: "Your report is posted without personal data. A special email address is created for replies.",
            },
            {
              svg: "📣",
              title: "Optimized visibility",
              desc: "We ensure your report can be indexed on Google and shared on relevant networks.",
            },
            {
              svg: "🧑‍💻",
              title: "Ongoing support",
              desc: "For the next 30 days, our team remains available to update or close your report.",
            },
            {
              svg: "🔒",
              title: "Data protection",
              desc: "Your data is encrypted and processed according to strict privacy standards.",
            },
          ].map(({ svg, title, desc }, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm"
            >
              <div className="text-2xl mt-1">{svg}</div>
              <div>
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-gray-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="my-12" />

        {/* Summary */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-gray-900 text-center">
            Lost item summary
          </h3>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <ul className="space-y-3 text-gray-800 text-base flex-1">
              <li>
                <strong>Item:</strong> {formData.title}
              </li>
              <li>
                <strong>Description:</strong> {formData.description}
              </li>
              <li>
                <strong>Date:</strong> {formData.date}
              </li>
              {formData.time_slot && (
                <li>
                  <strong>Time slot:</strong> {formData.time_slot}
                </li>
              )}
              <li>
                <strong>Location:</strong> {locationSummary || "—"}
              </li>
              {formData.report_public_id && (
                <li>
                  <strong>Reference code:</strong> {formData.report_public_id}
                </li>
              )}

              {formData.transport && (
                <>
                  <li>
                    <strong>Transport:</strong> Yes
                  </li>
                  <ul className="ml-4 text-sm text-gray-700 space-y-1">
                    <li>
                      <strong>From:</strong> {formData.departure_place}
                    </li>
                    <li>
                      <strong>To:</strong> {formData.arrival_place}
                    </li>
                    <li>
                      <strong>Departure time:</strong> {formData.departure_time}
                    </li>
                    <li>
                      <strong>Arrival time:</strong> {formData.arrival_time}
                    </li>
                    <li>
                      <strong>Travel number:</strong> {formData.travel_number}
                    </li>
                  </ul>
                </>
              )}

              {formData.phone_description && (
                <li>
                  <strong>Phone details:</strong> {formData.phone_description}
                </li>
              )}
            </ul>

            {formData.object_photo && (
              <div className="flex-shrink-0 max-w-[400px] w-full">
                <p className="font-medium text-gray-800 mb-2">
                  Uploaded image:
                </p>
                <div className="border rounded shadow overflow-hidden">
                  <Image
                    src={formData.object_photo}
                    alt="Lost item"
                    width={400}
                    height={300}
                    style={{ objectFit: "contain", width: "100%", height: "auto" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-10">
          <button
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded"
          >
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}
