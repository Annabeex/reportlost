// lib/anthropicText.ts
//
// Extrait le texte d'une réponse de l'API Anthropic.
//
// Pourquoi ce helper : le code lisait partout `data.content[0].text`, c'est-à-dire
// le PREMIER bloc seulement. Ça marche avec Haiku, qui ne renvoie qu'un bloc de
// texte. Les modèles plus récents peuvent renvoyer un bloc `thinking` AVANT le
// texte : `content[0].text` vaut alors undefined et la réponse part vide, sans
// erreur et sans trace — l'agent « Qui contacter ? » rendrait une page blanche.
//
// On concatène donc tous les blocs de type "text", quel que soit le modèle.

export function texteAnthropic(data: any): string {
  const blocs = Array.isArray(data?.content) ? data.content : [];
  const texte = blocs
    .filter((b: any) => b?.type === "text" && typeof b?.text === "string")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
  // Filet pour une forme de réponse inattendue : on retombe sur l'ancien accès.
  return texte || String(data?.content?.[0]?.text ?? "");
}
