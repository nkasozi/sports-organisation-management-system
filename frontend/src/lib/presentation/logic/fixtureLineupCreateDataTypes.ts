import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import {
  get_competition_team_use_cases,
  get_competition_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_organization_use_cases,
  get_player_position_use_cases,
  get_player_team_membership_use_cases,
  get_player_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

import type {
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";

type FixtureLineupUseCases = ReturnType<typeof get_fixture_lineup_use_cases>;
type FixtureUseCases = ReturnType<typeof get_fixture_use_cases>;
type TeamUseCases = ReturnType<typeof get_team_use_cases>;
type PlayerUseCases = ReturnType<typeof get_player_use_cases>;
type CompetitionUseCases = ReturnType<typeof get_competition_use_cases>;
type CompetitionTeamUseCases = ReturnType<
  typeof get_competition_team_use_cases
>;
type MembershipUseCases = ReturnType<
  typeof get_player_team_membership_use_cases
>;
type PlayerPositionUseCases = ReturnType<typeof get_player_position_use_cases>;
type OrganizationUseCases = ReturnType<typeof get_organization_use_cases>;

export interface FixtureLineupCreateDependencies {
  lineup_use_cases: FixtureLineupUseCases;
  fixture_use_cases: FixtureUseCases;
  team_use_cases: TeamUseCases;
  player_use_cases: PlayerUseCases;
  competition_use_cases: CompetitionUseCases;
  competition_team_use_cases: CompetitionTeamUseCases;
  membership_use_cases: MembershipUseCases;
  player_position_use_cases: PlayerPositionUseCases;
  organization_use_cases: OrganizationUseCases;
}

export interface FixtureLineupCreateReferenceData {
  fixtures: Fixture[];
  teams: Team[];
  all_teams: Team[];
  all_competitions: Competition[];
  organizations: Organization[];
  selected_organization_state: FixtureLineupCreateOrganizationState;
  error_message: string;
}

export interface FixtureLineupCreateFixtureData {
  selected_fixture: Fixture;
  organization_id: string;
  min_players: number;
  max_players: number;
  starters_count: number;
  teams: Team[];
  available_teams: Team[];
  competition_teams_for_fixture: CompetitionTeam[];
  fixture_team_label_by_team_id: Map<string, string>;
  teams_with_existing_lineups: Map<string, string>;
  auto_selected_team_id: string;
}

export interface FixtureLineupCreateTeamData {
  selected_team_state: FixtureLineupCreateTeamState;
  team_players: TeamPlayer[];
  selected_players: CreateFixtureLineupInput["selected_players"];
  validation_error: string;
}

export function create_fixture_lineup_create_dependencies(): FixtureLineupCreateDependencies {
  return {
    lineup_use_cases: get_fixture_lineup_use_cases(),
    fixture_use_cases: get_fixture_use_cases(),
    team_use_cases: get_team_use_cases(),
    player_use_cases: get_player_use_cases(),
    competition_use_cases: get_competition_use_cases(),
    competition_team_use_cases: get_competition_team_use_cases(),
    membership_use_cases: get_player_team_membership_use_cases(),
    player_position_use_cases: get_player_position_use_cases(),
    organization_use_cases: get_organization_use_cases(),
  };
}
