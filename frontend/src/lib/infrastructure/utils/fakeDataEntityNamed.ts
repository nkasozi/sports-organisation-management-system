import { faker } from "@faker-js/faker";

import {
  type FakeDataScenario,
  initials_code,
  organisation_email,
  organisation_website,
  random_days_from,
  random_years_ago,
  street_address,
  to_code,
  to_iso_date,
  uganda_phone_number,
} from "./fakeDataScenario";
import {
  FAKE_DATA_BODY_TYPES,
  FAKE_DATA_COMPETITION_TYPES,
  FAKE_DATA_DEFAULT_VENUE_CAPACITY_RANGE,
  FAKE_DATA_HOME_COUNTRY,
  FAKE_DATA_VENUE_CAPACITY_RANGES,
  FAKE_DATA_VENUE_TYPES,
} from "./fakeDataVocabulary";

export type FakeDataOverrides = Record<string, unknown>;

const TEAM_SHORT_NAME_LENGTH = 3;

export function organization_overrides(
  scenario: FakeDataScenario,
): FakeDataOverrides {
  const body = faker.helpers.arrayElement(FAKE_DATA_BODY_TYPES);
  const name = `${scenario.city} ${scenario.sport.name} ${body}`;
  return {
    name,
    description: `The ${scenario.sport.name.toLowerCase()} ${body.toLowerCase()} for ${scenario.city}, running leagues and cups for clubs, schools and community teams.`,
    founded_date: to_iso_date(random_years_ago(scenario.today, 5, 70)),
    contact_email: organisation_email(name),
    contact_phone: uganda_phone_number(),
    address: street_address(scenario.city),
    website: organisation_website(name),
  };
}

export function competition_overrides(
  scenario: FakeDataScenario,
): FakeDataOverrides {
  const start = random_days_from(scenario.today, -14, 0);
  const type = faker.helpers.arrayElement(FAKE_DATA_COMPETITION_TYPES);
  return {
    name: `${scenario.city} ${scenario.sport.name} ${type} ${start.getFullYear()}`,
    description: `A ${scenario.sport.name.toLowerCase()} ${type.toLowerCase()} for clubs in and around ${scenario.city}.`,
    start_date: to_iso_date(start),
    end_date: to_iso_date(random_days_from(start, 60, 150)),
    registration_deadline: to_iso_date(random_days_from(start, -21, -7)),
    max_teams: faker.helpers.arrayElement([8, 12, 16, 24, 32]),
  };
}

export function team_overrides(scenario: FakeDataScenario): FakeDataOverrides {
  return {
    name: `${scenario.city} ${scenario.mascot}`,
    short_name: to_code(scenario.city, TEAM_SHORT_NAME_LENGTH),
    founded_year: faker.number.int({ min: 1960, max: 2020 }),
  };
}

const VENUE_CAPACITY_STEP = 100;

function venue_capacity_for_type(venue_type: string): number {
  const range =
    FAKE_DATA_VENUE_CAPACITY_RANGES[venue_type] ??
    FAKE_DATA_DEFAULT_VENUE_CAPACITY_RANGE;
  return faker.number.int({ ...range, multipleOf: VENUE_CAPACITY_STEP });
}

export function venue_overrides(scenario: FakeDataScenario): FakeDataOverrides {
  const owner = faker.helpers.arrayElement([scenario.city, scenario.last_name]);
  const venue_type = faker.helpers.arrayElement(FAKE_DATA_VENUE_TYPES);
  const name = `${owner} ${venue_type}`;
  return {
    name,
    short_name: initials_code(name),
    address: street_address(scenario.city),
    city: scenario.city,
    country: FAKE_DATA_HOME_COUNTRY,
    capacity: venue_capacity_for_type(venue_type),
    contact_email: organisation_email(name),
    contact_phone: uganda_phone_number(),
    website: organisation_website(name),
  };
}

export function sport_overrides(scenario: FakeDataScenario): FakeDataOverrides {
  const players = scenario.sport.players_on_field;
  return {
    name: scenario.sport.name,
    code: scenario.sport.code,
    icon_url: scenario.sport.icon,
    description: `${scenario.sport.name} played between two teams of ${players}.`,
    standard_game_duration_minutes: scenario.sport.game_minutes,
    max_players_on_field: players,
    min_players_on_field: Math.max(1, players - 2),
    max_squad_size: players * 2 + 3,
    min_players_per_fixture: players,
    max_players_per_fixture: players + Math.ceil(players / 2) + 2,
  };
}
