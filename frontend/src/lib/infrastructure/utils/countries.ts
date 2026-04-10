import { COUNTRY_NAMES } from "./countryNamesList";

type SelectOptionLike = { value: string; label: string };

export { COUNTRY_NAMES } from "./countryNamesList";

export function get_country_names_sorted_unique(
  country_names: readonly string[] = COUNTRY_NAMES,
): string[] {
  const unique_names = new Set<string>();
  for (const name of country_names) {
    const normalized = name.trim();
    if (normalized.length === 0) continue;
    unique_names.add(normalized);
  }
  return [...unique_names].sort((a, b) => a.localeCompare(b));
}

export function build_country_select_options(
  country_names: readonly string[] = COUNTRY_NAMES,
): SelectOptionLike[] {
  return get_country_names_sorted_unique(country_names).map((name) => ({
    value: name,
    label: name,
  }));
}

export function is_country_name(
  value: string,
  country_names: readonly string[] = COUNTRY_NAMES,
): boolean {
  const normalized = value.trim();
  if (normalized.length === 0) return false;
  return country_names.some((country_name) => country_name === normalized);
}
