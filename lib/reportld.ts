const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ID_LENGTH = 5;
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

  const sliceLength = ID_LENGTH * 2;
  const hex = cleaned.slice(0, sliceLength);
  if (!hex) return "";

  let numeric = Number.parseInt(hex, 16);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric)) {
    return "";
  }

  let result = "";
  for (let i = 0; i < ID_LENGTH; i += 1) {
    const remainder = numeric % ALPHABET.length;
    result = ALPHABET[remainder] + result;
    numeric = Math.floor(numeric / ALPHABET.length);
  }

  return result.padStart(ID_LENGTH, ALPHABET[0]);
}