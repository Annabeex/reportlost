// Page publique d'un établissement : reportlost.org/campus/<slug>.
// Les écrans du portail (login, dashboard…) sont des segments fixes du même
// dossier : Next les sert en priorité, et ces noms sont interdits comme slug.
import ListPage, { listMetadata } from "@/components/orgPublic/ListPage";

export const revalidate = 60; // 1 min : les ajouts/retraits d'objets doivent apparaître vite

export const generateMetadata = ({ params }: { params: { slug: string } }) => listMetadata(params.slug);

export default function Page({ params }: { params: { slug: string } }) {
  return <ListPage slug={params.slug} scope="campus" />;
}
