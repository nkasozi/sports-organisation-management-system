import { get_competition_team_use_cases } from "$lib/infrastructure/registry/useCaseFactories";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { fetch_entities_for_type } from "./dynamicFormDataLoader";

export type CompetitionTeamsResult = {
  teams: BaseEntity[];
  all_competition_teams: BaseEntity[];
  competition_team_ids: Set<string>;
};

export type PlayerMembershipTeamsResult = {
  teams: BaseEntity[];
  auto_select_team_id?: string;
};

export async function fetch_teams_from_competition(
  competition_id: string,
  form_data: Record<string, unknown>,
  exclude_field?: string,
): Promise<CompetitionTeamsResult> {
  const empty_result: CompetitionTeamsResult = {
    teams: [],
    all_competition_teams: [],
    competition_team_ids: new Set(),
  };
  const competition_team_use_cases = get_competition_team_use_cases();
  const comp_teams_result =
    await competition_team_use_cases.list_teams_in_competition(competition_id, {
      page_size: 100,
    });

  if (!comp_teams_result.success) {
    console.warn(
      "[DataLoader] Failed to load competition teams:",
      competition_id,
    );
    return empty_result;
  }

  const competition_teams = comp_teams_result.data.items;
  const competition_team_ids = new Set(
    competition_teams.map((ct: { team_id: string }) => ct.team_id),
  );
  const all_teams = await fetch_entities_for_type("team");
  if (all_teams.length === 0) {
    console.warn(
      "[DataLoader] Failed to load teams for competition:",
      competition_id,
    );
    return { ...empty_result, competition_team_ids };
  }

  const filtered_teams = all_teams.filter((team) =>
    competition_team_ids.has(team.id),
  );
  const exclude_value = exclude_field ? form_data[exclude_field] : null;
  const final_teams = exclude_value
    ? filtered_teams.filter((team) => team.id !== exclude_value)
    : filtered_teams;

  console.debug("[DataLoader] Loaded competition teams", {
    competition_id,
    total: competition_teams.length,
    filtered: final_teams.length,
    exclude_field,
    exclude_value,
  });
  return {
    teams: final_teams,
    all_competition_teams: filtered_teams,
    competition_team_ids,
  };
}

export async function fetch_stages_from_competition(
  competition_id: string,
): Promise<BaseEntity[]> {
  return fetch_entities_for_type("competitionstage", { competition_id }, 100);
}

export async function fetch_teams_from_player_memberships(
  player_id: string,
  field_current_value: string | undefined,
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
    player_id,
    total_memberships: memberships.length,
    team_count: membership_teams.length,
  });
  const auto_select_team_id =
    membership_teams.length > 0 && !field_current_value
      ? membership_teams[0].id
      : undefined;
  return { teams: membership_teams, auto_select_team_id };
}

export async function fetch_teams_excluding_player_memberships(
  player_id: string,
  cached_players: BaseEntity[],
  organization_id: string | undefined,
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
    player_id,
    player_found: !!selected_player,
    player_gender_id,
  });

  const available_teams = all_teams.filter((team) => {
    const t = team as unknown as {
      organization_id?: string;
      gender_id?: string;
    };
    const is_in_org = !organization_id || t.organization_id === organization_id;
    const is_not_player_team = !player_team_ids.has(team.id);
    const is_matching_gender =
      !player_gender_id || !t.gender_id || t.gender_id === player_gender_id;
    return is_in_org && is_not_player_team && is_matching_gender;
  });

  console.debug("[DataLoader] Loaded teams excluding player memberships", {
    player_id,
    player_gender_id,
    total_memberships: memberships.length,
    total_teams: all_teams.length,
    available_count: available_teams.length,
  });
  return available_teams;
}

export function compute_teams_after_exclusion(
  all_competition_teams: BaseEntity[],
  exclude_value: string | null,
): BaseEntity[] {
  if (!exclude_value) return [...all_competition_teams];
  return all_competition_teams.filter((team) => team.id !== exclude_value);
}

export async function fetch_venue_name_for_team(
  team_id: string,
  all_competition_teams: BaseEntity[],
): Promise<string | null> {
  const selected_team = all_competition_teams.find(
    (team) => team.id === team_id,
  ) as { home_venue_id?: string } | undefined;
  if (!selected_team?.home_venue_id) return null;

  const venue_use_cases_result = get_use_cases_for_entity_type("venue");
  if (!venue_use_cases_result.success) {
    console.warn("[DataLoader] Missing venue use cases");
    return null;
  }

  const venue_result = await venue_use_cases_result.data.get_by_id(
    selected_team.home_venue_id,
  );
  if (!venue_result.success || !venue_result.data) {
    console.warn(
      "[DataLoader] Failed to load venue:",
      selected_team.home_venue_id,
    );
    return null;
  }

  const venue_name = (venue_result.data as { name?: string }).name ?? null;
  console.debug("[DataLoader] Resolved home venue name:", venue_name);
  return venue_name;
}
