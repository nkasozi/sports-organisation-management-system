import {
  DEFAULT_MAX_EVENT_EDITS_PER_GAME,
  MAXIMUM_MAX_EVENT_EDITS_PER_GAME,
  MINIMUM_MAX_EVENT_EDITS_PER_GAME,
} from "./CompetitionConstants";
import type { Competition } from "./CompetitionTypes";

const NUMBER_TYPE_NAME = "number";
const STRING_TYPE_NAME = "string";

export function is_valid_max_event_edits_per_game(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MINIMUM_MAX_EVENT_EDITS_PER_GAME &&
    value <= MAXIMUM_MAX_EVENT_EDITS_PER_GAME
  );
}

export function read_max_event_edits_per_game(
  competition: Partial<Pick<Competition, "max_event_edits_per_game">>,
): number {
  const raw_value = competition.max_event_edits_per_game;
  if (typeof raw_value !== NUMBER_TYPE_NAME)
    return DEFAULT_MAX_EVENT_EDITS_PER_GAME;
  const value = Number(raw_value);
  return Number.isFinite(value) && value >= MINIMUM_MAX_EVENT_EDITS_PER_GAME
    ? value
    : DEFAULT_MAX_EVENT_EDITS_PER_GAME;
}

function read_numeric_input(value: unknown): number {
  if (typeof value === NUMBER_TYPE_NAME) return Number(value);
  const text = typeof value === STRING_TYPE_NAME ? String(value).trim() : "";
  return text.length > 0 ? Number(text) : Number.NaN;
}

export function normalize_max_event_edits_per_game_input(
  value: unknown,
): number {
  const numeric_value = read_numeric_input(value);
  if (!Number.isFinite(numeric_value)) return DEFAULT_MAX_EVENT_EDITS_PER_GAME;
  return Math.min(
    MAXIMUM_MAX_EVENT_EDITS_PER_GAME,
    Math.max(MINIMUM_MAX_EVENT_EDITS_PER_GAME, Math.round(numeric_value)),
  );
}
