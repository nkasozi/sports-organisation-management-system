import type { BaseEntity } from "./BaseEntity";

export type LineupStatus = "draft" | "submitted" | "locked";

export interface FixtureLineup extends BaseEntity {
  fixture_id: string;
  team_id: string;
  selected_player_ids: string[];
  status: LineupStatus;
  submitted_by: string;
  submitted_at: string;
  notes: string;
}

export type CreateFixtureLineupInput = Omit<
  FixtureLineup,
  "id" | "created_at" | "updated_at" | "submitted_at" | "status"
> & {
  status?: LineupStatus;
  submitted_at?: string;
};

export type UpdateFixtureLineupInput = Partial<
  Omit<
    FixtureLineup,
    "id" | "created_at" | "updated_at" | "fixture_id" | "team_id"
  >
>;

export function create_empty_fixture_lineup_input(
  fixture_id: string = "",
  team_id: string = "",
): CreateFixtureLineupInput {
  return {
    fixture_id,
    team_id,
    selected_player_ids: [],
    submitted_by: "",
    notes: "",
  };
}

export function validate_fixture_lineup_input(
  input: CreateFixtureLineupInput | UpdateFixtureLineupInput,
  min_players: number,
  max_players: number,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if ("fixture_id" in input && !input.fixture_id?.trim()) {
    errors.fixture_id = "Fixture is required";
  }

  if ("team_id" in input && !input.team_id?.trim()) {
    errors.team_id = "Team is required";
  }

  if ("selected_player_ids" in input) {
    const player_count = input.selected_player_ids?.length || 0;

    if (player_count < min_players) {
      errors.selected_player_ids = `At least ${min_players} player(s) must be selected`;
    }

    if (player_count > max_players) {
      errors.selected_player_ids = `Maximum ${max_players} player(s) can be selected`;
    }

    const unique_players = new Set(input.selected_player_ids);
    if (unique_players.size !== player_count) {
      errors.selected_player_ids = "Duplicate players are not allowed";
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
