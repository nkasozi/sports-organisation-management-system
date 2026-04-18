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
): Promise<{
  report_data: ReturnType<typeof build_match_report_data>;
  filename: string;
}> {
  let organization_name = "SPORT-SYNC";
  if (competition?.organization_id) {
    const organization_result =
      await dependencies.organization_use_cases.get_by_id(
        competition.organization_id,
      );
    if (organization_result.success && organization_result.data)
      organization_name = organization_result.data.name.toUpperCase();
  }
  const staff_roles_result =
    await dependencies.team_staff_use_cases.list_staff_roles();
  const staff_role_name_by_id = new Map<string, string>(
    (staff_roles_result.success ? staff_roles_result.data : []).map(
      (staff_role) => [staff_role.id, staff_role.name],
    ),
  );
  const [home_staff_result, away_staff_result] = await Promise.all([
    dependencies.team_staff_use_cases.list_staff_by_team(fixture.home_team_id),
    dependencies.team_staff_use_cases.list_staff_by_team(fixture.away_team_id),
  ]);
  const build_staff_entries = (
    staff_result: typeof home_staff_result,
  ): MatchStaffEntry[] =>
    !staff_result.success || !staff_result.data
      ? []
      : staff_result.data.items.map((staff) => ({
          role: staff_role_name_by_id.get(staff.role_id) || "Staff",
          name: get_team_staff_full_name(staff),
        }));
  const card_types: CardTypeConfig[] =
    sport?.card_types?.map((card_type) => ({
      id: card_type.id,
      name: card_type.name,
      color: card_type.color,
      event_type: `${card_type.id}_card`,
    })) || [];
  const context: MatchReportBuildContext = {
    fixture,
    home_team,
    away_team,
    competition,
    home_lineup: home_players,
    away_lineup: away_players,
    assigned_officials: assigned_officials_data,
    home_staff: build_staff_entries(home_staff_result),
    away_staff: build_staff_entries(away_staff_result),
    card_types,
    organization_name,
    venue_name: venue?.name,
    organization_logo_url,
  };
  return {
    report_data: build_match_report_data(context),
    filename: generate_match_report_filename(
      home_team.name,
      away_team.name,
      fixture.scheduled_date,
    ),
  };
}
