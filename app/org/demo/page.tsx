// Ancienne adresse de la démonstration. L'adresse courante est
// /lost-property/demo : elle se lit comme le service qu'on présente.
// Conservée pour les liens déjà partis dans des mails.
import { permanentRedirect } from "next/navigation";

export default function Page() {
  permanentRedirect("/lost-property/demo");
}
