import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

const ORGANIZATION_ENTITY_FILTERS: Record<string, string> = {
  competitions_from_organization: "competition",
  fixtures_from_organization: "fixture",
  teams_from_organization: "team",
  players_from_organization: "player",
  lookup_from_organization: "",
  live_game_logs_from_organization: "livegamelog",
};

export const ORGANIZATION_FILTER_RESOLUTION = {
  NOT_ORGANIZATION_FILTER: "not_organization_filter",
  RESOLVED: "resolved",
  UNRESOLVED: "unresolved",
} as const;

type OrganizationFilterResolution =
  | { status: typeof ORGANIZATION_FILTER_RESOLUTION.NOT_ORGANIZATION_FILTER }
  | { status: typeof ORGANIZATION_FILTER_RESOLUTION.UNRESOLVED }
  | {
      status: typeof ORGANIZATION_FILTER_RESOLUTION.RESOLVED;
      entity_type: string;
    };

export function resolve_organization_filter_entity_type(
  filter_type: string,
  field: FieldMetadata,
): OrganizationFilterResolution {
  if (
    !Object.prototype.hasOwnProperty.call(
      ORGANIZATION_ENTITY_FILTERS,
      filter_type,
    )
  )
    return {
      status: ORGANIZATION_FILTER_RESOLUTION.NOT_ORGANIZATION_FILTER,
    };
  const resolved_type =
    ORGANIZATION_ENTITY_FILTERS[filter_type] || field.foreign_key_entity || "";
  if (resolved_type)
    return {
      status: ORGANIZATION_FILTER_RESOLUTION.RESOLVED,
      entity_type: resolved_type,
    };
  console.warn("[DataLoader] No entity type for organization filter", {
    event: "filtered_field_entity_type_missing",
    field: field.field_name,
    filter_type,
  });
  return { status: ORGANIZATION_FILTER_RESOLUTION.UNRESOLVED };
}
