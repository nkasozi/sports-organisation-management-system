import type { OfficialRequirement, Sport } from "../../core/entities/Sport";

export function get_effective_official_requirements(
  sport: Sport,
  competition_overrides?: OfficialRequirement[],
): OfficialRequirement[] {
  if (!competition_overrides || competition_overrides.length === 0)
    return sport.official_requirements;
  const merged_requirements: Map<string, OfficialRequirement> = new Map();
  for (const req of sport.official_requirements) {
    merged_requirements.set(req.role_id, req);
  }
  for (const override of competition_overrides) {
    merged_requirements.set(override.role_id, override);
  }
  return Array.from(merged_requirements.values());
}

export function get_official_requirement_source(
  role_id: string,
  sport: Sport,
  competition_overrides?: OfficialRequirement[],
): "sport" | "competition" {
  if (!competition_overrides) return "sport";
  const has_competition_override = competition_overrides.some(
    (req) => req.role_id === role_id,
  );
  return has_competition_override ? "competition" : "sport";
}
