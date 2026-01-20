import type { Fixture } from "../entities/Fixture";
import type { FixtureOfficialUseCases } from "../usecases/FixtureOfficialUseCases";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { PlayerTeamMembershipUseCases } from "../usecases/PlayerTeamMembershipUseCases";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";
import type { CreateFixtureLineupInput } from "../entities/FixtureLineup";

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
  official_use_cases: FixtureOfficialUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<FixtureCanStartResult> {
  if (!fixture.id) {
    throw new Error("Fixture must have an ID");
  }

  const officials_result = await official_use_cases.list_officials_for_fixture(
    fixture.id,
  );
  const officials = officials_result.data || [];

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
        : "Go to Fixture Officials page and assign at least one official to this fixture",
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
        ? `Home team lineup submitted with ${home_lineup.selected_player_ids.length} players`
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
        ? `Away team lineup submitted with ${away_lineup.selected_player_ids.length} players`
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
  lineup_use_cases: FixtureLineupUseCases,
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<LineupGenerationResult> {
  if (!fixture.id) {
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
    return {
      success: false,
      error_message: rules_result.error_message,
    };
  }

  const { min_players, max_players } = rules_result;

  const memberships_result = await membership_use_cases.list({
    team_id,
    status: "active",
  });
  const active_players = (memberships_result.data || []).filter(
    (m: any) => m.status === "active",
  );

  const player_count = active_players.length;

  if (player_count < min_players) {
    return {
      success: false,
      error_message: `${team_name} has only ${player_count} active player(s), but minimum is ${min_players}`,
      fix_suggestion: `Go to Player Team Memberships page and add more players to ${team_name} (need at least ${min_players - player_count} more)`,
    };
  }

  if (player_count > max_players) {
    return {
      success: false,
      error_message: `${team_name} has ${player_count} active players, but maximum is ${max_players}`,
      fix_suggestion: `Go to Team Fixture Lineups page and manually select which players from ${team_name} should be in the lineup`,
    };
  }

  const lineup: CreateFixtureLineupInput = {
    fixture_id: fixture.id,
    team_id,
    selected_player_ids: active_players.map((p: any) => p.player_id),
    status: "submitted",
    submitted_by: "auto-generated",
    submitted_at: new Date().toISOString(),
    notes: "Auto-generated lineup",
  };

  const create_result = await lineup_use_cases.create(lineup);

  if (!create_result.success) {
    return {
      success: false,
      error_message: create_result.error_message || "Failed to create lineup",
    };
  }

  return {
    success: true,
    lineup,
  };
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
