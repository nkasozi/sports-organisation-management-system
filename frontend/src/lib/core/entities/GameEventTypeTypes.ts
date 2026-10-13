import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export const EVENT_CATEGORY = {
  SCORE: "score",
  DISCIPLINE: "discipline",
  PLAY: "play",
  MATCH_CONTROL: "match_control",
  OTHER: "other",
} as const;

export type EventCategory =
  (typeof EVENT_CATEGORY)[keyof typeof EVENT_CATEGORY];

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
