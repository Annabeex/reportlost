// lib/extractJson.ts
//
// Extraction du premier objet (ou tableau) JSON complet dans une réponse de
// modèle. Remplace le motif `txt.match(/\{[\s\S]*\}/)` utilisé jusqu'ici, qui
// est GLOUTON : il capture du premier `{` jusqu'au DERNIER `}` du texte. Dès
// que la réponse contient deux blocs JSON, ou du texte avec des accolades
// après le JSON, on obtient « Unexpected non-whitespace character after JSON ».
//
// Ici on équilibre les accolades en tenant compte des chaînes et des
// échappements, donc on s'arrête sur le premier objet réellement complet.

function stripFences(s: string): string {
  return String(s || "")
    .replace(/^﻿/, "")
    .replace(/```(?:json|JSON)?\s*/g, "")
    .replace(/```/g, "")
    .trim();
}

/** Borne du premier objet/tableau complet à partir de `from`. */
function findBalanced(s: string, from: number): string | null {
  const open = s[from];
  const close = open === "{" ? "}" : open === "[" ? "]" : "";
  if (!close) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = from; i < s.length; i++) {
    const c = s[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') inString = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return s.slice(from, i + 1);
    }
  }
  return null; // réponse tronquée : accolade jamais refermée
}

export type ExtractResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Renvoie le premier objet JSON valide du texte.
 * `error` est explicite : c'est lui qui s'affichera dans l'admin.
 */
export function extractJson<T = any>(raw: string): ExtractResult<T> {
  const s = stripFences(raw);
  if (!s) return { ok: false, error: "réponse vide du modèle" };

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== "{" && c !== "[") continue;

    const candidate = findBalanced(s, i);
    if (!candidate) {
      // Une ouverture sans fermeture, c'est presque toujours une réponse
      // coupée par max_tokens. Le dire plutôt que de renvoyer un objet vide.
      return {
        ok: false,
        error: "réponse JSON incomplète (probablement tronquée : augmenter max_tokens)",
      };
    }
    try {
      return { ok: true, value: JSON.parse(candidate) as T };
    } catch {
      // Ce n'était pas un JSON valide : on cherche l'ouverture suivante.
      continue;
    }
  }
  return { ok: false, error: "aucun JSON trouvé dans la réponse du modèle" };
}

/** Variante tolérante : renvoie `fallback` au lieu d'une erreur. */
export function extractJsonOr<T>(raw: string, fallback: T): T {
  const r = extractJson<T>(raw);
  return r.ok ? r.value : fallback;
}
