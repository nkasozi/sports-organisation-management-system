import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureDetailsSetupUseCasesPort } from "$lib/core/interfaces/ports";
import type { FixtureLineupUseCasesPort } from "$lib/core/interfaces/ports";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports";
import type { GameOfficialRoleUseCasesPort } from "$lib/core/interfaces/ports";
import type { JerseyColorUseCasesPort } from "$lib/core/interfaces/ports";
import type { OfficialUseCasesPort } from "$lib/core/interfaces/ports";
import type { OrganizationUseCasesPort } from "$lib/core/interfaces/ports";
import type { PlayerPositionUseCasesPort } from "$lib/core/interfaces/ports";
import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports";
import type { PlayerUseCasesPort } from "$lib/core/interfaces/ports";
import type { CompetitionUseCasesPort } from "$lib/core/interfaces/ports";
import type { SportUseCasesPort } from "$lib/core/interfaces/ports";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";

type TeamLookupResult = Promise<{ success: boolean; data?: { name: string } }>;

export interface LiveGamesStartFlowDependencies {
  fixture_details_setup_use_cases: FixtureDetailsSetupUseCasesPort;
  fixture_lineup_use_cases: FixtureLineupUseCasesPort;
  membership_use_cases: PlayerTeamMembershipUseCasesPort;
  player_use_cases: PlayerUseCasesPort;
  player_position_use_cases: PlayerPositionUseCasesPort;
  fixture_use_cases: FixtureUseCasesPort;
  team_use_cases: { get_by_id(team_id: string): TeamLookupResult };
  sport_use_cases: SportUseCasesPort;
  competition_use_cases: CompetitionUseCasesPort;
  organization_use_cases: OrganizationUseCasesPort;
  jersey_color_use_cases: JerseyColorUseCasesPort;
  official_use_cases: OfficialUseCasesPort;
  game_official_role_use_cases: GameOfficialRoleUseCasesPort;
  goto(path: string): Promise<void>;
  get_current_role(): string;
  can_access_route(role: string, route: string): boolean;
  update_checks(fixture_id: string, checks: PreFlightCheck[]): void;
  set_is_starting(fixture_id: string, is_starting: boolean): void;
  delay(milliseconds: number): Promise<void>;
  check_delay_ms: number;
  restart(fixture: Fixture): Promise<void>;
}

export function replace_last_check(
  checks: PreFlightCheck[],
  next_check: PreFlightCheck,
): void {
  checks[checks.length - 1] = next_check;
}

export async function publish_checks(
  fixture_id: string,
  checks: PreFlightCheck[],
  dependencies: LiveGamesStartFlowDependencies,
): Promise<void> {
  dependencies.update_checks(fixture_id, checks);
  await dependencies.delay(dependencies.check_delay_ms);
}
