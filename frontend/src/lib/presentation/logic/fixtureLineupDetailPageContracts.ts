import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Team } from "$lib/core/entities/Team";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

export type FixtureLineupDetailOrganizationScopeState =
  | { status: "unscoped" }
  | { status: "scoped"; organization_id: string };

export type FixtureLineupDetailProfileState =
  | { status: "missing" }
  | {
      status: "present";
      organization_scope_state: FixtureLineupDetailOrganizationScopeState;
    };

export type FixtureLineupDetailTokenState =
  | { status: "missing" }
  | { status: "present"; raw_token: string };

export type FixtureLineupDetailLineupState =
  | { status: "missing" }
  | { status: "present"; lineup: FixtureLineup };

export type FixtureLineupDetailFixtureState =
  | { status: "missing" }
  | { status: "present"; fixture: Fixture };

export type FixtureLineupDetailTeamState =
  | { status: "missing" }
  | { status: "present"; team: Team };

export interface FixtureLineupDetailPageViewData {
  lineup: FixtureLineup;
  fixture_state: FixtureLineupDetailFixtureState;
  team_state: FixtureLineupDetailTeamState;
  team_players: TeamPlayer[];
  home_team_state: FixtureLineupDetailTeamState;
  away_team_state: FixtureLineupDetailTeamState;
}
