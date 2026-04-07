export const SPORT_FORM_SECTIONS = [
  { id: "basic", label: "Basic Info" },
  { id: "periods", label: "Game Periods" },
  { id: "cards", label: "Card Types" },
  { id: "fouls", label: "Foul Categories" },
  { id: "officials", label: "Officials" },
  { id: "scoring", label: "Scoring" },
  { id: "overtime", label: "Overtime" },
  { id: "substitutions", label: "Substitutions" },
] as const;

export const SPORT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const SPORT_CARD_SEVERITY_OPTIONS = [
  { value: "warning", label: "Warning" },
  { value: "ejection", label: "Ejection" },
  { value: "suspension", label: "Suspension" },
];

export const SPORT_FOUL_SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "major", label: "Major" },
  { value: "severe", label: "Severe" },
];

export const SPORT_OVERTIME_TRIGGER_OPTIONS = [
  { value: "draw", label: "Any Draw" },
  { value: "knockout_draw", label: "Knockout Draw Only" },
  { value: "never", label: "Never" },
];

export const SPORT_OVERTIME_TYPE_OPTIONS = [
  { value: "extra_time", label: "Extra Time" },
  { value: "golden_goal", label: "Golden Goal" },
  { value: "silver_goal", label: "Silver Goal" },
  { value: "penalties", label: "Penalties" },
  { value: "replay", label: "Replay" },
  { value: "shootout", label: "Shootout" },
];
