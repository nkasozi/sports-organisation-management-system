import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Team } from "$lib/core/entities/Team";
import { ANY_VALUE, type UserScopeProfile } from "$lib/core/interfaces/ports";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import { load_fixture_lineup_detail_page_data } from "$lib/presentation/logic/fixtureLineupDetailPageLoad";
type FixtureLineupDetailPageDependencies = Parameters<
  typeof load_fixture_lineup_detail_page_data
>[0]["dependencies"];

interface FixtureLineupDetailPageViewData {
  lineup: FixtureLineup;
  fixture: Fixture | null;
  team: Team | null;
  team_players: TeamPlayer[];
  home_team: Team | null;
  away_team: Team | null;
}

export async function load_fixture_lineup_detail_view_data(
  lineup_id: string,
  current_profile: UserScopeProfile | null,
  dependencies: FixtureLineupDetailPageDependencies,
): Promise<
  | { success: true; data: FixtureLineupDetailPageViewData }
  | { success: false; error_message: string }
> {
  const organization_id =
    current_profile?.organization_id &&
    current_profile.organization_id !== ANY_VALUE
      ? current_profile.organization_id
      : undefined;
  const result = await load_fixture_lineup_detail_page_data({
    lineup_id,
    organization_id,
    dependencies,
  });
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error_message: result.error };
}
