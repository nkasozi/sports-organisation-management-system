import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import {
  fetch_entities_for_type,
  fetch_entities_filtered_by_organization,
} from "./dynamicFormDataLoader";
import { fetch_teams_from_competition } from "./competitionTeamDataFetcher";
import {
  fetch_stages_from_competition,
  fetch_teams_from_player_memberships,
  fetch_teams_excluding_player_memberships,
} from "./competitionTeamDataFetcher";
import {
  fetch_officials_from_organization,
  fetch_officials_from_fixture,
  fetch_fixtures_from_official,
} from "./officialDataFetcher";
import {
  fetch_fixtures_without_setup,
  fetch_fixtures_for_rating,
  fetch_filtered_jersey_options,
} from "./fixtureJerseyDataFetcher";

export type FilteredFetchResult = {
  entities: BaseEntity[];
  all_competition_teams?: BaseEntity[];
  competition_team_ids?: Set<string>;
  auto_select_team_id?: string;
};

type FilterType = string | undefined;

const ORGANIZATION_ENTITY_FILTERS: Record<string, string> = {
  competitions_from_organization: "competition",
  fixtures_from_organization: "fixture",
  teams_from_organization: "team",
  players_from_organization: "player",
  lookup_from_organization: "",
  live_game_logs_from_organization: "livegamelog",
};

export async function fetch_filtered_entities_for_field(
  field: FieldMetadata,
  dependency_value: string,
  cached_players: BaseEntity[],
  form_data: Record<string, unknown>,
): Promise<FilteredFetchResult> {
  const filter_type: FilterType = field.foreign_key_filter?.filter_type;
  const exclude_field = field.foreign_key_filter?.exclude_field;
  const organization_id = form_data["organization_id"] as string | undefined;

  if (filter_type === "teams_from_competition") {
    const result = await fetch_teams_from_competition(
      dependency_value,
      form_data,
      exclude_field,
    );
    return {
      entities: result.teams,
      all_competition_teams: result.all_competition_teams,
      competition_team_ids: result.competition_team_ids,
    };
  }

  if (filter_type === "stages_from_competition") {
    return { entities: await fetch_stages_from_competition(dependency_value) };
  }

  if (filter_type === "teams_from_player_memberships") {
    const result = await fetch_teams_from_player_memberships(
      dependency_value,
      form_data[field.field_name] as string | undefined,
    );
    return {
      entities: result.teams,
      auto_select_team_id: result.auto_select_team_id,
    };
  }

  if (filter_type === "teams_excluding_player_memberships") {
    return {
      entities: await fetch_teams_excluding_player_memberships(
        dependency_value,
        cached_players,
        organization_id,
      ),
    };
  }

  if (filter_type === "officials_from_organization") {
    return {
      entities: await fetch_officials_from_organization(dependency_value),
    };
  }

  if (filter_type === "fixtures_without_setup") {
    return { entities: await fetch_fixtures_without_setup(dependency_value) };
  }

  if (filter_type === "fixtures_for_rating") {
    return { entities: await fetch_fixtures_for_rating(dependency_value) };
  }

  if (filter_type === "officials_from_fixture") {
    return {
      entities: await fetch_officials_from_fixture(
        dependency_value,
        organization_id ?? "",
      ),
    };
  }

  if (filter_type === "fixtures_from_official") {
    return {
      entities: await fetch_fixtures_from_official(
        dependency_value,
        organization_id ?? "",
      ),
    };
  }

  const org_entity_type = filter_type
    ? ORGANIZATION_ENTITY_FILTERS[filter_type]
    : undefined;
  if (org_entity_type !== undefined) {
    const resolved_type = org_entity_type || field.foreign_key_entity!;
    return {
      entities: await fetch_entities_filtered_by_organization(
        resolved_type,
        dependency_value,
      ),
    };
  }

  const jersey_result = await fetch_filtered_jersey_options(
    field,
    dependency_value,
  );
  return { entities: jersey_result.jerseys };
}
