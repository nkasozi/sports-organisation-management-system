import { COMPETITION_DATA_LOADER_EVENTS } from "$lib/presentation/logic/competitionDataLoaderEvents";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { fetch_entities_for_type } from "./dynamicFormDataLoader";

type PlayerMembershipTeamsResult = {
  teams: BaseEntity[];
  auto_select_team_id?: string;
};

export async function fetch_teams_from_player_memberships(
  player_id: string,
  field_current_value: string,
): Promise<PlayerMembershipTeamsResult> {
  const [memberships, all_teams] = await Promise.all([
    fetch_entities_for_type("playerteammembership", { player_id }),
    fetch_entities_for_type("team"),
  ]);
  const player_team_ids = new Set(
    memberships.map((m) => (m as unknown as { team_id: string }).team_id),
  );
  const membership_teams = all_teams.filter((team) =>
    player_team_ids.has(team.id),
  );

  console.debug("[DataLoader] Loaded player membership teams", {
    event: COMPETITION_DATA_LOADER_EVENTS.PLAYER_MEMBERSHIP_TEAMS_LOADED,
    player_id,
    total_memberships: memberships.length,
    team_count: membership_teams.length,
  });
  const auto_select_team_id =
    membership_teams.length > 0 && !field_current_value
      ? membership_teams[0].id
      : void 0;
  return { teams: membership_teams, auto_select_team_id };
}

interface TeamAvailabilityCriteria {
  organization_id: string;
  player_team_ids: Set<string>;
  player_gender_id: string;
}

function is_team_available_for_player(
  team: BaseEntity,
  criteria: TeamAvailabilityCriteria,
): boolean {
  const t = team as unknown as {
    organization_id?: string;
    gender_id?: string;
  };
  const is_in_org =
    !criteria.organization_id || t.organization_id === criteria.organization_id;
  const is_not_player_team = !criteria.player_team_ids.has(team.id);
  const is_matching_gender =
    !criteria.player_gender_id ||
    !t.gender_id ||
    t.gender_id === criteria.player_gender_id;
  return is_in_org && is_not_player_team && is_matching_gender;
}

export async function fetch_teams_excluding_player_memberships(
  player_id: string,
  cached_players: BaseEntity[],
  organization_id: string,
): Promise<BaseEntity[]> {
  const [memberships, all_teams] = await Promise.all([
    fetch_entities_for_type("playerteammembership", { player_id }),
    fetch_entities_for_type("team"),
  ]);
  const player_team_ids = new Set(
    memberships.map((m) => (m as unknown as { team_id: string }).team_id),
  );
  const selected_player = cached_players.find((p) => p.id === player_id);
  const player_gender_id = (
    selected_player as unknown as { gender_id?: string }
  )?.gender_id;
  console.debug("[DataLoader] Resolved player gender from cache", {
    event: COMPETITION_DATA_LOADER_EVENTS.PLAYER_GENDER_RESOLVED,
    player_id,
    player_found: !!selected_player,
    player_gender_id,
  });
  const available_teams = all_teams.filter((team) =>
    is_team_available_for_player(team, {
      organization_id,
      player_team_ids,
      player_gender_id: player_gender_id ?? "",
    }),
  );
  console.debug("[DataLoader] Loaded teams excluding player memberships", {
    event: COMPETITION_DATA_LOADER_EVENTS.AVAILABLE_PLAYER_TEAMS_LOADED,
    player_id,
    player_gender_id,
    total_memberships: memberships.length,
    total_teams: all_teams.length,
    available_count: available_teams.length,
  });
  return available_teams;
}
