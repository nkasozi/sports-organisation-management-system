import { faker } from "@faker-js/faker";

import {
  create_none_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

import {
  FAKE_DATA_FEMALE_FIRST_NAMES,
  FAKE_DATA_FIRST_NAMES,
  FAKE_DATA_LAST_NAMES,
  FAKE_DATA_MALE_FIRST_NAMES,
} from "./fakeDataPeopleNames";
import {
  FAKE_DATA_CITIES,
  FAKE_DATA_SPORTS,
  FAKE_DATA_STREETS,
  FAKE_DATA_TEAM_MASCOTS,
  type FakeDataSport,
} from "./fakeDataVocabulary";

export interface FakeDataScenario {
  city: string;
  sport: FakeDataSport;
  mascot: string;
  first_name: string;
  last_name: string;
  today: Date;
}

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365;
const ISO_DATE_LENGTH = 10;
const PHONE_GROUP_DIGITS = 3;

export interface FakeDataHints {
  sport_name: Option<string>;
  gender_name: Option<string>;
}

export const NO_FAKE_DATA_HINTS: FakeDataHints = {
  sport_name: create_none_option(),
  gender_name: create_none_option(),
};

const GENDER_FIRST_NAMES: Readonly<Record<string, readonly string[]>> = {
  female: FAKE_DATA_FEMALE_FIRST_NAMES,
  male: FAKE_DATA_MALE_FIRST_NAMES,
};

function first_names_for_gender(
  gender_name: Option<string>,
): readonly string[] {
  if (gender_name.status !== OptionStatus.SOME) return FAKE_DATA_FIRST_NAMES;
  return (
    GENDER_FIRST_NAMES[gender_name.value.trim().toLowerCase()] ??
    FAKE_DATA_FIRST_NAMES
  );
}

const HINTED_SPORT_PLAYERS = 11;
const HINTED_SPORT_MINUTES = 60;
const HINTED_SPORT_CODE_LENGTH = 2;
const HINTED_SPORT_ICON = "🏆";

function resolve_scenario_sport(hints: FakeDataHints): FakeDataSport {
  if (hints.sport_name.status !== OptionStatus.SOME)
    return faker.helpers.arrayElement(FAKE_DATA_SPORTS);
  const sport_name = hints.sport_name.value;
  const known_sport = FAKE_DATA_SPORTS.find(
    (sport) => sport.name.toLowerCase() === sport_name.toLowerCase(),
  );
  return (
    known_sport ?? {
      name: sport_name,
      code: to_code(sport_name, HINTED_SPORT_CODE_LENGTH),
      icon: HINTED_SPORT_ICON,
      players_on_field: HINTED_SPORT_PLAYERS,
      game_minutes: HINTED_SPORT_MINUTES,
    }
  );
}

export function create_fake_data_scenario(
  hints: FakeDataHints = NO_FAKE_DATA_HINTS,
): FakeDataScenario {
  return {
    city: faker.helpers.arrayElement(FAKE_DATA_CITIES),
    sport: resolve_scenario_sport(hints),
    mascot: faker.helpers.arrayElement(FAKE_DATA_TEAM_MASCOTS),
    first_name: faker.helpers.arrayElement(
      first_names_for_gender(hints.gender_name),
    ),
    last_name: faker.helpers.arrayElement(FAKE_DATA_LAST_NAMES),
    today: new Date(),
  };
}

export function to_iso_date(date: Date): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

function shift_days(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MILLISECONDS);
}

export function random_days_from(
  date: Date,
  min_days: number,
  max_days: number,
): Date {
  return shift_days(date, faker.number.int({ min: min_days, max: max_days }));
}

export function random_years_ago(
  today: Date,
  min_years: number,
  max_years: number,
): Date {
  return random_days_from(
    today,
    -max_years * DAYS_PER_YEAR,
    -min_years * DAYS_PER_YEAR,
  );
}

export function to_slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function to_code(text: string, length: number): string {
  return text
    .replace(/[^A-Za-z]/g, "")
    .slice(0, length)
    .toUpperCase();
}

export function initials_code(text: string): string {
  return text
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 4);
}

function digit_group(): string {
  return faker.string.numeric(PHONE_GROUP_DIGITS);
}

export function uganda_phone_number(): string {
  return `+256 7${faker.string.numeric(2)} ${digit_group()} ${digit_group()}`;
}

export function street_address(city: string): string {
  const plot = faker.number.int({ min: 1, max: 250 });
  return `Plot ${plot}, ${faker.helpers.arrayElement(FAKE_DATA_STREETS)}, ${city}`;
}

export function person_email(first_name: string, last_name: string): string {
  return faker.internet
    .email({ firstName: first_name, lastName: last_name })
    .toLowerCase();
}

export function organisation_email(name: string): string {
  return `info@${to_slug(name)}.org`;
}

export function organisation_website(name: string): string {
  return `https://www.${to_slug(name)}.org`;
}
