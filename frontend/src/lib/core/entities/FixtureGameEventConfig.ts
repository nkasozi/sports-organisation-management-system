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

export const GAME_EVENT_LABELS: Record<GameEventLogType, string> = {
  goal: "Goal",
  own_goal: "Own Goal",
  penalty_scored: "Penalty Scored",
  penalty_missed: "Penalty Missed",
  green_card: "Green Card",
  yellow_card: "Yellow Card",
  red_card: "Red Card",
  second_yellow: "Second Yellow Card",
  substitution: "Substitution",
  foul: "Foul",
  offside: "Offside",
  corner: "Corner Kick",
  free_kick: "Free Kick",
  injury: "Injury",
  var_review: "VAR Review",
  period_start: "Period Started",
  period_end: "Period Ended",
};

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
