import type {
  EntityId,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export type LineupStatus = "draft" | "submitted" | "locked";

export type PlayerTimeOnStatus = "present_at_start" | "didnt_play" | string;

export interface LineupPlayer {
  id: EntityId;
  first_name: Name;
  last_name: Name;
  jersey_number: number | null;
  position: Name | null;
  is_captain: boolean;
  is_substitute: boolean;
  time_on?: PlayerTimeOnStatus;
}

export interface FixtureLineup extends BaseEntity {
  organization_id: EntityId;
  fixture_id: EntityId;
  team_id: EntityId;
  selected_players: LineupPlayer[];
  status: LineupStatus;
  submitted_by: EntityId;
  submitted_at: IsoDateTimeString;
  notes: string;
}

export type CreateFixtureLineupInput = Omit<
  ScalarInput<FixtureLineup>,
  "id" | "created_at" | "updated_at" | "submitted_at" | "status"
> & {
  status?: LineupStatus;
  submitted_at?: string;
};

export type UpdateFixtureLineupInput = Partial<
  Omit<
    ScalarInput<FixtureLineup>,
    "id" | "created_at" | "updated_at" | "fixture_id" | "team_id"
  >
>;

export function create_empty_fixture_lineup_input(
  organization_id: CreateFixtureLineupInput["organization_id"] = "",
  fixture_id: CreateFixtureLineupInput["fixture_id"] = "",
  team_id: CreateFixtureLineupInput["team_id"] = "",
): CreateFixtureLineupInput {
  return {
    organization_id,
    fixture_id,
    team_id,
    selected_players: [],
    submitted_by: "",
    notes: "",
  };
}

function create_lineup_player(
  id: LineupPlayer["id"],
  first_name: LineupPlayer["first_name"],
  last_name: LineupPlayer["last_name"],
  jersey_number: number | null = null,
  position: LineupPlayer["position"] = null,
  is_captain: boolean = false,
  is_substitute: boolean = false,
  time_on: PlayerTimeOnStatus = "didnt_play",
): LineupPlayer {
  return {
    id,
    first_name,
    last_name,
    jersey_number,
    position,
    is_captain,
    is_substitute,
    time_on,
  };
}

function get_lineup_player_display_name(player: LineupPlayer): string {
  const jersey = player.jersey_number ?? "?";
  const name = `${player.first_name} ${player.last_name}`.trim();
  const position_suffix = player.position ? `• ${player.position}` : "";
  const captain_badge = player.is_captain ? "(C) " : "";
  return `#${jersey} ${captain_badge}${name} ${position_suffix}`.trim();
}

function validate_fixture_lineup_input(
  input: CreateFixtureLineupInput | UpdateFixtureLineupInput,
  min_players: number,
  max_players: number,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if ("organization_id" in input && !input.organization_id?.trim()) {
    errors.organization_id = "Organization is required";
  }

  if ("fixture_id" in input && !input.fixture_id?.trim()) {
    errors.fixture_id = "Fixture is required";
  }

  if ("team_id" in input && !input.team_id?.trim()) {
    errors.team_id = "Team is required";
  }

  if ("selected_players" in input) {
    const player_count = input.selected_players?.length || 0;

    if (player_count < min_players) {
      errors.selected_players = `At least ${min_players} player(s) must be selected`;
    }

    if (player_count > max_players) {
      errors.selected_players = `Maximum ${max_players} player(s) can be selected`;
    }

    const unique_player_ids = new Set(input.selected_players?.map((p) => p.id));
    if (unique_player_ids.size !== player_count) {
      errors.selected_players = "Duplicate players are not allowed";
    }
  }

  if ("status" in input && input.status) {
    const valid_statuses: LineupStatus[] = ["draft", "submitted", "locked"];
    if (!valid_statuses.includes(input.status)) {
      errors.status = "Invalid lineup status";
    }
  }

  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function get_time_on_display(
  time_on: PlayerTimeOnStatus | undefined,
): string {
  if (!time_on || time_on === "didnt_play") {
    return "";
  }
  if (time_on === "present_at_start") {
    return "X";
  }
  return time_on;
}

function is_player_time_on_minute(
  time_on: PlayerTimeOnStatus | undefined,
): boolean {
  if (!time_on) return false;
  if (time_on === "present_at_start" || time_on === "didnt_play") return false;
  return !isNaN(parseInt(time_on, 10));
}

export function get_default_time_on_for_player(
  is_substitute: boolean,
): PlayerTimeOnStatus {
  return is_substitute ? "didnt_play" : "present_at_start";
}
