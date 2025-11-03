// app/poster-preview/page.tsx
"use client";

import ReportLostPoster from "../../components/ReportLostPoster";

export default function PosterPreviewPage() {
  return (
    <div className="p-4 flex justify-center">
      <ReportLostPoster
        departmentName="Chicago North Police Department"
        url="reportlost.org/chicago-north"
        // ⬇️ Redirige vers le formulaire avec station=chicago-north
        qrValue="https://reportlost.org/report?tab=lost&station=chicago-north"
        lostSvgSrc="/search.svg"
        foundSvgSrc="/main-ouverte.svg"
        flipFoundLeft
        showDownloadButtons
      />
    </div>
  );
}
