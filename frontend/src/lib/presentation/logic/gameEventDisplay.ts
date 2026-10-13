import type { GameEvent } from "$lib/core/entities/Fixture";

import {
  GAME_EVENT_BACKGROUND_CLASS_BY_TYPE,
  NEUTRAL_EVENT_CLASS,
} from "./gameEventDisplayConstants";

export function get_event_bg_class(
  event_type: GameEvent["event_type"],
): string {
  return (
    (GAME_EVENT_BACKGROUND_CLASS_BY_TYPE as Readonly<Record<string, string>>)[
      event_type
    ] ?? NEUTRAL_EVENT_CLASS
  );
}
