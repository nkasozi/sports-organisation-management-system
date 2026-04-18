import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import { convert_team_player_to_lineup_player } from "$lib/core/services/fixtureLineupWizard";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import type {
  FixtureLineupDetailFixtureState,
  FixtureLineupDetailLineupState,
  FixtureLineupDetailTeamState,
} from "./fixtureLineupDetailPageContracts";

const FIXTURE_LINEUP_STATUS_CLASS_BY_VALUE: Record<string, string> = {
  draft: "status-warning",
  submitted: "status-active",
  locked: "status-inactive",
};

const FIXTURE_LINEUP_FALLBACK_TEXT = {
  UNKNOWN_FIXTURE: "Unknown Fixture",
  UNKNOWN_TEAM: "Unknown",
  SUBMISSION_PLACEHOLDER: "-",
  UNKNOWN_ROLE: "unknown",
} as const;

export function build_fixture_lineup_selected_player_ids(
  lineup_state: FixtureLineupDetailLineupState,
): Set<string> {
  if (lineup_state.status === "missing") {
    return new Set();
  }

  return new Set(
    lineup_state.lineup.selected_players.map((player) => player.id),
  );
}

export function toggle_fixture_lineup_player_selection(
  lineup: FixtureLineup,
  team_players: TeamPlayer[],
  player_id: string,
): FixtureLineup {
  if (lineup.status === "locked") {
    return lineup;
  }

  const has_selected_player = lineup.selected_players.some(
    (player) => player.id === player_id,
  );
  if (has_selected_player) {
    return {
      ...lineup,
      selected_players: lineup.selected_players.filter(
        (player) => player.id !== player_id,
      ),
    };
  }

  const team_player = team_players.find((player) => player.id === player_id);
  if (!team_player) {
    return lineup;
  }

  return {
    ...lineup,
    selected_players: [
      ...lineup.selected_players,
      convert_team_player_to_lineup_player(team_player),
    ],
  };
}

export function get_fixture_lineup_name(
  fixture_state: FixtureLineupDetailFixtureState,
  home_team_state: FixtureLineupDetailTeamState,
  away_team_state: FixtureLineupDetailTeamState,
): string {
  if (fixture_state.status === "missing") {
    return FIXTURE_LINEUP_FALLBACK_TEXT.UNKNOWN_FIXTURE;
  }

  const home_team_name =
    home_team_state.status === "present"
      ? home_team_state.team.name
      : FIXTURE_LINEUP_FALLBACK_TEXT.UNKNOWN_TEAM;
  const away_team_name =
    away_team_state.status === "present"
      ? away_team_state.team.name
      : FIXTURE_LINEUP_FALLBACK_TEXT.UNKNOWN_TEAM;
  return `${home_team_name} vs ${away_team_name}`;
}

export function get_fixture_lineup_status_class(status: string): string {
  return (
    FIXTURE_LINEUP_STATUS_CLASS_BY_VALUE[status] ||
    FIXTURE_LINEUP_STATUS_CLASS_BY_VALUE.locked
  );
}

export function format_fixture_lineup_submission_date(
  submitted_at: string,
): string {
  if (!submitted_at) {
    return FIXTURE_LINEUP_FALLBACK_TEXT.SUBMISSION_PLACEHOLDER;
  }

  return new Date(submitted_at).toLocaleDateString();
}

export function build_fixture_lineup_permission_info_message(
  role: string | undefined,
): string {
  return `Your role "${role || FIXTURE_LINEUP_FALLBACK_TEXT.UNKNOWN_ROLE}" can view lineup details but cannot modify them. Contact an administrator if you need edit access.`;
}
