import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";

export {
  compute_teams_after_exclusion,
  fetch_stages_from_competition,
  fetch_teams_excluding_player_memberships,
  fetch_teams_from_competition,
  fetch_teams_from_player_memberships,
  fetch_venue_name_for_team,
} from "./competitionTeamDataFetcher";
export { fetch_filtered_entities_for_field } from "./filteredFieldDispatcher";
export {
  fetch_fixtures_for_rating,
  fetch_fixtures_without_setup,
} from "./fixtureJerseyDataFetcher";
export {
  fetch_fixtures_from_official,
  fetch_officials_from_fixture,
} from "./officialDataFetcher";

export async function fetch_entities_for_type(
  entity_type: string,
  filter?: Record<string, string>,
  page_size: number = 1000,
): Promise<BaseEntity[]> {
  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (
    !use_cases_result.success ||
    typeof use_cases_result.data.list !== "function"
  ) {
    console.warn(
      `[DataLoader] No list method found for entity type: ${entity_type}`,
    );
    return [];
  }
  const result = await use_cases_result.data.list(filter, { page_size });
  if (!result.success) {
    const error_msg =
      "error_message" in result
        ? (result as { error_message: string }).error_message
        : "error" in result
          ? (result as { error: string }).error
          : "Unknown error";
    console.warn(`[DataLoader] Failed to load ${entity_type}:`, error_msg);
    return [];
  }
  const data = result.data as unknown;
  if (Array.isArray(data)) return data as BaseEntity[];
  if (Array.isArray((data as { items?: unknown })?.items)) {
    return (data as { items: unknown[] }).items as unknown as BaseEntity[];
  }
  return [];
}

export async function fetch_unfiltered_foreign_key_options(
  fields: FieldMetadata[],
): Promise<Record<string, BaseEntity[]>> {
  const new_options: Record<string, BaseEntity[]> = {};
  for (const field of fields) {
    if (field.field_type !== "foreign_key" || !field.foreign_key_entity)
      continue;
    if (field.foreign_key_filter) continue;
    const entities = await fetch_entities_for_type(field.foreign_key_entity);
    console.debug("[DataLoader] Loaded FK options", {
      field: field.field_name,
      count: entities.length,
    });
    new_options[field.field_name] = entities;
  }
  return new_options;
}

export async function fetch_entities_filtered_by_organization(
  entity_type: string,
  organization_id: string,
): Promise<BaseEntity[]> {
  const all_entities = await fetch_entities_for_type(entity_type);
  return all_entities.filter(
    (entity) =>
      (entity as unknown as { organization_id?: string }).organization_id ===
      organization_id,
  );
}
