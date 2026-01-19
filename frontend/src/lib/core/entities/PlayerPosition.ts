import type { BaseEntity } from "./BaseEntity";

export type PositionCategory =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward"
  | "other";

export interface PlayerPosition extends BaseEntity {
  name: string;
  code: string;
  category: PositionCategory;
  description: string;
  sport_type: string;
  display_order: number;
  is_available: boolean;
  status: "active" | "inactive";
}

export type CreatePlayerPositionInput = Omit<
  PlayerPosition,
  "id" | "created_at" | "updated_at"
>;

export type UpdatePlayerPositionInput = Partial<CreatePlayerPositionInput>;

export interface PlayerPositionFilter {
  name_contains?: string;
  category?: PositionCategory;
  sport_type?: string;
  is_available?: boolean;
  status?: "active" | "inactive";
}

export function validate_player_position_input(
  input: CreatePlayerPositionInput,
): { is_valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    errors.push("Position name must be at least 2 characters");
  }

  if (!input.code || input.code.trim().length < 1) {
    errors.push("Position code is required");
  }

  if (!input.category) {
    errors.push("Position category is required");
  }

  if (input.display_order < 0) {
    errors.push("Display order must be a non-negative number");
  }

  return {
    is_valid: errors.length === 0,
    errors,
  };
}

export function get_default_player_positions(): CreatePlayerPositionInput[] {
  return [
    {
      name: "Goalkeeper",
      code: "GK",
      category: "goalkeeper",
      description: "Protects the goal",
      sport_type: "Football",
      display_order: 1,
      is_available: true,
      status: "active",
    },
    {
      name: "Center Back",
      code: "CB",
      category: "defender",
      description: "Central defensive position",
      sport_type: "Football",
      display_order: 2,
      is_available: true,
      status: "active",
    },
    {
      name: "Left Back",
      code: "LB",
      category: "defender",
      description: "Left side defensive position",
      sport_type: "Football",
      display_order: 3,
      is_available: true,
      status: "active",
    },
    {
      name: "Right Back",
      code: "RB",
      category: "defender",
      description: "Right side defensive position",
      sport_type: "Football",
      display_order: 4,
      is_available: true,
      status: "active",
    },
    {
      name: "Midfielder",
      code: "CM",
      category: "midfielder",
      description: "Central midfield position",
      sport_type: "Football",
      display_order: 5,
      is_available: true,
      status: "active",
    },
    {
      name: "Left Midfielder",
      code: "LM",
      category: "midfielder",
      description: "Left midfield position",
      sport_type: "Football",
      display_order: 6,
      is_available: true,
      status: "active",
    },
    {
      name: "Right Midfielder",
      code: "RM",
      category: "midfielder",
      description: "Right midfield position",
      sport_type: "Football",
      display_order: 7,
      is_available: true,
      status: "active",
    },
    {
      name: "Forward",
      code: "FW",
      category: "forward",
      description: "Attacking forward position",
      sport_type: "Football",
      display_order: 8,
      is_available: true,
      status: "active",
    },
    {
      name: "Striker",
      code: "ST",
      category: "forward",
      description: "Main striker position",
      sport_type: "Football",
      display_order: 9,
      is_available: true,
      status: "active",
    },
  ];
}
