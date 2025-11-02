// lib/timezone.ts
import type { SupabaseClient } from "@supabase/supabase-js";

const STATE_TZ: Record<string, string> = {
  AK: "America/Anchorage",
  AL: "America/Chicago",
  AR: "America/Chicago",
  AZ: "America/Phoenix", // pas de DST en AZ (hors Navajo)
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DC: "America/New_York",
  DE: "America/New_York",
  FL: "America/New_York", // fallback majoritaire
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  IA: "America/Chicago",
  ID: "America/Boise",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  MA: "America/New_York",
  MD: "America/New_York",
  ME: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MO: "America/Chicago",
  MS: "America/Chicago",
  MT: "America/Denver",
  NC: "America/New_York",
  ND: "America/Chicago",
  NE: "America/Chicago",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NV: "America/Los_Angeles",
  NY: "America/New_York",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VA: "America/New_York",
  VT: "America/New_York",
  WA: "America/Los_Angeles",
  WI: "America/Chicago",
  WV: "America/New_York",
  WY: "America/Denver",
};

function normCity(raw?: string | null) {
  // Ex: "Chicago (IL)" → "Chicago"
  return String(raw ?? "").replace(/\([^)]*\)\s*$/, "").trim();
}

/**
 * Résout le fuseau horaire via la table us_cities.timezone
 * Fallback : mappage par État, sinon New_York
 */
export async function resolveTimezone(
  supabase: SupabaseClient,
  cityLabel: string | null | undefined,
  stateId: string | null | undefined
): Promise<string> {
  const state = String(stateId ?? "").trim().toUpperCase();
  const city = normCity(cityLabel);

  if (!city) return STATE_TZ[state] || "America/New_York";

  const { data, error } = await supabase
    .from("us_cities")
    .select("timezone, city, city_ascii, state_id")
    .eq("state_id", state)
    .or(`city.eq.${city},city_ascii.eq.${city}`)
    .limit(1)
    .maybeSingle();

  if (!error && data?.timezone) return data.timezone as string;

  return STATE_TZ[state] || "America/New_York";
}
