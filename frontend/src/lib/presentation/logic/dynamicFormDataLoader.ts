import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { DYNAMIC_FORM_FIELD_TYPE } from "./dynamicFormConstants";
import { DYNAMIC_FORM_DATA_LOADER_EVENT } from "./dynamicFormMessages";
import { is_object_value } from "./runtimeTypeGuards";

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

const DEFAULT_ENTITY_PAGE_SIZE = 1000;

function extract_listed_entities(data: unknown): BaseEntity[] {
  if (Array.isArray(data)) return data as BaseEntity[];
  const items = is_object_value(data)
    ? (data as { items?: unknown }).items
    : void 0;
  return Array.isArray(items) ? (items as BaseEntity[]) : [];
}

export async function fetch_entities_for_type(
  entity_type: string,
  filter?: Record<string, string>,
  page_size: number = DEFAULT_ENTITY_PAGE_SIZE,
): Promise<BaseEntity[]> {
  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (!use_cases_result.success) {
    console.warn("[DataLoader] No use cases for entity type", {
      event: DYNAMIC_FORM_DATA_LOADER_EVENT.USE_CASES_MISSING,
      entity_type,
      error: use_cases_result.error,
    });
    return [];
  }
  const result = await use_cases_result.data.list(filter, { page_size });
  if (!result.success) {
    console.warn("[DataLoader] Failed to load entities", {
      event: DYNAMIC_FORM_DATA_LOADER_EVENT.ENTITY_LIST_FAILED,
      entity_type,
      error: result.error,
    });
    return [];
  }
  return extract_listed_entities(result.data);
}

export async function fetch_unfiltered_foreign_key_options(
  fields: FieldMetadata[],
): Promise<Record<string, BaseEntity[]>> {
  const new_options: Record<string, BaseEntity[]> = {};
  for (const field of fields) {
    if (
      field.field_type !== DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY ||
      !field.foreign_key_entity
    )
      continue;
    if (field.foreign_key_filter) continue;
    const entities = await fetch_entities_for_type(field.foreign_key_entity);
    console.debug("[DataLoader] Loaded FK options", {
      event: DYNAMIC_FORM_DATA_LOADER_EVENT.FOREIGN_KEY_OPTIONS_LOADED,
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
