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

  const placeLabel =
    (formData?.transport_type_other || "").trim() ||
    (formData?.transport_type || "").trim() ||
    (formData?.place_type_other || "").trim() ||
    (formData?.place_type || "").trim() ||
    "unspecified place";

  const btnGreen =
    "bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449] text-white font-semibold px-6 py-2 rounded shadow inline-flex items-center justify-center";

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    onNext();
  };

  const LIGHT_GREEN_BG = "#f3fdf5"; // même vert doux que sur les autres pages

  return (
    <section
      className={`bg-gray-50 ${
        fullScreen ? "w-full min-h-screen px-8 py-12" : "p-6"
      } mx-auto`}
    >
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">What happens next?</h2>

          {/* 
          --- CONTENU TEMPORAIREMENT MASQUÉ ---
          <p className="text-gray-700 text-lg">
            To begin the search process, please review the details below and
            confirm your request.
          </p>
          */}
        </div>

        {/* 
        --- SECTION "Lost item summary" TEMPORAIREMENT MASQUÉE ---
        <div className="space-y-6">
          <div
            className="rounded-xl border border-[#d6e7e1] py-3 text-center"
            style={{ backgroundColor: LIGHT_GREEN_BG }}
          >
            <h3 className="text-2xl font-semibold text-[#0f2b1c]">
              Lost item summary
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <ul className="space-y-3 text-gray-800 text-base flex-1">
              <li>
                <strong>
                  {formData.title
                    ? `${formData.title} lost at ${placeLabel}`
                    : `Item lost at ${placeLabel}`}
                </strong>
              </li>

              <li>
                <strong>Description:</strong> {formData.description || "—"}
              </li>

              <li>
                <strong>Date of loss:</strong> {formData.date || "—"}
                {formData.time_slot ? ` (${formData.time_slot})` : ""}
              </li>

              <li>
                <strong>City:</strong>{" "}
                {cityDisplay ||
                  [formData.city, formData.state_id].filter(Boolean).join(" ") ||
                  "—"}
              </li>

              {formData.circumstances && (
                <li>
                  <strong>ℹ️ Circumstances of loss:</strong>{" "}
                  {formData.circumstances}
                </li>
              )}
            </ul>

            {formData.object_photo && (
              <div className="flex-shrink-0 max-w-[400px] w-full">
                <p className="font-medium text-gray-800 mb-2">Uploaded image:</p>
                <div className="border rounded shadow overflow-hidden bg-white">
                  <Image
                    src={formData.object_photo}
                    alt="Lost item"
                    width={400}
                    height={300}
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        */}

        {/* Process explanation */}
        <div className="space-y-4 text-sm text-gray-700">
          {[
            {
              svg: "🗂️",
              title: "Manual verification",
              desc: "Our team reviews your report to ensure all necessary details are included.",
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
              title: "Follow-up",
              desc: "You’ll receive automatic notifications if a potential match is detected.",
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

        {/* Navigation + CTA */}
        <div className="flex justify-between items-center gap-4 pt-6">
          <button
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded"
          >
            Back
          </button>
          <button onClick={handleContinue} className={btnGreen}>
            Continue →
          </button>
        </div>
      </div>
    </section>
  );
}
