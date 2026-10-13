import type { FixtureStatusValue } from "$lib/core/entities/StatusConstants";
import type { CheckStatus } from "$lib/core/services/fixtureStartChecks";

const STATUS_BADGE_BASE_CLASSES =
  "px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide whitespace-nowrap";
const NEUTRAL_BADGE_CLASSES = `${STATUS_BADGE_BASE_CLASSES} bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-200`;

export const LIVE_GAME_STATUS_BADGE_CLASS_BY_STATUS: Readonly<
  Record<FixtureStatusValue, string>
> = {
  scheduled: `${STATUS_BADGE_BASE_CLASSES} bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300`,
  in_progress: `${STATUS_BADGE_BASE_CLASSES} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300`,
  postponed: `${STATUS_BADGE_BASE_CLASSES} bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300`,
  completed: NEUTRAL_BADGE_CLASSES,
  cancelled: NEUTRAL_BADGE_CLASSES,
};

export const LIVE_GAME_CHECK_ICON_BY_STATUS: Readonly<
  Record<CheckStatus, string>
> = {
  passed: "✓",
  failed: "✗",
  checking: "◌",
  pending: "○",
};

export const LIVE_GAME_CHECK_CLASS_BY_STATUS: Readonly<
  Record<CheckStatus, string>
> = {
  passed: "text-emerald-600 dark:text-emerald-400",
  failed: "text-red-600 dark:text-red-400",
  checking: "text-blue-600 dark:text-blue-400 animate-pulse",
  pending: "text-accent-400 dark:text-accent-500",
};

const DEFAULT_CHECK_CONTAINER_CLASS = "py-1";

export const LIVE_GAME_CHECK_CONTAINER_CLASS_BY_STATUS: Readonly<
  Record<CheckStatus, string>
> = {
  failed:
    "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3",
  passed: DEFAULT_CHECK_CONTAINER_CLASS,
  checking: DEFAULT_CHECK_CONTAINER_CLASS,
  pending: DEFAULT_CHECK_CONTAINER_CLASS,
};

export const LIVE_GAME_DEFAULT_TEAM_NAME = {
  HOME: "Home Team",
  AWAY: "Away Team",
} as const;
