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
  minute: number,
  team_side: "home" | "away" | "match",
  player_name: string = "",
  description: string = "",
  secondary_player_name: string = "",
): GameEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event_type,
    minute,
    stoppage_time_minute: null,
    team_side,
    player_name,
    secondary_player_name,
    description: description || get_event_label(event_type),
    recorded_at: new Date().toISOString(),
  };
}

export function get_event_label(event_type: GameEventType): string {
  return GAME_EVENT_LABELS[event_type];
}

export function get_event_icon(event_type: GameEventType): string {
  return GAME_EVENT_ICONS[event_type];
}

export function format_event_time(
  minute: number,
  stoppage_time: number | null,
): string {
  if (stoppage_time && stoppage_time > 0) {
    return `${minute}+${stoppage_time}'`;
  }
  return `${minute}'`;
}

export function get_period_display_name(period: GamePeriod): string {
  return GAME_PERIOD_DISPLAY_NAMES[period] ?? period;
}
