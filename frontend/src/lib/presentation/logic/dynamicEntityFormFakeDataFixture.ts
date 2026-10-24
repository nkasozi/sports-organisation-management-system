import type { BaseEntity } from "../../core/entities/BaseEntity";
import { OptionStatus } from "../../core/types/Option";
import { to_iso_date } from "../../infrastructure/utils/fakeDataScenario";
import {
  find_selected_option_entity,
  type ForeignKeyCandidateState,
} from "./dynamicEntityFormFakeDataCandidates";
import { is_string_value } from "./runtimeTypeGuards";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;
const EMPTY_TEXT = "";
const VENUE_OPTION_KEY_HINT = "venue";

const FIXTURE_FIELD = {
  COMPETITION: "competition_id",
  ORGANIZATION: "organization_id",
  SCHEDULED_DATE: "scheduled_date",
  VENUE: "venue",
} as const;

const OPTION_ENTITY_FIELD = {
  START_DATE: "start_date",
  END_DATE: "end_date",
  NAME: "name",
} as const;

function read_text(entity: BaseEntity, key: string): string {
  const value = (entity as unknown as Record<string, unknown>)[key];
  return is_string_value(value) ? value : EMPTY_TEXT;
}

function to_day_number(iso_date: string): number {
  return Math.floor(
    Date.parse(iso_date.slice(0, ISO_DATE_LENGTH)) / DAY_MILLISECONDS,
  );
}

function from_day_number(day_number: number): string {
  return new Date(day_number * DAY_MILLISECONDS)
    .toISOString()
    .slice(0, ISO_DATE_LENGTH);
}

function pick_date_in_competition(
  competition: BaseEntity,
  today: Date,
): string {
  const start_day = to_day_number(
    read_text(competition, OPTION_ENTITY_FIELD.START_DATE),
  );
  const end_day = to_day_number(
    read_text(competition, OPTION_ENTITY_FIELD.END_DATE),
  );
  if (
    !Number.isFinite(start_day) ||
    !Number.isFinite(end_day) ||
    end_day < start_day
  )
    return EMPTY_TEXT;
  const today_day = to_day_number(to_iso_date(today));
  const is_running = today_day >= start_day && today_day <= end_day;
  const first_day = is_running ? today_day : start_day;
  const span = end_day - first_day;
  return from_day_number(first_day + Math.floor(Math.random() * (span + 1)));
}

function scheduled_date_for(
  state: ForeignKeyCandidateState,
  today: Date,
): Record<string, unknown> {
  const competition = find_selected_option_entity(
    state,
    FIXTURE_FIELD.COMPETITION,
  );
  if (competition.status !== OptionStatus.SOME) return {};
  const date = pick_date_in_competition(competition.value, today);
  return date === EMPTY_TEXT ? {} : { [FIXTURE_FIELD.SCHEDULED_DATE]: date };
}

function list_loaded_venues(state: ForeignKeyCandidateState): BaseEntity[] {
  return Object.entries(state.foreign_key_options ?? {})
    .filter(([key]) => key.includes(VENUE_OPTION_KEY_HINT))
    .flatMap(([, options]) => options);
}

function venue_name_for(
  state: ForeignKeyCandidateState,
): Record<string, unknown> {
  const organization_id = String(
    state.form_data[FIXTURE_FIELD.ORGANIZATION] ?? EMPTY_TEXT,
  );
  const names = list_loaded_venues(state)
    .filter(
      (venue) =>
        organization_id === EMPTY_TEXT ||
        read_text(venue, FIXTURE_FIELD.ORGANIZATION) === organization_id,
    )
    .map((venue) => read_text(venue, OPTION_ENTITY_FIELD.NAME))
    .filter((name) => name !== EMPTY_TEXT);
  if (names.length === 0) return {};
  return {
    [FIXTURE_FIELD.VENUE]: names[Math.floor(Math.random() * names.length)],
  };
}

export function refine_fixture_fake_data(
  state: ForeignKeyCandidateState,
  today: Date,
): Record<string, unknown> {
  return { ...scheduled_date_for(state, today), ...venue_name_for(state) };
}
