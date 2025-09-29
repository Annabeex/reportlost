// app/lost-and-found/[state]/[city]/head.tsx
import { fromCitySlug } from "@/lib/slugify";

export default function Head({ params }: { params: { state: string; city: string } }) {
  const stateUp = (params.state || "").toUpperCase();
  const cityName = fromCitySlug(decodeURIComponent(params.city || "")) || params.city || "this city";
  const title = cityName && stateUp ? `Lost & Found in ${cityName}, ${stateUp} - ReportLost.org` : "ReportLost.org";
  const canonical = `https://reportlost.org/lost-and-found/${params.state}/${params.city}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={`Report or find lost items in ${cityName}. Quick, secure and local.`} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:url" content={canonical} />
    </>
  );
}
