import {
  FIXTURE_STATUS,
  WILDCARD_SCOPE,
} from "../../core/entities/StatusConstants";
import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get } from "svelte/store";
import { auth_store } from "../stores/auth";
import { fetch_entities_for_type } from "./dynamicFormDataLoader";

export type JerseyOptionsResult = { jerseys: BaseEntity[] };

export async function fetch_fixtures_without_setup(
  organization_id: string,
): Promise<BaseEntity[]> {
  const [all_fixtures, existing_setups] = await Promise.all([
    fetch_entities_for_type("fixture", { organization_id }),
    fetch_entities_for_type("fixturedetailssetup", { organization_id }),
  ]);
  const fixture_ids_with_setup = new Set(
    existing_setups.map(
      (s) => (s as unknown as { fixture_id: string }).fixture_id,
    ),
  );
  const available_fixtures = all_fixtures.filter(
    (f) => !fixture_ids_with_setup.has(f.id),
  );

  console.debug("[DataLoader] Loaded fixtures without setup", {
    event: "fixtures_without_setup_loaded",
    organization_id,
    total_fixtures: all_fixtures.length,
    fixtures_with_setup: fixture_ids_with_setup.size,
    available_count: available_fixtures.length,
  });
  return available_fixtures;
}

export async function fetch_fixtures_for_rating(
  organization_id: string,
): Promise<BaseEntity[]> {
  const raw_team_id = get(auth_store).current_profile?.team_id;
  const team_id =
    raw_team_id && raw_team_id !== WILDCARD_SCOPE ? raw_team_id : null;
  const all_fixtures = await fetch_entities_for_type("fixture", {
    organization_id,
  });

  const filtered = all_fixtures.filter((f) => {
    const fixture = f as unknown as {
      status: string;
      home_team_id?: string;
      away_team_id?: string;
    };
    const is_completed = fixture.status === FIXTURE_STATUS.COMPLETED;
    const matches_team =
      !team_id ||
      fixture.home_team_id === team_id ||
      fixture.away_team_id === team_id;
    return is_completed && matches_team;
  });

  console.debug("[DataLoader] Loaded fixtures for rating", {
    event: "fixtures_loaded_for_rating",
    organization_id,
    team_id,
    total_fixtures: all_fixtures.length,
    available_count: filtered.length,
  });
  return filtered;
}

export async function fetch_filtered_jersey_options(
  field: FieldMetadata,
  fixture_id: string,
): Promise<JerseyOptionsResult> {
  const empty: JerseyOptionsResult = { jerseys: [] };
  const filter_config = field.foreign_key_filter;
  if (!filter_config) return empty;

  const fixture_use_cases_result = get_use_cases_for_entity_type("fixture");
  const jersey_use_cases_result = get_use_cases_for_entity_type("jerseycolor");
  if (!fixture_use_cases_result.success || !jersey_use_cases_result.success) {
    console.warn("[DataLoader] Missing use cases for filtered jersey options");
    return empty;
  }

  const fixture_result =
    await fixture_use_cases_result.data.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data) {
    console.warn("[DataLoader] Could not load fixture:", fixture_id);
    return empty;
  }

  const fixture = fixture_result.data as unknown as Record<string, unknown>;
  let filter_holder_id = "";
  let filter_holder_type = "";

  if (filter_config.filter_type === "team_jersey_from_fixture") {
    filter_holder_type = "team";
    filter_holder_id = (
      filter_config.team_side === "home"
        ? fixture.home_team_id
        : fixture.away_team_id
    ) as string;
  } else if (filter_config.filter_type === "official_jersey_from_competition") {
    filter_holder_type = "competition_official";
    filter_holder_id = fixture.competition_id as string;
  }

  if (!filter_holder_id) {
    console.warn("[DataLoader] No holder ID found for jersey filter");
    return empty;
  }

  const jersey_result = await jersey_use_cases_result.data.list({
    holder_type: filter_holder_type,
    holder_id: filter_holder_id,
  });
  if (!jersey_result.success) return empty;

  const data = jersey_result.data as unknown;
  const jerseys: BaseEntity[] = Array.isArray(data)
    ? (data as BaseEntity[])
    : Array.isArray((data as { items?: unknown })?.items)
      ? ((data as { items: unknown[] }).items as unknown as BaseEntity[])
      : [];

  console.debug("[DataLoader] Loaded filtered jersey options", {
    field: field.field_name,
    filter_type: filter_config.filter_type,
    holder_type: filter_holder_type,
    count: jerseys.length,
  });
  return { jerseys };
}
