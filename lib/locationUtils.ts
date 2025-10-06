export type NormalizedCity = {
  label: string;
  city: string;
  stateId: string | null;
};

const cityStatePatterns = [
  /^(.*?)[\s]*\(([A-Za-z]{2})\)$/i,
  /^(.*?)[,\s]+([A-Za-z]{2})$/i,
];

export function normalizeCityInput(raw: string | null | undefined): NormalizedCity {
  const trimmed = typeof raw === "string" ? raw.trim() : "";

  if (!trimmed) {
    return { label: "", city: "", stateId: null };
  }

  for (const pattern of cityStatePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const city = (match[1] || "").trim();
      const state = (match[2] || "").trim().toUpperCase();

      if (city) {
        return {
          label: `${city} (${state})`,
          city,
          stateId: state || null,
        };
      }
    }
  }

  return {
    label: trimmed,
    city: trimmed,
    stateId: null,
  };
}

export function formatCityWithState(
  city: string | null | undefined,
  stateId: string | null | undefined,
): string {
  const normalized = normalizeCityInput(city);
  const explicitState = typeof stateId === "string" ? stateId.trim().toUpperCase() : "";
  const finalState = explicitState || normalized.stateId || "";

  if (!normalized.city) {
    return "";
  }

  return finalState ? `${normalized.city} (${finalState})` : normalized.label;
}