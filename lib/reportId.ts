// lib/reportId.ts
// Alphabet sans I, O, 0, 1 pour éviter les confusions visuelles.
export const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ID_LENGTH = 5; // passe à 4 ou 6 si besoin
const BASE = ALPHABET.length; // 32

/**
 * Normalise un identifiant saisi par l'utilisateur :
 * - Uppercase
 * - Ne conserve QUE les caractères présents dans l'ALPHABET (donc pas I/O/0/1)
 * - Tronque à ID_LENGTH
 */
export function normalizePublicId(value: string | null | undefined): string {
  if (!value) return "";
  const up = String(value).toUpperCase();
  let out = "";
  for (const ch of up) {
    if (ALPHABET.includes(ch)) {
      out += ch;
      if (out.length >= ID_LENGTH) break;
    }
  }
  return out;
}

/**
 * Dérive un code court lisible à partir d'un UUID :
 * - Prend les 10 premiers hex (40 bits) → entier sûr (< 2^53)
 * - Convertit en base 32 ALPHABET
 * - Rend exactement ID_LENGTH caractères
 * NB: Collision théorique possible (compression 40→25 bits). Protéger avec UNIQUE(public_id) en BDD.
 */
export function publicIdFromUuid(uuid: string | null | undefined): string {
  if (!uuid) return "";
  const cleaned = String(uuid).replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (!cleaned) return "";

  const sliceLength = ID_LENGTH * 2; // ex. 10 hex pour 5 chars
  const hex = cleaned.slice(0, sliceLength);
  if (!hex) return "";

  let numeric = Number.parseInt(hex, 16);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric)) {
    return "";
  }

  // Convertit en base "ALPHABET"
  let result = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    const remainder = numeric % BASE;
    result = ALPHABET[remainder] + result;
    numeric = Math.floor(numeric / BASE);
  }

  // Si numeric était très petit, on pad à gauche avec le premier char (A)
  return result.padStart(ID_LENGTH, ALPHABET[0]);
}
