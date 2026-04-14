import type { ScalarInput } from "../types/DomainScalars";
import {
  GAME_EVENT_ICONS,
  GAME_EVENT_LABELS,
  GAME_PERIOD_DISPLAY_NAMES,
  QUICK_EVENT_BUTTONS,
} from "./FixtureGameEventConfig";
import type { GameEvent, GameEventType, GamePeriod } from "./FixtureTypes";

export type { QuickEventButton } from "./FixtureGameEventConfig";

export function get_quick_event_buttons() {
  return QUICK_EVENT_BUTTONS;
}

export function create_game_event(
  event_type: GameEventType,
  minute: ScalarInput<GameEvent>["minute"],
  team_side: "home" | "away" | "match",
  player_name: ScalarInput<GameEvent>["player_name"] = "",
  description: GameEvent["description"] = "",
  secondary_player_name: ScalarInput<GameEvent>["secondary_player_name"] = "",
): GameEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as GameEvent["id"],
    event_type,
    minute: minute as GameEvent["minute"],
    stoppage_time_minute: null,
    team_side,
    player_name: player_name as GameEvent["player_name"],
    secondary_player_name:
      secondary_player_name as GameEvent["secondary_player_name"],
    description: description || get_event_label(event_type),
    recorded_at: new Date().toISOString() as GameEvent["recorded_at"],
  };
}

export function get_event_label(event_type: GameEventType): string {
  return GAME_EVENT_LABELS[event_type];
}

export function get_event_icon(event_type: GameEventType): string {
  return GAME_EVENT_ICONS[event_type];
}

export function format_event_time(
  minute: GameEvent["minute"],
  stoppage_time: GameEvent["stoppage_time_minute"],
): string {
  if (stoppage_time && stoppage_time > 0) {
    return `${minute}+${stoppage_time}'`;
  }
  return `${minute}'`;
}

export function get_period_display_name(period: GamePeriod): string {
  return GAME_PERIOD_DISPLAY_NAMES[period] ?? period;
}
