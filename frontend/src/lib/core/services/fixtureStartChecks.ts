import type { Fixture } from "../entities/Fixture";
import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { PlayerTeamMembershipUseCases } from "../usecases/PlayerTeamMembershipUseCases";
import type { PlayerUseCases } from "../usecases/PlayerUseCases";
import type { PlayerPositionUseCases } from "../usecases/PlayerPositionUseCases";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";
import type {
  CreateFixtureLineupInput,
  LineupPlayer,
} from "../entities/FixtureLineup";
import type { Player } from "../entities/Player";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type { PlayerPosition } from "../entities/PlayerPosition";

export type CheckStatus = "pending" | "checking" | "passed" | "failed";

export interface PreFlightCheck {
  check_name: string;
  status: CheckStatus;
  message: string;
  fix_suggestion: string | null;
}

export interface FixtureCanStartResult {
  can_start: boolean;
  officials_check: PreFlightCheck;
  home_lineup_check: PreFlightCheck;
  away_lineup_check: PreFlightCheck;
}

export interface LineupGenerationResult {
  success: boolean;
  lineup?: CreateFixtureLineupInput;
  error_message?: string | null;
  fix_suggestion?: string | null;
}

export async function check_fixture_can_start(
  fixture: Fixture,
  official_use_cases: FixtureDetailsSetupUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<FixtureCanStartResult> {
  if (!fixture.id) {
    throw new Error("Fixture must have an ID");
  }

  console.log("[DEBUG fixtureStartChecks] Checking fixture:", fixture.id);
  const officials_result = await official_use_cases.list_by_fixture(fixture.id);
  console.log("[DEBUG fixtureStartChecks] officials_result:", officials_result);
  const officials =
    officials_result.success && officials_result.data
      ? officials_result.data.items
      : [];
  console.log(
    "[DEBUG fixtureStartChecks] officials array length:",
    officials.length,
  );
  console.log("[DEBUG fixtureStartChecks] officials:", officials);

  const officials_check: PreFlightCheck = {
    check_name: "officials",
    status: officials.length > 0 ? "passed" : "failed",
    message:
      officials.length > 0
        ? `${officials.length} official(s) assigned`
        : "No officials assigned to this fixture",
    fix_suggestion:
      officials.length > 0
        ? null
        : "Go to the Fixture Details Setup page and assign officials, team jerseys and official jerseys for this fixture",
  };

  const lineups_result = await lineup_use_cases.list({
    fixture_id: fixture.id,
  });
  const lineups = lineups_result.data || [];

  const home_lineup = lineups.find(
    (l: any) => l.team_id === fixture.home_team_id,
  );
  const away_lineup = lineups.find(
    (l: any) => l.team_id === fixture.away_team_id,
  );

  const home_lineup_check: PreFlightCheck = {
    check_name: "home_lineup",
    status:
      home_lineup &&
      (home_lineup.status === "submitted" || home_lineup.status === "locked")
        ? "passed"
        : "failed",
    message:
      home_lineup &&
      (home_lineup.status === "submitted" || home_lineup.status === "locked")
        ? `Home team lineup submitted with ${home_lineup.selected_players.length} players`
        : home_lineup
          ? `Home team lineup exists but not submitted (status: ${home_lineup.status})`
          : "No home team lineup found",
    fix_suggestion:
      home_lineup &&
      (home_lineup.status === "submitted" || home_lineup.status === "locked")
        ? null
        : "Submit the lineup in Team Fixture Lineups page",
  };

  const away_lineup_check: PreFlightCheck = {
    check_name: "away_lineup",
    status:
      away_lineup &&
      (away_lineup.status === "submitted" || away_lineup.status === "locked")
        ? "passed"
        : "failed",
    message:
      away_lineup &&
      (away_lineup.status === "submitted" || away_lineup.status === "locked")
        ? `Away team lineup submitted with ${away_lineup.selected_players.length} players`
        : away_lineup
          ? `Away team lineup exists but not submitted (status: ${away_lineup.status})`
          : "No away team lineup found",
    fix_suggestion:
      away_lineup &&
      (away_lineup.status === "submitted" || away_lineup.status === "locked")
        ? null
        : "Submit the lineup in Team Fixture Lineups page",
  };

  return {
    can_start:
      officials_check.status === "passed" &&
      home_lineup_check.status === "passed" &&
      away_lineup_check.status === "passed",
    officials_check,
    home_lineup_check,
    away_lineup_check,
  };
}

export async function auto_generate_lineups_if_possible(
  fixture: Fixture,
  team_id: string,
  team_name: string,
  membership_use_cases: PlayerTeamMembershipUseCases,
  player_use_cases: PlayerUseCases,
  player_position_use_cases: PlayerPositionUseCases,
  lineup_use_cases: FixtureLineupUseCases,
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<LineupGenerationResult> {
  console.log(
    "[fixtureStartChecks] auto_generate_lineups_if_possible called for team:",
    team_id,
    "team_name:",
    team_name,
    "fixture:",
    fixture.id,
  );

  if (!fixture.id) {
    console.log("[fixtureStartChecks] ERROR: Fixture must have an ID");
    return {
      success: false,
      error_message: "Fixture must have an ID",
    };
  }

  const rules_result = await get_player_rules_from_competition(
    fixture.competition_id,
    competition_use_cases,
    organization_use_cases,
    sport_use_cases,
  );

  if (!rules_result.success) {
    console.log(
      "[fixtureStartChecks] ERROR: Failed to get player rules:",
      rules_result.error_message,
    );
    return {
      success: false,
      error_message: rules_result.error_message,
    };
  }

  const { min_players, max_players } = rules_result;
  console.log(
    "[fixtureStartChecks] Player rules - min:",
    min_players,
    "max:",
    max_players,
  );

  const memberships_result = await membership_use_cases.list({
    team_id,
    status: "active",
  });

  const active_memberships = (memberships_result.data || []).filter(
    (m: PlayerTeamMembership) => m.status === "active",
  );

  console.log(
    "[fixtureStartChecks] Found",
    active_memberships.length,
    "active memberships for team:",
    team_id,
  );

  const player_count = active_memberships.length;

  if (player_count < min_players) {
    console.log(
      "[fixtureStartChecks] ERROR: Not enough players -",
      player_count,
      "< min",
      min_players,
    );
    return {
      success: false,
      error_message: `${team_name} has only ${player_count} active player(s), but minimum is ${min_players}`,
      fix_suggestion: `Go to Player Team Memberships page and add more players to ${team_name} (need at least ${min_players - player_count} more)`,
    };
  }

  if (player_count > max_players) {
    console.log(
      "[fixtureStartChecks] ERROR: Too many players -",
      player_count,
      "> max",
      max_players,
    );
    return {
      success: false,
      error_message: `${team_name} has ${player_count} active players, but maximum is ${max_players}`,
      fix_suggestion: `Go to Team Fixture Lineups page and manually select which players from ${team_name} should be in the lineup`,
    };
  }

  const player_ids = active_memberships.map(
    (m: PlayerTeamMembership) => m.player_id,
  );
  console.log(
    "[fixtureStartChecks] Fetching player details for player_ids:",
    player_ids,
  );

  const player_promises = player_ids.map((player_id: string) =>
    player_use_cases.get_by_id(player_id),
  );
  const player_results = await Promise.all(player_promises);

  const players: Player[] = player_results
    .filter((result) => result.success && result.data)
    .map((result) => result.data as Player);

  console.log(
    "[fixtureStartChecks] Fetched",
    players.length,
    "player entities",
  );

  const positions_result = await player_position_use_cases.list(undefined, {
    page_number: 1,
    page_size: 100,
  });
  const positions = positions_result.data || [];
  console.log(
    "[fixtureStartChecks] Fetched",
    positions.length,
    "player positions",
  );

  const position_name_by_id = new Map<string, string>(
    positions.map((p: PlayerPosition) => [p.id, p.name]),
  );

  const selected_players: LineupPlayer[] =
    build_lineup_players_from_memberships(
      active_memberships,
      players,
      position_name_by_id,
    );

  console.log(
    "[fixtureStartChecks] Built",
    selected_players.length,
    "lineup players",
  );
  console.log(
    "[fixtureStartChecks] Sample lineup players:",
    selected_players
      .slice(0, 2)
      .map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` })),
  );

  const lineup: CreateFixtureLineupInput = {
    fixture_id: fixture.id,
    team_id,
    selected_players,
    status: "submitted",
    submitted_by: "auto-generated",
    submitted_at: new Date().toISOString(),
    notes: "Auto-generated lineup",
  };

  console.log(
    "[fixtureStartChecks] Creating lineup with",
    selected_players.length,
    "players",
  );
  const create_result = await lineup_use_cases.create(lineup);

  if (!create_result.success) {
    console.log(
      "[fixtureStartChecks] ERROR: Failed to create lineup:",
      create_result.error_message,
    );
    return {
      success: false,
      error_message: create_result.error_message || "Failed to create lineup",
    };
  }

  console.log(
    "[fixtureStartChecks] SUCCESS: Lineup created for team:",
    team_name,
  );
  return {
    success: true,
    lineup,
  };
}

function build_lineup_players_from_memberships(
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

interface PlayerRulesResult {
  success: boolean;
  min_players: number;
  max_players: number;
  error_message?: string;
}

async function get_player_rules_from_competition(
  competition_id: string,
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<PlayerRulesResult> {
  const competition_result =
    await competition_use_cases.get_by_id(competition_id);

  if (!competition_result.success || !competition_result.data) {
    console.error("[DEBUG] Could not load competition:", competition_id);
    return {
      success: false,
      min_players: 0,
      max_players: 99,
      error_message: "Could not load competition",
    };
  }

  const competition = competition_result.data;
  const rule_overrides = competition.rule_overrides;

  const has_competition_min_players =
    rule_overrides?.min_players_on_field !== undefined;
  const has_competition_max_players =
    rule_overrides?.max_players_on_field !== undefined;

  if (has_competition_min_players && has_competition_max_players) {
    console.log("[DEBUG] Using competition rule overrides for player limits");
    return {
      success: true,
      min_players: rule_overrides.min_players_on_field!,
      max_players: rule_overrides.max_players_on_field!,
    };
  }

  const org_result = await organization_use_cases.get_by_id(
    competition.organization_id,
  );

  if (!org_result.success || !org_result.data) {
    console.warn("[DEBUG] Could not load organization, using defaults");
    return {
      success: true,
      min_players: has_competition_min_players
        ? rule_overrides.min_players_on_field!
        : 0,
      max_players: has_competition_max_players
        ? rule_overrides.max_players_on_field!
        : 99,
    };
  }

  const organization = org_result.data;
  const sport_result = await sport_use_cases.get_by_id(organization.sport_id);

  if (!sport_result.success || !sport_result.data) {
    console.warn("[DEBUG] Could not load sport, using defaults");
    return {
      success: true,
      min_players: has_competition_min_players
        ? rule_overrides.min_players_on_field!
        : 0,
      max_players: has_competition_max_players
        ? rule_overrides.max_players_on_field!
        : 99,
    };
  }

  const sport = sport_result.data;
  console.log(
    "[DEBUG] Using sport defaults with competition overrides where available",
  );

  return {
    success: true,
    min_players: has_competition_min_players
      ? rule_overrides.min_players_on_field!
      : sport.min_players_per_fixture || 0,
    max_players: has_competition_max_players
      ? rule_overrides.max_players_on_field!
      : sport.max_players_per_fixture || 99,
  };
}
