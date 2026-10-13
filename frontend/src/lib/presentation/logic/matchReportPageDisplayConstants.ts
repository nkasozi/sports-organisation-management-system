export const MATCH_REPORT_STATUS_COLOR_BY_VALUE: Record<string, string> = {
  in_progress: "text-green-400",
  completed: "text-gray-400",
  scheduled: "text-primary-400",
};

export const MATCH_REPORT_STATUS_LABEL_BY_VALUE: Record<string, string> = {
  completed: "Full Time",
  in_progress: "LIVE",
  scheduled: "Upcoming",
};

export const MATCH_REPORT_EVENT_BACKGROUND_BY_TYPE: Record<string, string> = {
  goal: "border-l-green-500 bg-green-50 dark:bg-green-900/20",
  penalty_scored: "border-l-green-500 bg-green-50 dark:bg-green-900/20",
  own_goal: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
  yellow_card: "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  red_card: "border-l-red-500 bg-red-50 dark:bg-red-900/20",
  second_yellow: "border-l-red-500 bg-red-50 dark:bg-red-900/20",
  substitution: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
  period_start: "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20",
  period_end: "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20",
};

export const MATCH_REPORT_DEFAULT_TEXT = {
  kickoff_time_tbd: "TBD",
  default_event_background: "border-l-gray-300 bg-gray-50 dark:bg-accent-800",
  page_title_suffix: "Match Viewer",
  home_team_fallback: "Home",
  away_team_fallback: "Away",
  kickoff_date_locale: "en-US",
} as const;
