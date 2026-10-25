import type { AsyncResult } from "../../core/types/Result";
import { reset_competition_format_repository } from "../repositories/InBrowserCompetitionFormatRepository";
import { reset_competition_repository } from "../repositories/InBrowserCompetitionRepository";
import { reset_competition_team_repository } from "../repositories/InBrowserCompetitionTeamRepository";
import { reset_fixture_details_setup_repository } from "../repositories/InBrowserFixtureDetailsSetupRepository";
import { reset_fixture_lineup_repository } from "../repositories/InBrowserFixtureLineupRepository";
import { reset_fixture_repository } from "../repositories/InBrowserFixtureRepository";
import { reset_game_event_type_repository } from "../repositories/InBrowserGameEventTypeRepository";
import { reset_game_official_role_repository } from "../repositories/InBrowserGameOfficialRoleRepository";
import { reset_jersey_color_repository } from "../repositories/InBrowserJerseyColorRepository";
import { reset_official_repository } from "../repositories/InBrowserOfficialRepository";
import { reset_organization_repository } from "../repositories/InBrowserOrganizationRepository";
import { reset_player_position_repository } from "../repositories/InBrowserPlayerPositionRepository";
import { reset_player_profile_repository } from "../repositories/InBrowserPlayerProfileRepository";
import { reset_player_repository } from "../repositories/InBrowserPlayerRepository";
import { reset_player_team_membership_repository } from "../repositories/InBrowserPlayerTeamMembershipRepository";
import { reset_profile_link_repository } from "../repositories/InBrowserProfileLinkRepository";
import { reset_qualification_repository } from "../repositories/InBrowserQualificationRepository";
import type { RepositoryWriteOrigin } from "../repositories/InBrowserRepositoryWriteOrigin";
import { reset_sport_repository } from "../repositories/InBrowserSportRepository";
import { reset_team_profile_repository } from "../repositories/InBrowserTeamProfileRepository";
import { reset_team_repository } from "../repositories/InBrowserTeamRepository";
import { reset_team_staff_repository } from "../repositories/InBrowserTeamStaffRepository";
import { reset_team_staff_role_repository } from "../repositories/InBrowserTeamStaffRoleRepository";
import { reset_venue_repository } from "../repositories/InBrowserVenueRepository";
import { CLEARED_TABLE_RESET_STEPS } from "./dataResetClearedTables";

const DataResetRepositoryEvent = {
  STEP_FAILED: "data_reset_repository_step_failed",
  REPOSITORIES_RESET: "data_reset_local_repositories_reset",
} as const;

interface RepositoryResetStep {
  table_name: string;
  reset(origin: RepositoryWriteOrigin): AsyncResult<number | boolean>;
}

const DEPENDENT_REPOSITORY_RESET_STEPS: readonly RepositoryResetStep[] = [
  { table_name: "teams", reset: reset_team_repository },
  { table_name: "competitions", reset: reset_competition_repository },
  { table_name: "players", reset: reset_player_repository },
  {
    table_name: "player_team_memberships",
    reset: reset_player_team_membership_repository,
  },
  { table_name: "officials", reset: reset_official_repository },
  { table_name: "fixtures", reset: reset_fixture_repository },
  {
    table_name: "fixture_details_setups",
    reset: reset_fixture_details_setup_repository,
  },
  { table_name: "fixture_lineups", reset: reset_fixture_lineup_repository },
  { table_name: "team_staff", reset: reset_team_staff_repository },
  { table_name: "game_event_types", reset: reset_game_event_type_repository },
  { table_name: "player_positions", reset: reset_player_position_repository },
  { table_name: "team_staff_roles", reset: reset_team_staff_role_repository },
  {
    table_name: "game_official_roles",
    reset: reset_game_official_role_repository,
  },
  {
    table_name: "competition_formats",
    reset: reset_competition_format_repository,
  },
  { table_name: "venues", reset: reset_venue_repository },
  { table_name: "jersey_colors", reset: reset_jersey_color_repository },
  { table_name: "competition_teams", reset: reset_competition_team_repository },
  { table_name: "player_profiles", reset: reset_player_profile_repository },
  { table_name: "team_profiles", reset: reset_team_profile_repository },
  { table_name: "profile_links", reset: reset_profile_link_repository },
  { table_name: "qualifications", reset: reset_qualification_repository },
  ...CLEARED_TABLE_RESET_STEPS,
];

const SEEDED_FIRST_TABLE_NAMES = ["sports", "organizations"] as const;

export function list_reset_table_names(): string[] {
  return [
    ...SEEDED_FIRST_TABLE_NAMES,
    ...DEPENDENT_REPOSITORY_RESET_STEPS.map((step) => step.table_name),
  ];
}

function log_reset_step_failure(
  table_name: string,
  origin_correlation_id: string,
  error: string,
): boolean {
  console.error("[DataReset] Repository reset step failed", {
    event: DataResetRepositoryEvent.STEP_FAILED,
    table: table_name,
    correlation_id: origin_correlation_id,
    error,
  });
  return false;
}

async function reset_sports_and_organizations(
  origin: RepositoryWriteOrigin,
  correlation_id: string,
): Promise<boolean> {
  const seeded_sports = await reset_sport_repository(origin);
  if (!seeded_sports.success)
    return log_reset_step_failure(
      "sports",
      correlation_id,
      seeded_sports.error,
    );
  const organizations = await reset_organization_repository(
    seeded_sports.data,
    origin,
  );
  return organizations.success
    ? true
    : log_reset_step_failure(
        "organizations",
        correlation_id,
        organizations.error,
      );
}

async function run_dependent_reset_steps(
  origin: RepositoryWriteOrigin,
  correlation_id: string,
): Promise<boolean> {
  for (const step of DEPENDENT_REPOSITORY_RESET_STEPS) {
    const step_result = await step.reset(origin);
    if (!step_result.success)
      return log_reset_step_failure(
        step.table_name,
        correlation_id,
        step_result.error,
      );
  }
  return true;
}

export async function reset_all_local_repositories(
  origin: RepositoryWriteOrigin,
  correlation_id: string,
): Promise<boolean> {
  if (!(await reset_sports_and_organizations(origin, correlation_id)))
    return false;
  if (!(await run_dependent_reset_steps(origin, correlation_id))) return false;
  console.log("[DataReset] Local repositories reset", {
    event: DataResetRepositoryEvent.REPOSITORIES_RESET,
    correlation_id,
  });
  return true;
}
