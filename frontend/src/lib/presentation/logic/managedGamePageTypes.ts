import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

export interface ManagedGameBundle {
  fixture: Fixture;
  home_team: Team | null;
  away_team: Team | null;
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
