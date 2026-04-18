import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type EventCategory =
  | "score"
  | "discipline"
  | "play"
  | "match_control"
  | "other";

export interface GameEventType extends BaseEntity {
  name: Name;
  code: string;
  description: string;
  icon: string;
  color: string;
  category: EventCategory;
  affects_score: boolean;
  requires_player: boolean;
  display_order: number;
  sport_id: EntityId | "";
  status: EntityStatus;
  organization_id: EntityId;
}

export type CreateGameEventTypeInput = Omit<
  ScalarInput<GameEventType>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateGameEventTypeInput = Partial<CreateGameEventTypeInput>;

function create_empty_game_event_type_input(
  sport_id: CreateGameEventTypeInput["sport_id"] = "",
): CreateGameEventTypeInput {
  return {
    name: "",
    code: "",
    description: "",
    icon: "📋",
    color: "bg-gray-500 hover:bg-gray-600",
    category: "other",
    affects_score: false,
    requires_player: false,
    display_order: 0,
    sport_id,
    status: "active",
    organization_id: "",
  };
}

const EVENT_CATEGORY_OPTIONS = [
  { value: "score", label: "Scoring" },
  { value: "discipline", label: "Discipline" },
  { value: "play", label: "Play Events" },
  { value: "match_control", label: "Match Control" },
  { value: "other", label: "Other" },
] as const;

function get_category_label(category: EventCategory): string {
  const found = EVENT_CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return found?.label ?? category;
}

function validate_game_event_type_input(
  input: CreateGameEventTypeInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Name must be at least 2 characters");
  }
  if (!input.code || input.code.trim().length < 2) {
    validation_errors.push("Code must be at least 2 characters");
  }
  if (!input.icon) {
    validation_errors.push("Icon is required");
  }
  if (!input.color) {
    validation_errors.push("Color is required");
  }

  return validation_errors;
}
