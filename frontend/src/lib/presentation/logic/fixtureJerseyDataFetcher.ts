import {
  FOREIGN_KEY_FILTER_TEAM_SIDE,
  FOREIGN_KEY_FILTER_TYPE,
} from "$lib/presentation/logic/foreignKeyFilterConstants";
import { is_string_value } from "$lib/presentation/logic/runtimeTypeGuards";

import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "../../core/types/Result";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";

type JerseyOptionsResult = { jerseys: BaseEntity[] };

const JERSEY_HOLDER_TYPE = {
  TEAM: "team",
  COMPETITION_OFFICIAL: "competition_official",
  NONE: "",
} as const;

export {
  fetch_fixtures_for_rating,
  fetch_fixtures_without_setup,
} from "./fixtureRatingDataFetcher";

type JerseyHolder = { holder_type: string; holder_id: string };

function read_fixture_string(
  fixture: Record<string, unknown>,
  key: string,
): string {
  const value = fixture[key];
  return is_string_value(value) ? value : "";
}

function resolve_jersey_holder(
  filter_config: NonNullable<FieldMetadata["foreign_key_filter"]>,
  fixture: Record<string, unknown>,
): JerseyHolder {
  if (
    filter_config.filter_type ===
    FOREIGN_KEY_FILTER_TYPE.TEAM_JERSEY_FROM_FIXTURE
  ) {
    return {
      holder_type: JERSEY_HOLDER_TYPE.TEAM,
      holder_id: read_fixture_string(
        fixture,
        filter_config.team_side === FOREIGN_KEY_FILTER_TEAM_SIDE.HOME
          ? "home_team_id"
          : "away_team_id",
      ),
    };
  }
  return filter_config.filter_type ===
    FOREIGN_KEY_FILTER_TYPE.OFFICIAL_JERSEY_FROM_COMPETITION
    ? {
        holder_type: JERSEY_HOLDER_TYPE.COMPETITION_OFFICIAL,
        holder_id: read_fixture_string(fixture, "competition_id"),
      }
    : { holder_type: JERSEY_HOLDER_TYPE.NONE, holder_id: "" };
}

function extract_jersey_entities(data: unknown): BaseEntity[] {
  return Array.isArray(data)
    ? (data as BaseEntity[])
    : Array.isArray((data as { items?: unknown })?.items)
      ? ((data as { items: unknown[] }).items as unknown as BaseEntity[])
      : [];
}

async function load_jersey_holder_for_fixture(
  filter_config: NonNullable<FieldMetadata["foreign_key_filter"]>,
  fixture_id: string,
): Promise<JerseyHolder> {
  const missing_holder: JerseyHolder = {
    holder_type: JERSEY_HOLDER_TYPE.NONE,
    holder_id: "",
  };
  const fixture_use_cases_result = get_use_cases_for_entity_type("fixture");
  if (!fixture_use_cases_result.success) {
    console.warn("[DataLoader] Missing use cases for filtered jersey options", {
      event: "filtered_jersey_options_use_cases_missing",
      fixture_id,
    });
    return missing_holder;
  }
  const fixture_result =
    await fixture_use_cases_result.data.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data) {
    console.warn("[DataLoader] Could not load fixture", {
      event: "filtered_jersey_options_fixture_load_failed",
      fixture_id,
    });
    return missing_holder;
  }
  return resolve_jersey_holder(
    filter_config,
    fixture_result.data as unknown as Record<string, unknown>,
  );
}

async function list_jerseys_for_holder(
  holder: JerseyHolder,
  fixture_id: string,
): Promise<Result<BaseEntity[]>> {
  const jersey_use_cases_result = get_use_cases_for_entity_type("jerseycolor");
  if (!jersey_use_cases_result.success) {
    console.warn("[DataLoader] Missing use cases for filtered jersey options", {
      event: "filtered_jersey_options_use_cases_missing",
      fixture_id,
    });
    return create_failure_result(jersey_use_cases_result.error);
  }
  const jersey_result = await jersey_use_cases_result.data.list({
    holder_type: holder.holder_type,
    holder_id: holder.holder_id,
  });
  if (!jersey_result.success) {
    console.warn("[DataLoader] Failed to load filtered jersey options", {
      event: "filtered_jersey_options_load_failed",
      fixture_id,
      holder_type: holder.holder_type,
      error: jersey_result.error,
    });
    return create_failure_result(jersey_result.error);
  }
  return create_success_result(
    extract_jersey_entities(jersey_result.data as unknown),
  );
}

export async function fetch_filtered_jersey_options(
  field: FieldMetadata,
  fixture_id: string,
): Promise<JerseyOptionsResult> {
  const empty: JerseyOptionsResult = { jerseys: [] };
  const filter_config = field.foreign_key_filter;
  if (!filter_config) return empty;

  const holder = await load_jersey_holder_for_fixture(
    filter_config,
    fixture_id,
  );
  if (!holder.holder_id) {
    console.warn("[DataLoader] No holder ID found for jersey filter", {
      event: "filtered_jersey_options_holder_missing",
      fixture_id,
      filter_type: filter_config.filter_type,
    });
    return empty;
  }

  const jersey_list_result = await list_jerseys_for_holder(holder, fixture_id);
  if (!jersey_list_result.success) return empty;

  console.debug("[DataLoader] Loaded filtered jersey options", {
    event: "filtered_jersey_options_loaded",
    field: field.field_name,
    filter_type: filter_config.filter_type,
    holder_type: holder.holder_type,
    count: jersey_list_result.data.length,
  });
  return { jerseys: jersey_list_result.data };
}
