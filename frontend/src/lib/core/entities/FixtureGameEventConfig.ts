import type { GameEventType, GamePeriod } from "./FixtureTypes";
import type { GameEventLogType } from "./GameEventLogTypes";
import type { ScoreAward } from "./SportEventCatalogConstants";

export interface QuickEventButton {
  id: GameEventType;
  label: string;
  icon: string;
  color: string;
  affects_score: boolean;
  requires_player: boolean;
  score_award: ScoreAward;
}

export const GAME_EVENT_ICONS: Record<GameEventLogType, string> = {
  goal: "⚽",
  own_goal: "🥅",
  penalty_scored: "🎯",
  penalty_missed: "❌",
  green_card: "🟩",
  yellow_card: "🟨",
  red_card: "🟥",
  second_yellow: "🟨",
  substitution: "🔄",
  foul: "⚠️",
  offside: "🚫",
  corner: "🚩",
  free_kick: "🦵",
  injury: "🏥",
  var_review: "📺",
  period_start: "▶️",
  period_end: "⏹️",
};

export const GAME_PERIOD_DISPLAY_NAMES: Record<GamePeriod, string> = {
  pre_game: "Pre-Game",
  first_half: "1st Half",
  half_time: "Half Time",
  second_half: "2nd Half",
  extra_time_first: "Extra Time 1st",
  extra_time_second: "Extra Time 2nd",
  penalty_shootout: "Penalties",
  finished: "Full Time",
};
