// lib/reportId.ts
// Identifiant public court : exactement 5 CHIFFRES (00000–99999)

import crypto from "crypto";

export const ID_LENGTH = 5;

/**
 * Normalise un identifiant saisi par l'utilisateur :
 * - ne garde QUE les chiffres 0-9
 * - tronque à 5
 */
export function normalizePublicId(value: string | null | undefined): string {
  if (!value) return "";
  const digits = String(value).replace(/\D+/g, "");
  return digits.slice(0, ID_LENGTH);
}

/**
 * Code public STABLE à partir d'un UUID (v4/v7, etc.)
 * - SHA-1(uuid) -> on prend 8 hex -> int32 -> modulo 100000
 * - left-pad pour obtenir toujours 5 chiffres
 * - Stable : même UUID => même code
 */
export function publicIdFromUuid(uuid: string): string {
  try {
    const hashHex = crypto.createHash("sha1").update(String(uuid)).digest("hex");
    const n32 = parseInt(hashHex.slice(0, 8), 16);
    const num = n32 % 100000; // 0..99999
    return String(num).padStart(ID_LENGTH, "0");
  } catch {
    const num = Math.floor(Math.random() * 100000);
    return String(num).padStart(ID_LENGTH, "0");
  }
}

/** Optionnel : code aléatoire non stable (pas utilisé par défaut) */
export function randomPublicId(): string {
  const num = Math.floor(Math.random() * 100000);
  return String(num).padStart(ID_LENGTH, "0");
}

export default publicIdFromUuid;
