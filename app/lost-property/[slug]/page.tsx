// Page publique d'un établissement hors campus : reportlost.org/lost-property/<slug>.
// « Lost property » est le terme employé par les commissariats et les réseaux de
// transport américains (Property Clerk, Lost Property Unit) : l'adresse se lit
// comme une rubrique officielle, ce qui compte le jour où un service municipal
// doit accepter de la mettre en lien depuis son propre site.
import ListPage, { listMetadata } from "@/components/orgPublic/ListPage";

export const revalidate = 60; // 1 min : les ajouts/retraits d'objets doivent apparaître vite

export const generateMetadata = ({ params }: { params: { slug: string } }) => listMetadata(params.slug);

export default function Page({ params }: { params: { slug: string } }) {
  return <ListPage slug={params.slug} scope="agency" />;
}
