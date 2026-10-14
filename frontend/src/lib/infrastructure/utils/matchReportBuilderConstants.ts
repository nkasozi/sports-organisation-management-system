import type { CardTypeConfig } from "$lib/core/types/MatchReportTypes";

import type { ReportScoringPeriod } from "./matchReportScoring";

export const DEFAULT_CARD_TYPES: CardTypeConfig[] = [
  { id: "green", name: "Green", color: "#00FF00", event_type: "green_card" },
  { id: "yellow", name: "Yellow", color: "#FFFF00", event_type: "yellow_card" },
  { id: "red", name: "Red", color: "#FF0000", event_type: "red_card" },
];

export const MATCH_REPORT_DEFAULTS = {
  SCHEDULED_TIME: "00:00",
  LEAGUE_NAME: "SPORT-SYNC",
  LOGO_URL: "",
  COMPETITION_NAME: "COMPETITION",
  REPORT_TITLE: "MATCH REPORT",
  GAME_WEEK: 1,
  POOL: "Group Stage",
  MATCH_NUMBER: 1,
  JERSEY_COLOR: "Unknown",
  REMARKS: "",
  VENUE_NAME: "Unknown Venue",
} as const;

export const OFFICIAL_ROLE_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  referee: "Referee",
  umpire: "Umpire",
  assistant_referee: "Assistant Referee",
  fourth_official: "Fourth Official",
  reserve_umpire: "Reserve Umpire",
  judge: "Judge",
  technical_officer: "Technical Officer",
  var_official: "VAR",
  linesman: "Linesman",
  scorer: "Scorer",
  timekeeper: "Timekeeper",
};

export const REPORT_FILENAME_UNSAFE_CHARACTERS = /[^a-zA-Z0-9]/g;

export const GENERIC_MATCH_PERIODS: readonly ReportScoringPeriod[] = [
  {
    id: "match",
    name: "Match",
    duration_minutes: Number.POSITIVE_INFINITY,
    is_break: false,
  },
];
