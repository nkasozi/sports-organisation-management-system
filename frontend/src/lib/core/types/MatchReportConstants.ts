export const MATCH_REPORT_TEAM_SIDE = {
  HOME: "home",
  AWAY: "away",
} as const;

const MATCH_REPORT_GOAL_EVENT = {
  GOAL: "goal",
  OWN_GOAL: "own_goal",
  PENALTY_SCORED: "penalty_scored",
} as const;

const MATCH_REPORT_FIELD_GOAL_LABEL = "FG";

export const MATCH_REPORT_GOAL_ACTION_LABELS: Readonly<Record<string, string>> =
  {
    [MATCH_REPORT_GOAL_EVENT.GOAL]: MATCH_REPORT_FIELD_GOAL_LABEL,
    [MATCH_REPORT_GOAL_EVENT.PENALTY_SCORED]: "PC",
    [MATCH_REPORT_GOAL_EVENT.OWN_GOAL]: "OG",
  };

export const MATCH_REPORT_PRESENT_AT_START_MARK = "X";
export const MATCH_REPORT_UNKNOWN_JERSEY = "?";
export const MATCH_REPORT_EMPTY_TIME_ON = "";
