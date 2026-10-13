import { get_competition_team_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import { COMPETITION_DATA_LOADER_EVENTS } from "$lib/presentation/logic/competitionDataLoaderEvents";
import { is_string_value } from "$lib/presentation/logic/runtimeTypeGuards";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { fetch_entities_for_type } from "./dynamicFormDataLoader";

export {
  fetch_teams_excluding_player_memberships,
  fetch_teams_from_player_memberships,
} from "./competitionPlayerTeamFetcher";
export { fetch_venue_name_for_team } from "./competitionTeamVenueFetcher";

type CompetitionTeamsResult = {
  teams: BaseEntity[];
  all_competition_teams: BaseEntity[];
  competition_team_ids: Set<string>;
};

function resolve_exclude_value(
  form_data: Record<string, unknown>,
  exclude_field?: string,
): string {
  const exclude_candidate = exclude_field ? form_data[exclude_field] : "";
  return is_string_value(exclude_candidate) ? exclude_candidate : "";
}

function build_competition_teams_result(
  competition_id: string,
  all_teams: BaseEntity[],
  competition_team_ids: Set<string>,
  competition_teams_count: number,
  exclusion: { exclude_field?: string; exclude_value: string },
): CompetitionTeamsResult {
  const filtered_teams = all_teams.filter((team) =>
    competition_team_ids.has(team.id),
  );
  const final_teams = exclusion.exclude_value
    ? filtered_teams.filter((team) => team.id !== exclusion.exclude_value)
    : filtered_teams;
  console.debug("[DataLoader] Loaded competition teams", {
    event: COMPETITION_DATA_LOADER_EVENTS.COMPETITION_TEAMS_LOADED,
    competition_id,
    total: competition_teams_count,
    filtered: final_teams.length,
    exclude_field: exclusion.exclude_field,
    exclude_value: exclusion.exclude_value,
  });
  return {
    teams: final_teams,
    all_competition_teams: filtered_teams,
    competition_team_ids,
  };
}

function create_empty_competition_teams_result(
  competition_team_ids: Set<string>,
): CompetitionTeamsResult {
  return { teams: [], all_competition_teams: [], competition_team_ids };
}

export async function fetch_teams_from_competition(
  competition_id: string,
  form_data: Record<string, unknown>,
  exclude_field?: string,
): Promise<CompetitionTeamsResult> {
  const comp_teams_result =
    await get_competition_team_use_cases().list_teams_in_competition(
      competition_id,
      { page_size: 100 },
    );
  if (!comp_teams_result.success) {
    console.warn("[DataLoader] Failed to load competition teams", {
      event: COMPETITION_DATA_LOADER_EVENTS.COMPETITION_TEAMS_LOAD_FAILED,
      competition_id,
      error: comp_teams_result.error,
    });
    return create_empty_competition_teams_result(new Set());
  }
  const competition_teams = comp_teams_result.data.items;
  const competition_team_ids = new Set(
    competition_teams.map((ct: { team_id: string }) => ct.team_id),
  );
  const all_teams = await fetch_entities_for_type("team");
  if (all_teams.length === 0) {
    console.warn("[DataLoader] Failed to load teams for competition", {
      event: COMPETITION_DATA_LOADER_EVENTS.TEAMS_LOAD_FAILED,
      competition_id,
    });
    return create_empty_competition_teams_result(competition_team_ids);
  }
  const exclude_value = resolve_exclude_value(form_data, exclude_field);
  return build_competition_teams_result(
    competition_id,
    all_teams,
    competition_team_ids,
    competition_teams.length,
    { exclude_field, exclude_value },
  );
}

export async function fetch_stages_from_competition(
  competition_id: string,
): Promise<BaseEntity[]> {
  return fetch_entities_for_type("competitionstage", { competition_id }, 100);
}

export function compute_teams_after_exclusion(
  all_competition_teams: BaseEntity[],
  exclude_value: string,
): BaseEntity[] {
  if (!exclude_value) return [...all_competition_teams];
  return all_competition_teams.filter((team) => team.id !== exclude_value);
}
