export const FIELD_RULE_KIND = {
  TEXT: "text",
  EMAIL: "email",
  PHONE: "phone",
  HEX_COLOR: "hex_color",
  DATE: "date",
  DATE_TIME: "date_time",
  TIME: "time",
  NUMBER: "number",
  UNCHECKED: "unchecked",
} as const;

export type FieldRule =
  | { kind: typeof FIELD_RULE_KIND.TEXT; maximum_length: number }
  | { kind: typeof FIELD_RULE_KIND.EMAIL }
  | { kind: typeof FIELD_RULE_KIND.PHONE }
  | { kind: typeof FIELD_RULE_KIND.HEX_COLOR }
  | {
      kind: typeof FIELD_RULE_KIND.DATE;
      earliest_year: number;
      past_only: boolean;
    }
  | { kind: typeof FIELD_RULE_KIND.DATE_TIME }
  | { kind: typeof FIELD_RULE_KIND.TIME }
  | {
      kind: typeof FIELD_RULE_KIND.NUMBER;
      minimum: number;
      maximum: number;
      whole: boolean;
    }
  | { kind: typeof FIELD_RULE_KIND.UNCHECKED };

export const EMAIL_MAXIMUM_LENGTH = 254;
const PERSON_NAME_MAXIMUM_LENGTH = 100;
const NAME_MAXIMUM_LENGTH = 150;
const TITLE_MAXIMUM_LENGTH = 200;
const CODE_MAXIMUM_LENGTH = 30;
const SHORT_LABEL_MAXIMUM_LENGTH = 50;
const PLACE_MAXIMUM_LENGTH = 100;
const DESCRIPTION_MAXIMUM_LENGTH = 1_000;
const NOTES_MAXIMUM_LENGTH = 2_000;
const OTHER_TEXT_MAXIMUM_LENGTH = 5_000;
const EARLIEST_BIRTH_YEAR = 1900;
const EARLIEST_FOUNDED_YEAR = 1800;
const EARLIEST_OTHER_YEAR = 1900;

const text = (maximum_length: number): FieldRule => ({
  kind: FIELD_RULE_KIND.TEXT,
  maximum_length,
});
const whole = (minimum: number, maximum: number): FieldRule => ({
  kind: FIELD_RULE_KIND.NUMBER,
  minimum,
  maximum,
  whole: true,
});
const amount = (maximum: number): FieldRule => ({
  kind: FIELD_RULE_KIND.NUMBER,
  minimum: 0,
  maximum,
  whole: false,
});
const date = (earliest_year: number, past_only: boolean): FieldRule => ({
  kind: FIELD_RULE_KIND.DATE,
  earliest_year,
  past_only,
});
const UNCHECKED: FieldRule = { kind: FIELD_RULE_KIND.UNCHECKED };

