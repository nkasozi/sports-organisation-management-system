import {
  RESULTS_VIEW_MODE,
  type ResultsViewMode,
} from "$lib/presentation/logic/competitionResultsViewMode";
import {
  ORDER_PREFERENCE,
  type OrderPreference,
  STAGE_ORDER,
  type StageOrder,
} from "$lib/presentation/logic/competitionStageOrder";

export const COMPETITION_STATS_ALL_TEAMS_FILTER = "all";

export const STANDING_PLAYOFF_LABEL = "Playoff";
export const STANDING_PLAYOFF_TITLE =
  "Still level after every tiebreaker. A playoff decides this position.";

export const STANDING_FORM_RESULT = {
  WIN: "W",
  DRAW: "D",
  LOSS: "L",
} as const;

const STANDING_FORM_CLASSES: Readonly<Record<string, string>> = {
  [STANDING_FORM_RESULT.WIN]: "bg-green-500 text-white",
  [STANDING_FORM_RESULT.DRAW]: "bg-gray-400 text-white",
};

const STANDING_FORM_LOSS_CLASSES = "bg-red-500 text-white";
const STANDING_FORM_LOSS_SYMBOL = "✕";

export function get_standing_form_classes(form_result: string): string {
  return STANDING_FORM_CLASSES[form_result] ?? STANDING_FORM_LOSS_CLASSES;
}

export function get_standing_form_label(form_result: string): string {
  return form_result === STANDING_FORM_RESULT.LOSS
    ? STANDING_FORM_LOSS_SYMBOL
    : form_result;
}
export const MATCH_REPORT_PATH_PREFIX = "/match-report/";

export { is_bracket_stage_type } from "$lib/presentation/logic/competitionBracket";

export const COMPETITION_RESULTS_DOWNLOAD_TEXT = {
  REPORT_DOWNLOADED: "Match report downloaded.",
  REPORT_FAILED:
    "We couldn't download the match report. Please try again in a moment.",
  ALL_REPORTS_DOWNLOADED: "Match reports downloaded.",
  ALL_REPORTS_FAILED:
    "We couldn't download the match reports. Please try again in a moment.",
} as const;

export const STAGE_ORDER_TOGGLE_TEXT: Readonly<
  Record<OrderPreference, Record<StageOrder, { label: string; title: string }>>
> = {
  [ORDER_PREFERENCE.STANDINGS_STAGES]: {
    [STAGE_ORDER.ASCENDING]: {
      label: "Earliest stage first",
      title: "Show the latest stage first",
    },
    [STAGE_ORDER.DESCENDING]: {
      label: "Latest stage first",
      title: "Show the earliest stage first",
    },
  },
  [ORDER_PREFERENCE.RESULTS_KICKOFF]: {
    [STAGE_ORDER.ASCENDING]: {
      label: "Oldest first",
      title: "Show the latest results first",
    },
    [STAGE_ORDER.DESCENDING]: {
      label: "Latest first",
      title: "Show the oldest results first",
    },
  },
};

export const COMPLETED_RESULTS_TEXT = {
  NO_COMPLETED_FIXTURES: "No completed fixtures yet.",
  SEARCH_LABEL: "Search results",
  SEARCH_PLACEHOLDER: "Search by team, stage or date",
  NO_MATCHING_RESULTS: "No results match your search.",
  CLEAR_SEARCH: "Clear search",
  SINGLE_MATCH: "match",
  MULTIPLE_MATCHES: "matches",
} as const;

export function describe_completed_results_count(
  matching_count: number,
  total_count: number,
): string {
  const match_noun =
    total_count === 1
      ? COMPLETED_RESULTS_TEXT.SINGLE_MATCH
      : COMPLETED_RESULTS_TEXT.MULTIPLE_MATCHES;
  return matching_count === total_count
    ? `${total_count} completed ${match_noun}`
    : `${matching_count} of ${total_count} completed ${match_noun}`;
}

export const RESULTS_VIEW_MODE_TEXT: Readonly<
  Record<ResultsViewMode, string> & { GROUP_LABEL: string }
> = {
  [RESULTS_VIEW_MODE.LIST]: "Show as a list",
  [RESULTS_VIEW_MODE.BRACKET]: "Show as a bracket",
  GROUP_LABEL: "Choose how results are displayed",
};

export const BRACKET_TEXT = {
  TO_BE_DECIDED: "To be decided",
  UNKNOWN_TEAM_MARK: "?",
  OPEN_MATCH_REPORT: "Open match report",
} as const;

export const DOWNLOAD_ALL_REPORTS_TEXT = {
  IDLE: "Download All Reports",
  GENERATING: "Generating All...",
} as const;
