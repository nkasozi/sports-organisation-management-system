import { COMPETITION_DATA_LOADER_EVENTS } from "$lib/presentation/logic/competitionDataLoaderEvents";
import { is_string_value } from "$lib/presentation/logic/runtimeTypeGuards";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";

function read_home_venue_id(
  team_id: string,
  all_competition_teams: BaseEntity[],
): string {
  const selected_team = all_competition_teams.find(
    (team: BaseEntity) => team.id === team_id,
  );
  const home_venue_id = selected_team
    ? (selected_team as unknown as Record<string, unknown>).home_venue_id
    : "";
  return is_string_value(home_venue_id) ? home_venue_id : "";
}

export async function fetch_venue_name_for_team(
  team_id: string,
  all_competition_teams: BaseEntity[],
): Promise<string> {
  const home_venue_id = read_home_venue_id(team_id, all_competition_teams);
  if (!home_venue_id) return "";

  const venue_use_cases_result = get_use_cases_for_entity_type("venue");
  if (!venue_use_cases_result.success) {
    console.warn("[DataLoader] Missing venue use cases", {
      event: COMPETITION_DATA_LOADER_EVENTS.VENUE_USE_CASES_MISSING,
      team_id,
      error: venue_use_cases_result.error,
    });
    return "";
  }

  const venue_result =
    await venue_use_cases_result.data.get_by_id(home_venue_id);
  if (!venue_result.success || !venue_result.data) {
    console.warn("[DataLoader] Failed to load venue", {
      event: COMPETITION_DATA_LOADER_EVENTS.VENUE_LOAD_FAILED,
      team_id,
      venue_id: home_venue_id,
    });
    return "";
  }

  const venue_name_candidate = (
    venue_result.data as unknown as Record<string, unknown>
  ).name;
  console.debug("[DataLoader] Resolved home venue name", {
    event: COMPETITION_DATA_LOADER_EVENTS.VENUE_NAME_RESOLVED,
    team_id,
    venue_id: home_venue_id,
  });
  return is_string_value(venue_name_candidate) ? venue_name_candidate : "";
}
