const ISO_DATE_TIME_SEPARATOR = "T";
const DAYS_BETWEEN_WEEKLY_ROUNDS = 7;
const DAYS_PER_WEEK = 7;
const FIRST_WEEKDAY = 0;
const LAST_WEEKDAY = 6;

type IsoDate = string;

function parse_iso_date_as_utc(iso_date: IsoDate): Date {
  return new Date(
    `${iso_date.split(ISO_DATE_TIME_SEPARATOR)[0]}T00:00:00.000Z`,
  );
}

function format_utc_date(date: Date): IsoDate {
  return date.toISOString().split(ISO_DATE_TIME_SEPARATOR)[0];
}

function add_utc_days(date: Date, days: number): Date {
  const next_date = new Date(date.getTime());
  next_date.setUTCDate(next_date.getUTCDate() + days);
  return next_date;
}

function normalize_match_days(match_days_per_week: number[]): Set<number> {
  return new Set(
    match_days_per_week.filter(
      (weekday) =>
        Number.isInteger(weekday) &&
        weekday >= FIRST_WEEKDAY &&
        weekday <= LAST_WEEKDAY,
    ),
  );
}

function build_weekly_round_dates(
  start: Date,
  total_rounds: number,
): IsoDate[] {
  return Array.from({ length: total_rounds }, (_, round_index) =>
    format_utc_date(
      add_utc_days(start, round_index * DAYS_BETWEEN_WEEKLY_ROUNDS),
    ),
  );
}

function build_match_day_round_dates(
  start: Date,
  match_days: Set<number>,
  total_rounds: number,
): IsoDate[] {
  const round_dates: IsoDate[] = [];
  const maximum_days_to_scan = total_rounds * DAYS_PER_WEEK;
  for (let day_offset = 0; day_offset < maximum_days_to_scan; day_offset++) {
    if (round_dates.length >= total_rounds) break;
    const candidate = add_utc_days(start, day_offset);
    if (match_days.has(candidate.getUTCDay()))
      round_dates.push(format_utc_date(candidate));
  }
  return round_dates;
}

export function build_round_dates(
  start_date: IsoDate,
  match_days_per_week: number[],
  total_rounds: number,
): IsoDate[] {
  const start = parse_iso_date_as_utc(start_date);
  const match_days = normalize_match_days(match_days_per_week);
  return match_days.size === 0
    ? build_weekly_round_dates(start, total_rounds)
    : build_match_day_round_dates(start, match_days, total_rounds);
}