const EXACT_FIELD_RULES: Readonly<Record<string, FieldRule>> = {
  first_name: text(PERSON_NAME_MAXIMUM_LENGTH),
  middle_name: text(PERSON_NAME_MAXIMUM_LENGTH),
  last_name: text(PERSON_NAME_MAXIMUM_LENGTH),
  name: text(NAME_MAXIMUM_LENGTH),
  title: text(TITLE_MAXIMUM_LENGTH),
  code: text(CODE_MAXIMUM_LENGTH),
  short_name: text(SHORT_LABEL_MAXIMUM_LENGTH),
  nickname: text(SHORT_LABEL_MAXIMUM_LENGTH),
  nationality: text(PLACE_MAXIMUM_LENGTH),
  city: text(PLACE_MAXIMUM_LENGTH),
  country: text(PLACE_MAXIMUM_LENGTH),
  location: text(TITLE_MAXIMUM_LENGTH),
  venue: text(NAME_MAXIMUM_LENGTH),
  identifier_value: text(SHORT_LABEL_MAXIMUM_LENGTH),
  certification_number: text(SHORT_LABEL_MAXIMUM_LENGTH),
  description: text(DESCRIPTION_MAXIMUM_LENGTH),
  tagline: text(TITLE_MAXIMUM_LENGTH),
  notes: text(NOTES_MAXIMUM_LENGTH),
  address: text(NOTES_MAXIMUM_LENGTH),
  profile_summary: text(NOTES_MAXIMUM_LENGTH),
  color: text(TITLE_MAXIMUM_LENGTH),
  color_override: { kind: FIELD_RULE_KIND.HEX_COLOR },
  date_of_birth: date(EARLIEST_BIRTH_YEAR, true),
  founded_date: date(EARLIEST_FOUNDED_YEAR, true),
  height_cm: whole(30, 300),
  weight_kg: whole(10, 400),
  jersey_number: whole(0, 99),
  capacity: whole(0, 500_000),
  years_of_experience: whole(0, 80),
  founded_year: whole(EARLIEST_FOUNDED_YEAR, 2200),
  max_squad_size: whole(1, 500),
  max_teams: whole(2, 1_000),
  max_teams_allowed: whole(2, 1_000),
  min_teams_required: whole(2, 1_000),
  seed_number: whole(1, 1_000),
  round_number: whole(1, 1_000),
  match_day: whole(1, 1_000),
  stage_order: whole(1, 100),
  display_order: whole(0, 10_000),
  minute: whole(0, 200),
  stoppage_time_minute: whole(0, 60),
  home_team_score: whole(0, 999),
  away_team_score: whole(0, 999),
  shootout_home_score: whole(0, 99),
  shootout_away_score: whole(0, 99),
  score_change_home: whole(-99, 99),
  score_change_away: whole(-99, 99),
  max_event_edits_per_game: whole(0, 20),
  lineup_submission_deadline_hours: whole(0, 720),
  standard_game_duration_minutes: whole(1, 600),
  game_duration_minutes: whole(1, 600),
  duration_minutes: whole(0, 10_080),
  min_players_on_field: whole(1, 100),
  max_players_on_field: whole(1, 100),
  min_players_per_fixture: whole(1, 200),
  max_players_per_fixture: whole(1, 200),
  max_substitutions_per_game: whole(0, 100),
  max_substitution_windows: whole(0, 100),
  entry_fee: amount(1_000_000_000),
  prize_pool: amount(1_000_000_000_000),
  communication: whole(1, 10),
  decision_accuracy: whole(1, 10),
  fitness: whole(1, 10),
  game_control: whole(1, 10),
  overall: whole(1, 10),
};

const UNCHECKED_SUFFIXES = ["_id", "_url", "_base64", "_at"];
const UNCHECKED_EXACT = ["id", "website", "local_id"];

function matches_suffix(field_name: string, suffixes: string[]): boolean {
  return suffixes.some((suffix) => field_name.endsWith(suffix));
}

function resolve_by_suffix(field_name: string): FieldRule {
  if (matches_suffix(field_name, ["email"]))
    return { kind: FIELD_RULE_KIND.EMAIL };
  if (matches_suffix(field_name, ["phone"]))
    return { kind: FIELD_RULE_KIND.PHONE };
  if (matches_suffix(field_name, ["_color"]))
    return { kind: FIELD_RULE_KIND.HEX_COLOR };
  if (matches_suffix(field_name, ["_datetime"]))
    return { kind: FIELD_RULE_KIND.DATE_TIME };
  if (matches_suffix(field_name, ["_date", "_deadline"]))
    return date(EARLIEST_OTHER_YEAR, false);
  if (matches_suffix(field_name, ["_time"]))
    return { kind: FIELD_RULE_KIND.TIME };
  if (matches_suffix(field_name, ["_name"])) return text(NAME_MAXIMUM_LENGTH);
  if (matches_suffix(field_name, ["_description"]))
    return text(DESCRIPTION_MAXIMUM_LENGTH);
  if (matches_suffix(field_name, ["_notes", "_address"]))
    return text(NOTES_MAXIMUM_LENGTH);
  return text(OTHER_TEXT_MAXIMUM_LENGTH);
}

export function resolve_field_rule(field_name: string): FieldRule {
  const exact_rule = EXACT_FIELD_RULES[field_name];
  if (exact_rule) return exact_rule;
  if (UNCHECKED_EXACT.includes(field_name)) return UNCHECKED;
  if (matches_suffix(field_name, UNCHECKED_SUFFIXES)) return UNCHECKED;
  return resolve_by_suffix(field_name);
}

export const FIELD_LABELS: Readonly<Record<string, string>> = {
  height_cm: "Height (cm)",
  weight_kg: "Weight (kg)",
  duration_minutes: "Duration (minutes)",
  lineup_submission_deadline_hours: "Lineup submission deadline (hours)",
};

export const ORDERED_DATE_FIELD_PAIRS: ReadonlyArray<
  readonly [start_field: string, end_field: string]
> = [
  ["start_date", "end_date"],
  ["start_datetime", "end_datetime"],
  ["issue_date", "expiry_date"],
  ["employment_start_date", "employment_end_date"],
];
