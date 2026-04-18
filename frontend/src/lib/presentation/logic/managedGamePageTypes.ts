import type { Fixture, QuickEventButton } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

export type ManagedGameFixtureState =
  | { status: "missing" }
  | { status: "present"; fixture: Fixture };

export type ManagedGameTeamState =
  | { status: "missing" }
  | { status: "present"; team: Team };

export type ManagedGameSelectedEventTypeState =
  | { status: "missing" }
  | { status: "present"; event_type: QuickEventButton };

export function create_missing_managed_game_fixture_state(): ManagedGameFixtureState {
  return { status: "missing" };
}

export function create_present_managed_game_fixture_state(
  fixture: Fixture,
): ManagedGameFixtureState {
  return { status: "present", fixture };
}

export function create_missing_managed_game_team_state(): ManagedGameTeamState {
  return { status: "missing" };
}

export function create_present_managed_game_team_state(
  team: Team,
): ManagedGameTeamState {
  return { status: "present", team };
}

export function create_missing_managed_game_selected_event_type_state(): ManagedGameSelectedEventTypeState {
  return { status: "missing" };
}

export function create_present_managed_game_selected_event_type_state(
  event_type: QuickEventButton,
): ManagedGameSelectedEventTypeState {
  return { status: "present", event_type };
}

export interface ManagedGameBundle {
  fixture: Fixture;
  home_team: ManagedGameTeamState;
  away_team: ManagedGameTeamState;
  home_players: unknown[];
  away_players: unknown[];
  game_clock_seconds: number;
}

export type ManagedGameLoadResult =
  | { success: true; data: ManagedGameBundle }
  | { success: false; error_message: string };

export interface ManagedGameStartCheck {
  allowed: boolean;
  message?: string;
  message_type?: "success" | "error" | "info";
  redirect_path?: string;
}
