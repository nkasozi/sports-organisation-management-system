import { is_string_value } from "$lib/presentation/logic/runtimeTypeGuards";

import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { fetch_teams_from_competition } from "./competitionTeamDataFetcher";
import {
  fetch_stages_from_competition,
  fetch_teams_excluding_player_memberships,
  fetch_teams_from_player_memberships,
} from "./competitionTeamDataFetcher";
import { fetch_entities_filtered_by_organization } from "./dynamicFormDataLoader";
import {
  ORGANIZATION_FILTER_RESOLUTION,
  resolve_organization_filter_entity_type,
} from "./filteredFieldOrganizationFilters";
import {
  fetch_filtered_jersey_options,
  fetch_fixtures_for_rating,
  fetch_fixtures_without_setup_in_competition,
} from "./fixtureJerseyDataFetcher";
import {
  fetch_fixtures_from_official,
  fetch_officials_from_fixture,
  fetch_officials_from_organization,
} from "./officialDataFetcher";

type FilteredFetchResult = {
  entities: BaseEntity[];
  all_competition_teams?: BaseEntity[];
  competition_team_ids?: Set<string>;
  auto_select_team_id?: string;
};

type FilteredFieldFetchContext = {
  field: FieldMetadata;
  dependency_value: string;
  cached_players: BaseEntity[];
  form_data: Record<string, unknown>;
  organization_id: string;
};

type FilteredFieldFetchHandler = (
  context: FilteredFieldFetchContext,
) => Promise<FilteredFetchResult>;

function read_string_form_value(
  form_data: Record<string, unknown>,
  key: string,
): string {
  const candidate = form_data[key];
  return is_string_value(candidate) ? candidate : "";
}

async function fetch_competition_team_entities(
  context: FilteredFieldFetchContext,
): Promise<FilteredFetchResult> {
  const result = await fetch_teams_from_competition(
    context.dependency_value,
    context.form_data,
    context.field.foreign_key_filter?.exclude_field,
  );
  return {
    entities: result.teams,
    all_competition_teams: result.all_competition_teams,
    competition_team_ids: result.competition_team_ids,
  };
}

async function fetch_player_membership_team_entities(
  context: FilteredFieldFetchContext,
): Promise<FilteredFetchResult> {
  const result = await fetch_teams_from_player_memberships(
    context.dependency_value,
    read_string_form_value(context.form_data, context.field.field_name),
  );
  return {
    entities: result.teams,
    auto_select_team_id: result.auto_select_team_id,
  };
}

const FILTERED_FIELD_FETCH_HANDLERS: ReadonlyMap<
  string,
  FilteredFieldFetchHandler
> = new Map<string, FilteredFieldFetchHandler>([
  ["teams_from_competition", fetch_competition_team_entities],
  [
    "stages_from_competition",
    async (context: FilteredFieldFetchContext) => ({
      entities: await fetch_stages_from_competition(context.dependency_value),
    }),
  ],
  ["teams_from_player_memberships", fetch_player_membership_team_entities],
  [
    "teams_excluding_player_memberships",
    async (context: FilteredFieldFetchContext) => ({
      entities: await fetch_teams_excluding_player_memberships(
        context.dependency_value,
        context.cached_players,
        context.organization_id,
      ),
    }),
  ],
  [
    "officials_from_organization",
    async (context: FilteredFieldFetchContext) => ({
      entities: await fetch_officials_from_organization(
        context.dependency_value,
      ),
    }),
  ],
]);

const FIXTURE_AND_OFFICIAL_FETCH_HANDLERS: ReadonlyMap<
  string,
  FilteredFieldFetchHandler
> = new Map<string, FilteredFieldFetchHandler>([
  [
    "fixtures_without_setup_in_competition",
    async (context: FilteredFieldFetchContext) => ({
      entities: await fetch_fixtures_without_setup_in_competition(
        context.dependency_value,
        context.organization_id,
      ),
    }),
  ],
  [
    "fixtures_for_rating",
    async (context: FilteredFieldFetchContext) => ({
      entities: await fetch_fixtures_for_rating(context.dependency_value),
    }),
  ],
  [
    "officials_from_fixture",
    async (context: FilteredFieldFetchContext) => ({
      entities: await fetch_officials_from_fixture(
        context.dependency_value,
        context.organization_id,
      ),
    }),
  ],
  [
    "fixtures_from_official",
    async (context: FilteredFieldFetchContext) => ({
      entities: await fetch_fixtures_from_official(
        context.dependency_value,
        context.organization_id,
      ),
    }),
  ],
]);

async function fetch_organization_or_jersey_entities(
  context: FilteredFieldFetchContext,
  filter_type: string,
): Promise<FilteredFetchResult> {
  const organization_filter = resolve_organization_filter_entity_type(
    filter_type,
    context.field,
  );
  switch (organization_filter.status) {
    case ORGANIZATION_FILTER_RESOLUTION.RESOLVED:
      return {
        entities: await fetch_entities_filtered_by_organization(
          organization_filter.entity_type,
          context.dependency_value,
        ),
      };
    case ORGANIZATION_FILTER_RESOLUTION.UNRESOLVED:
      return { entities: [] };
    case ORGANIZATION_FILTER_RESOLUTION.NOT_ORGANIZATION_FILTER:
      break;
  }
  const jersey_result = await fetch_filtered_jersey_options(
    context.field,
    context.dependency_value,
  );
  return { entities: jersey_result.jerseys };
}

export async function fetch_filtered_entities_for_field(
  field: FieldMetadata,
  dependency_value: string,
  cached_players: BaseEntity[],
  form_data: Record<string, unknown>,
): Promise<FilteredFetchResult> {
  const filter_type = field.foreign_key_filter?.filter_type || "";
  const context: FilteredFieldFetchContext = {
    field,
    dependency_value,
    cached_players,
    form_data,
    organization_id: read_string_form_value(form_data, "organization_id"),
  };
  const handler =
    FILTERED_FIELD_FETCH_HANDLERS.get(filter_type) ??
    FIXTURE_AND_OFFICIAL_FETCH_HANDLERS.get(filter_type);
  return handler
    ? handler(context)
    : fetch_organization_or_jersey_entities(context, filter_type);
}
