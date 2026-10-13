import { PLAYER_TIME_ON } from "$lib/core/entities/FixtureLineup";

export const LINEUP_ROW_TONE = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
} as const;

export type LineupRowTone =
  (typeof LINEUP_ROW_TONE)[keyof typeof LINEUP_ROW_TONE];

const TIME_ON_SHORT_LABELS: Readonly<Record<string, string>> = {
  [PLAYER_TIME_ON.PRESENT_AT_START]: "X",
  [PLAYER_TIME_ON.DIDNT_PLAY]: "-",
};

export function get_time_on_short_label(option: {
  value: string;
  label: string;
}): string {
  return TIME_ON_SHORT_LABELS[option.value] ?? option.label;
}
