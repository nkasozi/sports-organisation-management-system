import type { Fixture } from "../entities/Fixture";
import type { FixtureLineup, LineupPlayer } from "../entities/FixtureLineup";
import type { Player } from "../entities/Player";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { FixtureUseCases } from "../usecases/FixtureUseCases";

export interface PreviousLineupResult {
  success: boolean;
  lineup?: FixtureLineup;
}

export async function find_previous_lineup_for_team(
  current_fixture: Fixture,
  team_id: string,
  fixture_use_cases: FixtureUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<PreviousLineupResult> {
  console.log(
    "[fixtureStartChecks] Looking for previous lineup for team:",
    team_id,
  );

  const fixtures_result = await fixture_use_cases.list({
    competition_id: current_fixture.competition_id,
    team_id,
    status: "completed",
  });
  if (!fixtures_result.success || !fixtures_result.data) {
    console.log("[fixtureStartChecks] No fixtures found or error occurred");
    return { success: false };
  }

  const completed_fixtures = (fixtures_result.data?.items ?? [])
    .filter((fixture: Fixture) => fixture.id !== current_fixture.id)
    .sort((a: Fixture, b: Fixture) => {
      const date_a = a.scheduled_date || a.created_at || "";
      const date_b = b.scheduled_date || b.created_at || "";
      return date_b.localeCompare(date_a);
    });

  if (completed_fixtures.length === 0) {
    console.log("[fixtureStartChecks] No completed fixtures found for team");
    return { success: false };
  }

  const most_recent_fixture = completed_fixtures[0];
  const lineups_result = await lineup_use_cases.list({
    fixture_id: most_recent_fixture.id,
    team_id,
  });

  if (!lineups_result.success || !lineups_result.data?.items?.length) {
    console.log(
      "[fixtureStartChecks] No lineup found for team in previous fixture",
    );
    return { success: false };
  }

  const previous_lineup = lineups_result.data!.items[0];
  console.log(
    "[fixtureStartChecks] Found previous lineup with",
    previous_lineup.selected_players.length,
    "players",
  );
  return { success: true, lineup: previous_lineup };
}

export function build_lineup_players_from_memberships(
  memberships: PlayerTeamMembership[],
  players: Player[],
  position_name_by_id: Map<string, string>,
): LineupPlayer[] {
  const player_by_id = new Map<string, Player>(players.map((p) => [p.id, p]));

  return memberships.map((membership) => {
    const player = player_by_id.get(membership.player_id);
    const position_name = player?.position_id
      ? position_name_by_id.get(player.position_id) || null
      : null;
    return {
      id: membership.player_id,
      first_name: player?.first_name || "Unknown",
      last_name: player?.last_name || "Player",
      jersey_number: membership.jersey_number ?? null,
      position: position_name,
      is_captain: false,
      is_substitute: false,
    };
  });
}
