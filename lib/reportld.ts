const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ID_LENGTH = 5;
const BASE = BigInt(ALPHABET.length);

export function normalizePublicId(value: string | null | undefined) {
  if (!value) return "";
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ID_LENGTH);
}

export function publicIdFromUuid(uuid: string | null | undefined) {
  if (!uuid) return "";
  const cleaned = String(uuid).replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (!cleaned) return "";

  const hex = cleaned.slice(0, 12);
  let numeric = BigInt("0x" + hex);

  let result = "";
  for (let i = 0; i < ID_LENGTH; i += 1) {
    const remainder = Number(numeric % BASE);
    result = ALPHABET[remainder] + result;
    numeric = numeric / BASE;
  }

  return result.padStart(ID_LENGTH, ALPHABET[0]);
}