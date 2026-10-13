import { COMPETITION_DERIVED_STATUS } from "$lib/core/entities/CompetitionTypes";

export const COMPETITION_CREATE_TAB = {
  DETAILS: "details",
  RULES: "rules",
} as const;

export type CompetitionCreateTab =
  (typeof COMPETITION_CREATE_TAB)[keyof typeof COMPETITION_CREATE_TAB];

export const COMPETITION_EDIT_TAB = {
  DETAILS: "details",
  TEAMS: "teams",
  STAGES: "stages",
  RULES: "rules",
  SETTINGS: "settings",
  OFFICIAL_JERSEYS: "official_jerseys",
} as const;

export type CompetitionEditTab =
  (typeof COMPETITION_EDIT_TAB)[keyof typeof COMPETITION_EDIT_TAB];

export const COMPETITION_RESULTS_TAB = {
  STANDINGS: "standings",
  FIXTURES: "fixtures",
  RESULTS: "results",
  STATS: "stats",
} as const;

export type CompetitionResultsTab =
  (typeof COMPETITION_RESULTS_TAB)[keyof typeof COMPETITION_RESULTS_TAB];

export const COMPETITION_TEAM_CARD_ACTION = {
  ADD: "add",
  REMOVE: "remove",
} as const;

export type CompetitionTeamCardAction =
  (typeof COMPETITION_TEAM_CARD_ACTION)[keyof typeof COMPETITION_TEAM_CARD_ACTION];

const CANCELLED_STATUS = "cancelled";

const STATUS_BADGE_TONE_CLASSES: Readonly<Record<string, string>> = {
  [COMPETITION_DERIVED_STATUS.ACTIVE]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  [COMPETITION_DERIVED_STATUS.UPCOMING]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  [COMPETITION_DERIVED_STATUS.COMPLETED]:
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  [CANCELLED_STATUS]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function get_competition_status_badge_tone_classes(
  status: string,
): string {
  return STATUS_BADGE_TONE_CLASSES[status] ?? "";
}

export const COMPETITION_ROUTES = {
  LIST: "/competitions",
  CREATE: "/competitions/create",
  ORGANIZATIONS: "/organizations",
} as const;
