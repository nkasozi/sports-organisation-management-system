import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import { get_team_staff_full_name } from "$lib/core/entities/TeamStaff";
import type { Venue } from "$lib/core/entities/Venue";
import type {
  CardTypeConfig,
  MatchStaffEntry,
} from "$lib/core/types/MatchReportTypes";
import {
  get_organization_use_cases,
  get_team_staff_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";
import {
  build_match_report_data,
  generate_match_report_filename,
  type MatchReportBuildContext,
} from "$lib/infrastructure/utils/MatchReportBuilder";

type OrganizationUseCases = ReturnType<typeof get_organization_use_cases>;
type TeamStaffUseCases = ReturnType<typeof get_team_staff_use_cases>;

interface LiveGameDetailReportDependencies {
  organization_use_cases: OrganizationUseCases;
  team_staff_use_cases: TeamStaffUseCases;
}

type LiveGameDetailReportOutput = {
  report_data: ReturnType<typeof build_match_report_data>;
  filename: string;
};

type StaffListResult = Awaited<
  ReturnType<TeamStaffUseCases["list_staff_by_team"]>
>;

const DEFAULT_ORGANIZATION_NAME = "SPORT-SYNC";
const DEFAULT_STAFF_ROLE_NAME = "Staff";

async function load_report_organization_name(
  competition: Competition | undefined,
  dependencies: LiveGameDetailReportDependencies,
): Promise<string> {
  if (!competition?.organization_id) return DEFAULT_ORGANIZATION_NAME;
  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      competition.organization_id,
    );
  return organization_result.success && organization_result.data
    ? organization_result.data.name.toUpperCase()
    : DEFAULT_ORGANIZATION_NAME;
}

function build_staff_entries(
  staff_result: StaffListResult,
  staff_role_name_by_id: Map<string, string>,
): MatchStaffEntry[] {
  return !staff_result.success || !staff_result.data
    ? []
    : staff_result.data.items.map((staff) => ({
        role:
          staff_role_name_by_id.get(staff.role_id) || DEFAULT_STAFF_ROLE_NAME,
        name: get_team_staff_full_name(staff),
      }));
}

const REPORT_STAFF_ROLES_UNAVAILABLE_EVENT =
  "live_game_report_staff_roles_unavailable";

async function load_report_staff(
  fixture: Fixture,
  dependencies: LiveGameDetailReportDependencies,
): Promise<{ home_staff: MatchStaffEntry[]; away_staff: MatchStaffEntry[] }> {
  const staff_roles_result =
    await dependencies.team_staff_use_cases.list_staff_roles();
  if (!staff_roles_result.success) {
    console.warn("[LiveGameDetail] Staff roles unavailable for report", {
      event: REPORT_STAFF_ROLES_UNAVAILABLE_EVENT,
      fixture_id: fixture.id,
      error: staff_roles_result.error,
    });
  }
  const staff_role_name_by_id = new Map<string, string>(
    (staff_roles_result.success ? staff_roles_result.data : []).map(
      (staff_role) => [staff_role.id, staff_role.name],
    ),
  );
  const [home_staff_result, away_staff_result] = await Promise.all([
    dependencies.team_staff_use_cases.list_staff_by_team(fixture.home_team_id),
    dependencies.team_staff_use_cases.list_staff_by_team(fixture.away_team_id),
  ]);
  return {
    home_staff: build_staff_entries(home_staff_result, staff_role_name_by_id),
    away_staff: build_staff_entries(away_staff_result, staff_role_name_by_id),
  };
}

function build_report_card_types(sport: Sport | undefined): CardTypeConfig[] {
  return (
    sport?.card_types?.map((card_type) => ({
      id: card_type.id,
      name: card_type.name,
      color: card_type.color,
      event_type: `${card_type.id}_card`,
    })) || []
  );
}

function build_report_output(
  context: MatchReportBuildContext,
  home_team: Team,
  away_team: Team,
): LiveGameDetailReportOutput {
  return {
    report_data: build_match_report_data(context),
    filename: generate_match_report_filename(
      home_team.name,
      away_team.name,
      context.fixture.scheduled_date,
    ),
  };
}

export async function build_live_game_detail_report(
  fixture: Fixture,
  competition: Competition | undefined,
  sport: Sport | undefined,
  home_team: Team,
  away_team: Team,
  venue: Venue | undefined,
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
  assigned_officials_data: Array<{ official: Official; role_name: string }>,
  organization_logo_url: string,
  dependencies: LiveGameDetailReportDependencies,
): Promise<LiveGameDetailReportOutput> {
  const organization_name = await load_report_organization_name(
    competition,
    dependencies,
  );
  const staff = await load_report_staff(fixture, dependencies);
  const context: MatchReportBuildContext = {
    fixture,
    home_team,
    away_team,
    competition,
    home_lineup: home_players,
    away_lineup: away_players,
    assigned_officials: assigned_officials_data,
    home_staff: staff.home_staff,
    away_staff: staff.away_staff,
    card_types: build_report_card_types(sport),
    organization_name,
    venue_name: venue?.name,
    organization_logo_url,
  };
  return build_report_output(context, home_team, away_team);
}
