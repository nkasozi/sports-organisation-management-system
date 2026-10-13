import type {
  EntityId,
  Name,
  ScalarInput,
  ScalarValueInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";
import type { ENTITY_STATUS } from "./StatusConstants";

const POSITION_CATEGORY = {
  GOALKEEPER: "goalkeeper",
  DEFENDER: "defender",
  MIDFIELDER: "midfielder",
  FORWARD: "forward",
  OTHER: "other",
} as const;

export type PositionCategory =
  (typeof POSITION_CATEGORY)[keyof typeof POSITION_CATEGORY];

export type PlayerPositionStatus =
  | typeof ENTITY_STATUS.ACTIVE
  | typeof ENTITY_STATUS.INACTIVE;

export interface PlayerPosition extends BaseEntity {
  name: Name;
  code: string;
  category: PositionCategory;
  description: string;
  sport_type: string;
  display_order: number;
  is_available: boolean;
  status: PlayerPositionStatus;
  organization_id: EntityId;
}

export type CreatePlayerPositionInput = Omit<
  ScalarInput<PlayerPosition>,
  "id" | "created_at" | "updated_at"
>;

export type UpdatePlayerPositionInput = Partial<CreatePlayerPositionInput>;

export interface PlayerPositionFilter {
  name_contains?: string;
  category?: PositionCategory;
  sport_type?: string;
  is_available?: boolean;
  status?: PlayerPositionStatus;
  organization_id?: ScalarValueInput<PlayerPosition["organization_id"]>;
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
