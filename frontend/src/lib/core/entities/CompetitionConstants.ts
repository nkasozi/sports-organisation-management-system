import type { CompetitionDerivedStatus } from "./CompetitionTypes";

export const MINIMUM_COMPETITION_NAME_LENGTH = 2;
export const MINIMUM_COMPETITION_MAX_TEAMS = 2;
export const DEFAULT_COMPETITION_MAX_TEAMS = 16;
export const DEFAULT_COMPETITION_LINEUP_DEADLINE_HOURS = 2;
export const DEFAULT_MAX_EVENT_EDITS_PER_GAME = 3;
export const MINIMUM_MAX_EVENT_EDITS_PER_GAME = 0;
export const MAXIMUM_MAX_EVENT_EDITS_PER_GAME = 20;

export const COMPETITION_VALIDATION_MESSAGES = {
  NAME_TOO_SHORT: "Competition name must be at least 2 characters",
  ORGANIZATION_REQUIRED: "Organization is required",
  FORMAT_REQUIRED: "Competition format is required",
  START_DATE_REQUIRED: "Start date is required",
  END_DATE_REQUIRED: "End date is required",
  END_BEFORE_START: "End date must be after start date",
  MAX_TEAMS_TOO_LOW: "Maximum teams must be at least 2",
  MAX_EVENT_EDITS_OUT_OF_RANGE:
    "Event edits allowed per game must be a whole number from 0 to 20",
} as const;

export const COMPETITION_STATUS_DISPLAY: Readonly<
  Record<CompetitionDerivedStatus, { label: string; color: string }>
> = {
  upcoming: {
    label: "Upcoming",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
};
