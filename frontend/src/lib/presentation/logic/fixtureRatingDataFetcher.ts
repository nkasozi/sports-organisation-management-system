import { get } from "svelte/store";

import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  FIXTURE_STATUS,
  WILDCARD_SCOPE,
} from "../../core/entities/StatusConstants";
import { auth_store } from "../stores/auth";
import { normalize_auth_profile_state } from "../stores/authTypes";
import { fetch_entities_for_type } from "./dynamicFormDataLoader";

const TEAM_SCOPE_STATUS = {
  ALL_TEAMS: "all_teams",
  SINGLE_TEAM: "single_team",
} as const;

type TeamScopeState =
  | { status: typeof TEAM_SCOPE_STATUS.ALL_TEAMS }
  | { status: typeof TEAM_SCOPE_STATUS.SINGLE_TEAM; team_id: string };

function create_all_teams_scope_state(): TeamScopeState {
  return { status: TEAM_SCOPE_STATUS.ALL_TEAMS };
}

function create_single_team_scope_state(team_id: string): TeamScopeState {
  return { status: TEAM_SCOPE_STATUS.SINGLE_TEAM, team_id };
}

function create_team_scope_state(
  raw_team_id: string | undefined,
): TeamScopeState {
  if (!raw_team_id || raw_team_id === WILDCARD_SCOPE) {
    return create_all_teams_scope_state();
  }

  return create_single_team_scope_state(raw_team_id);
}

export function fetch_fixtures_without_setup_in_competition(
  competition_id: string,
  organization_id: string,
): Promise<BaseEntity[]> {
  return fetch_fixtures_without_setup(organization_id, { competition_id });
}

export async function fetch_fixtures_without_setup(
  organization_id: string,
  fixture_filter: Record<string, string> = { organization_id },
): Promise<BaseEntity[]> {
  const [all_fixtures, existing_setups] = await Promise.all([
    fetch_entities_for_type("fixture", fixture_filter),
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
  const current_profile_state = normalize_auth_profile_state(
    get(auth_store).current_profile,
  );
  const team_scope = create_team_scope_state(
    current_profile_state.status === PRESENCE_STATUS.PRESENT
      ? current_profile_state.profile.team_id
      : void 0,
  );
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
      team_scope.status === TEAM_SCOPE_STATUS.ALL_TEAMS ||
      fixture.home_team_id === team_scope.team_id ||
      fixture.away_team_id === team_scope.team_id;
    return is_completed && matches_team;
  });

  console.debug("[DataLoader] Loaded fixtures for rating", {
    event: "fixtures_loaded_for_rating",
    organization_id,
    team_scope,
    total_fixtures: all_fixtures.length,
    available_count: filtered.length,
  });
  return filtered;
}
