import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type EventCategory =
  | "score"
  | "discipline"
  | "play"
  | "match_control"
  | "other";

export interface GameEventType extends BaseEntity {
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  category: EventCategory;
  affects_score: boolean;
  requires_player: boolean;
  display_order: number;
  sport_id: string | null;
  status: EntityStatus;
}

export type CreateGameEventTypeInput = Omit<
  GameEventType,
  "id" | "created_at" | "updated_at"
>;
export type UpdateGameEventTypeInput = Partial<CreateGameEventTypeInput>;

export function create_empty_game_event_type_input(
  sport_id: string | null = null,
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
  };
}

export const EVENT_CATEGORY_OPTIONS = [
  { value: "score", label: "Scoring" },
  { value: "discipline", label: "Discipline" },
  { value: "play", label: "Play Events" },
  { value: "match_control", label: "Match Control" },
  { value: "other", label: "Other" },
] as const;

export function get_category_label(category: EventCategory): string {
  const found = EVENT_CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return found?.label ?? category;
}

export function get_default_game_event_types(): CreateGameEventTypeInput[] {
  return [
    {
      name: "Goal",
      code: "goal",
      description: "A goal scored by a player",
      icon: "⚽",
      color: "bg-green-500 hover:bg-green-600",
      category: "score",
      affects_score: true,
      requires_player: true,
      display_order: 1,
      sport_id: null,
      status: "active",
    },
    {
      name: "Own Goal",
      code: "own_goal",
      description: "A goal scored into one's own net",
      icon: "🥅",
      color: "bg-orange-500 hover:bg-orange-600",
      category: "score",
      affects_score: true,
      requires_player: true,
      display_order: 2,
      sport_id: null,
      status: "active",
    },
    {
      name: "Penalty Scored",
      code: "penalty_scored",
      description: "A penalty kick that resulted in a goal",
      icon: "🎯",
      color: "bg-green-600 hover:bg-green-700",
      category: "score",
      affects_score: true,
      requires_player: true,
      display_order: 3,
      sport_id: null,
      status: "active",
    },
    {
      name: "Penalty Missed",
      code: "penalty_missed",
      description: "A penalty kick that was missed or saved",
      icon: "❌",
      color: "bg-red-400 hover:bg-red-500",
      category: "score",
      affects_score: false,
      requires_player: true,
      display_order: 4,
      sport_id: null,
      status: "active",
    },
    {
      name: "Yellow Card",
      code: "yellow_card",
      description: "A caution shown to a player",
      icon: "🟨",
      color: "bg-yellow-400 hover:bg-yellow-500",
      category: "discipline",
      affects_score: false,
      requires_player: true,
      display_order: 5,
      sport_id: null,
      status: "active",
    },
    {
      name: "Red Card",
      code: "red_card",
      description: "A player sent off the field",
      icon: "🟥",
      color: "bg-red-600 hover:bg-red-700",
      category: "discipline",
      affects_score: false,
      requires_player: true,
      display_order: 6,
      sport_id: null,
      status: "active",
    },
    {
      name: "Second Yellow Card",
      code: "second_yellow",
      description: "A second caution resulting in a sending off",
      icon: "🟨🟥",
      color: "bg-orange-600 hover:bg-orange-700",
      category: "discipline",
      affects_score: false,
      requires_player: true,
      display_order: 7,
      sport_id: null,
      status: "active",
    },
    {
      name: "Green Card",
      code: "green_card",
      description: "A warning card used in field hockey",
      icon: "🟩",
      color: "bg-green-400 hover:bg-green-500",
      category: "discipline",
      affects_score: false,
      requires_player: true,
      display_order: 8,
      sport_id: null,
      status: "active",
    },
    {
      name: "Substitution",
      code: "substitution",
      description: "A player substitution",
      icon: "🔄",
      color: "bg-blue-500 hover:bg-blue-600",
      category: "play",
      affects_score: false,
      requires_player: true,
      display_order: 9,
      sport_id: null,
      status: "active",
    },
    {
      name: "Foul",
      code: "foul",
      description: "A foul committed",
      icon: "⚠️",
      color: "bg-amber-500 hover:bg-amber-600",
      category: "play",
      affects_score: false,
      requires_player: true,
      display_order: 10,
      sport_id: null,
      status: "active",
    },
    {
      name: "Offside",
      code: "offside",
      description: "An offside infringement",
      icon: "🚫",
      color: "bg-purple-500 hover:bg-purple-600",
      category: "play",
      affects_score: false,
      requires_player: false,
      display_order: 11,
      sport_id: null,
      status: "active",
    },
    {
      name: "Corner Kick",
      code: "corner",
      description: "A corner kick awarded",
      icon: "🚩",
      color: "bg-teal-500 hover:bg-teal-600",
      category: "play",
      affects_score: false,
      requires_player: false,
      display_order: 12,
      sport_id: null,
      status: "active",
    },
    {
      name: "Free Kick",
      code: "free_kick",
      description: "A free kick awarded",
      icon: "🦵",
      color: "bg-indigo-500 hover:bg-indigo-600",
      category: "play",
      affects_score: false,
      requires_player: false,
      display_order: 13,
      sport_id: null,
      status: "active",
    },
    {
      name: "Injury",
      code: "injury",
      description: "An injury stoppage",
      icon: "🏥",
      color: "bg-red-500 hover:bg-red-600",
      category: "play",
      affects_score: false,
      requires_player: true,
      display_order: 14,
      sport_id: null,
      status: "active",
    },
    {
      name: "VAR Review",
      code: "var_review",
      description: "A video assistant referee review",
      icon: "📺",
      color: "bg-gray-600 hover:bg-gray-700",
      category: "match_control",
      affects_score: false,
      requires_player: false,
      display_order: 15,
      sport_id: null,
      status: "active",
    },
    {
      name: "Period Start",
      code: "period_start",
      description: "Start of a match period",
      icon: "▶️",
      color: "bg-emerald-500 hover:bg-emerald-600",
      category: "match_control",
      affects_score: false,
      requires_player: false,
      display_order: 16,
      sport_id: null,
      status: "active",
    },
    {
      name: "Period End",
      code: "period_end",
      description: "End of a match period",
      icon: "⏹️",
      color: "bg-slate-500 hover:bg-slate-600",
      category: "match_control",
      affects_score: false,
      requires_player: false,
      display_order: 17,
      sport_id: null,
      status: "active",
    },
  ];
}

export function validate_game_event_type_input(
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
