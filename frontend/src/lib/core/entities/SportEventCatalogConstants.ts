import type { QuickEventButton } from "./FixtureGameEventConfig";
import { GAME_EVENT_LOG_TYPE } from "./GameEventLogTypes";

export const SCORE_AWARD_KIND = {
  NONE: "none",
  CREDIT: "credit",
} as const;

export const SCORE_CREDITED_SIDE = {
  ACTING: "acting",
  OPPOSING: "opposing",
} as const;

export type ScoreCreditedSide =
  (typeof SCORE_CREDITED_SIDE)[keyof typeof SCORE_CREDITED_SIDE];

export type ScoreAward =
  | { kind: typeof SCORE_AWARD_KIND.NONE }
  | {
      kind: typeof SCORE_AWARD_KIND.CREDIT;
      credited_side: ScoreCreditedSide;
      points: number;
    };

export const NO_SCORE_AWARD: ScoreAward = { kind: SCORE_AWARD_KIND.NONE };

export const OPPOSING_SIDE_SCORE_EVENTS: ReadonlySet<string> = new Set([
  GAME_EVENT_LOG_TYPE.OWN_GOAL,
]);

export const LEGACY_SCORE_POINTS: ReadonlyMap<string, number> = new Map([
  [GAME_EVENT_LOG_TYPE.GOAL, 1],
  [GAME_EVENT_LOG_TYPE.PENALTY_SCORED, 1],
  [GAME_EVENT_LOG_TYPE.OWN_GOAL, 1],
]);

export const SCORE_BUTTON_ICON = "🏅";
export const CARD_BUTTON_ICON = "🟧";
export const SCORE_BUTTON_COLOR = "bg-green-500 hover:bg-green-600";
export const CARD_BUTTON_COLOR = "bg-orange-500 hover:bg-orange-600";
export const SINGLE_POINT = 1;

export const CARD_BUTTON_COLORS: Readonly<Record<string, string>> = {
  [GAME_EVENT_LOG_TYPE.YELLOW_CARD]: "bg-yellow-400 hover:bg-yellow-500",
  [GAME_EVENT_LOG_TYPE.RED_CARD]: "bg-red-600 hover:bg-red-700",
  [GAME_EVENT_LOG_TYPE.GREEN_CARD]: "bg-green-700 hover:bg-green-800",
};

type MatchEventButton = Omit<QuickEventButton, "score_award">;

export const COMMON_MATCH_EVENT_BUTTONS: readonly MatchEventButton[] = [
  {
    id: GAME_EVENT_LOG_TYPE.SUBSTITUTION,
    label: "Sub",
    icon: "🔄",
    color: "bg-blue-500 hover:bg-blue-600",
    affects_score: false,
    requires_player: true,
  },
  {
    id: GAME_EVENT_LOG_TYPE.FOUL,
    label: "Foul",
    icon: "⚠️",
    color: "bg-blue-500 hover:bg-blue-600",
    affects_score: false,
    requires_player: true,
  },
  {
    id: GAME_EVENT_LOG_TYPE.INJURY,
    label: "Injury",
    icon: "🏥",
    color: "bg-red-500 hover:bg-red-600",
    affects_score: false,
    requires_player: true,
  },
];

const FOOTBALL_EXTRA_BUTTONS: readonly MatchEventButton[] = [
  {
    id: GAME_EVENT_LOG_TYPE.PENALTY_MISSED,
    label: "Penalty ✗",
    icon: "❌",
    color: "bg-red-400 hover:bg-red-500",
    affects_score: false,
    requires_player: true,
  },
  {
    id: GAME_EVENT_LOG_TYPE.OFFSIDE,
    label: "Offside",
    icon: "🚫",
    color: "bg-purple-500 hover:bg-purple-600",
    affects_score: false,
    requires_player: false,
  },
  {
    id: GAME_EVENT_LOG_TYPE.CORNER,
    label: "Corner",
    icon: "🚩",
    color: "bg-teal-500 hover:bg-teal-600",
    affects_score: false,
    requires_player: false,
  },
  {
    id: GAME_EVENT_LOG_TYPE.VAR_REVIEW,
    label: "VAR",
    icon: "📺",
    color: "bg-gray-600 hover:bg-gray-700",
    affects_score: false,
    requires_player: false,
  },
];

const FIELD_HOCKEY_EXTRA_BUTTONS: readonly MatchEventButton[] = [
  {
    id: "penalty_corner",
    label: "Penalty Corner",
    icon: "🚩",
    color: "bg-teal-500 hover:bg-teal-600",
    affects_score: false,
    requires_player: false,
  },
];

export const SPORT_EXTRA_EVENT_BUTTONS: Readonly<
  Record<string, readonly MatchEventButton[]>
> = {
  FOOTBALL: FOOTBALL_EXTRA_BUTTONS,
  FIELD_HOCKEY: FIELD_HOCKEY_EXTRA_BUTTONS,
};
