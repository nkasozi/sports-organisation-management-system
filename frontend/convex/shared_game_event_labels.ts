export const SHARED_GAME_EVENT_LABELS: Readonly<Record<string, string>> = {
  goal: "Goal",
  own_goal: "Own Goal",
  penalty_scored: "Penalty Scored",
  penalty_missed: "Penalty Missed",
  green_card: "Green Card",
  yellow_card: "Yellow Card",
  red_card: "Red Card",
  second_yellow: "Second Yellow Card",
  substitution: "Substitution",
  foul: "Foul",
  offside: "Offside",
  corner: "Corner Kick",
  free_kick: "Free Kick",
  injury: "Injury",
  var_review: "VAR Review",
  period_start: "Period Started",
  period_end: "Period Ended",
};

export function humanize_event_code(event_code: string): string {
  return event_code
    .split("_")
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function get_game_event_label(event_code: string): string {
  return (
    SHARED_GAME_EVENT_LABELS[event_code] ?? humanize_event_code(event_code)
  );
}
