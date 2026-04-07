import { type CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import {
  get_authorization_preselect_values,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import {
  build_error_message,
  convert_team_player_to_lineup_player,
} from "$lib/core/services/fixtureLineupWizard";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

export function validate_fixture_lineup_create_players(command: {
  selected_players: CreateFixtureLineupInput["selected_players"];
  min_players: number;
  max_players: number;
}): Record<string, string> {
  const count = command.selected_players.length;
  if (count < command.min_players) {
    return {
      players: build_error_message(
        `Not enough players selected (${count} of minimum ${command.min_players}).`,
        `This fixture requires at least ${command.min_players} players to be selected.`,
        `Select ${command.min_players - count} more player(s) to continue.`,
      ),
    };
  }
  if (count > command.max_players) {
    return {
      players: build_error_message(
        `Too many players selected (${count} of maximum ${command.max_players}).`,
        `This fixture allows a maximum of ${command.max_players} players.`,
        `Remove ${count - command.max_players} player(s) to continue.`,
      ),
    };
  }
  return {};
}

export function handle_fixture_lineup_create_step_change_attempt(command: {
  from_step_index: number;
  to_step_index: number;
  form_data: CreateFixtureLineupInput;
  min_players: number;
  max_players: number;
}): { is_allowed: boolean; validation_errors: Record<string, string> } {
  if (command.to_step_index <= command.from_step_index) {
    return { is_allowed: true, validation_errors: {} };
  }
  if (command.from_step_index === 0 && !command.form_data.organization_id) {
    return {
      is_allowed: false,
      validation_errors: {
        organization_id: "Please select an organization first.",
      },
    };
  }
  if (command.from_step_index === 1 && !command.form_data.fixture_id) {
    return {
      is_allowed: false,
      validation_errors: { fixture_id: "Please select a fixture first." },
    };
  }
  if (command.from_step_index === 2 && !command.form_data.team_id) {
    return {
      is_allowed: false,
      validation_errors: { team_id: "Please select a team first." },
    };
  }
  if (command.from_step_index !== 3) {
    return { is_allowed: true, validation_errors: {} };
  }
  const validation_errors = validate_fixture_lineup_create_players({
    selected_players: command.form_data.selected_players,
    min_players: command.min_players,
    max_players: command.max_players,
  });
  return {
    is_allowed: Object.keys(validation_errors).length === 0,
    validation_errors,
  };
}

export function toggle_fixture_lineup_create_player(command: {
  form_data: CreateFixtureLineupInput;
  team_players: TeamPlayer[];
  player_id: string;
  max_players: number;
}): {
  selected_players: CreateFixtureLineupInput["selected_players"];
  error_message: string;
} {
  const is_selected = command.form_data.selected_players.some(
    (player) => player.id === command.player_id,
  );
  if (is_selected) {
    return {
      selected_players: command.form_data.selected_players.filter(
        (player) => player.id !== command.player_id,
      ),
      error_message: "",
    };
  }
  if (command.form_data.selected_players.length >= command.max_players) {
    return {
      selected_players: command.form_data.selected_players,
      error_message: `Maximum ${command.max_players} players can be selected`,
    };
  }
  const team_player = command.team_players.find(
    (player: TeamPlayer) => player.id === command.player_id,
  );
  return {
    selected_players: team_player
      ? [
          ...command.form_data.selected_players,
          convert_team_player_to_lineup_player(team_player),
        ]
      : command.form_data.selected_players,
    error_message: "",
  };
}

export function select_all_fixture_lineup_create_players(command: {
  team_players: TeamPlayer[];
  max_players: number;
}): CreateFixtureLineupInput["selected_players"] {
  return command.team_players
    .slice(0, command.max_players)
    .map((player: TeamPlayer) => convert_team_player_to_lineup_player(player));
}

export function apply_fixture_lineup_authorization_defaults(command: {
  form_data: CreateFixtureLineupInput;
  current_auth_profile: UserScopeProfile | null;
}): CreateFixtureLineupInput {
  const preselect_values = get_authorization_preselect_values(
    command.current_auth_profile,
  );
  return {
    ...command.form_data,
    organization_id:
      command.form_data.organization_id ||
      preselect_values.organization_id ||
      "",
    team_id: command.form_data.team_id || preselect_values.team_id || "",
  };
}
