import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { GameEventType } from "../../core/entities/GameEventType";
import type { Sport } from "../../core/entities/Sport";

export const SPORT_MIN_PLAYERS_PER_FIXTURE_FIELD: FieldMetadata = {
  field_name: "min_players_per_fixture" satisfies keyof Sport,
  display_name: "Min Players per Fixture Lineup",
  field_type: "number",
  is_required: true,
  is_read_only: false,
};

export const SPORT_MAX_PLAYERS_PER_FIXTURE_FIELD: FieldMetadata = {
  field_name: "max_players_per_fixture" satisfies keyof Sport,
  display_name: "Max Players per Fixture Lineup",
  field_type: "number",
  is_required: true,
  is_read_only: false,
};

export const GAMEEVENTTYPE_AFFECTS_SCORE_FIELD: FieldMetadata = {
  field_name: "affects_score" satisfies keyof GameEventType,
  display_name: "Affects Score",
  field_type: "boolean",
  is_required: false,
  is_read_only: false,
};

export const GAMEEVENTTYPE_REQUIRES_PLAYER_FIELD: FieldMetadata = {
  field_name: "requires_player" satisfies keyof GameEventType,
  display_name: "Requires Player",
  field_type: "boolean",
  is_required: false,
  is_read_only: false,
};
