import type { GameEventType, GamePeriod } from "./FixtureTypes";

export interface QuickEventButton {
  id: GameEventType;
  label: string;
  icon: string;
  color: string;
  affects_score: boolean;
  requires_player: boolean;
}

export const QUICK_EVENT_BUTTONS: QuickEventButton[] = [
  {
    id: "goal",
    label: "Goal",
    icon: "⚽",
    color: "bg-green-500 hover:bg-green-600",
    affects_score: true,
    requires_player: true,
  },
  {
    id: "own_goal",
    label: "Own Goal",
    icon: "🥅",
    color: "bg-blue-500 hover:bg-blue-600",
    affects_score: true,
    requires_player: true,
  },
  {
    id: "penalty_scored",
    label: "Penalty ✓",
    icon: "🎯",
    color: "bg-green-600 hover:bg-green-700",
    affects_score: true,
    requires_player: true,
  },
  {
    id: "penalty_missed",
    label: "Penalty ✗",
    icon: "❌",
    color: "bg-red-400 hover:bg-red-500",
    affects_score: false,
    requires_player: true,
  },
  {
    id: "yellow_card",
    label: "Yellow",
    icon: "🟨",
    color: "bg-yellow-400 hover:bg-yellow-500",
    affects_score: false,
    requires_player: true,
  },
  {
    id: "red_card",
    label: "Red",
    icon: "🟥",
    color: "bg-red-600 hover:bg-red-700",
    affects_score: false,
    requires_player: true,
  },
  {
    id: "second_yellow",
    label: "2nd Yellow",
    icon: "🟨🟥",
    color: "bg-blue-600 hover:bg-blue-700",
    affects_score: false,
    requires_player: true,
  },
  {
    id: "substitution",
    label: "Sub",
    icon: "🔄",
    color: "bg-blue-500 hover:bg-blue-600",
    affects_score: false,
    requires_player: true,
  },
  {
    id: "foul",
    label: "Foul",
    icon: "⚠️",
    color: "bg-blue-500 hover:bg-blue-600",
    affects_score: false,
    requires_player: true,
  },
  {
    id: "offside",
    label: "Offside",
    icon: "🚫",
    color: "bg-purple-500 hover:bg-purple-600",
    affects_score: false,
    requires_player: false,
  },
  {
    id: "corner",
    label: "Corner",
    icon: "🚩",
    color: "bg-teal-500 hover:bg-teal-600",
    affects_score: false,
    requires_player: false,
  },
  {
    id: "injury",
    label: "Injury",
    icon: "🏥",
    color: "bg-red-500 hover:bg-red-600",
    affects_score: false,
    requires_player: true,
  },
  {
    id: "var_review",
    label: "VAR",
    icon: "📺",
    color: "bg-gray-600 hover:bg-gray-700",
    affects_score: false,
    requires_player: false,
  },
];

export const GAME_EVENT_LABELS: Record<GameEventType, string> = {
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

export const GAME_EVENT_ICONS: Record<GameEventType, string> = {
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
