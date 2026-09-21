// Formulaire « Found something? » : reportlost.org/campus/<slug>/found.
import FoundPage, { foundMetadata } from "@/components/orgPublic/FoundPage";

export const revalidate = 300;

export const generateMetadata = ({ params }: { params: { slug: string } }) => foundMetadata(params.slug);

export default function Page({ params }: { params: { slug: string } }) {
  return <FoundPage slug={params.slug} scope="campus" />;
}
