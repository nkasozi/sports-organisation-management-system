import { faker } from "@faker-js/faker";

import type { FakeDataOverrides } from "./fakeDataEntityNamed";
import {
  type FakeDataScenario,
  random_days_from,
  random_years_ago,
  to_iso_date,
  to_slug,
} from "./fakeDataScenario";
import {
  FAKE_DATA_BODY_TYPES,
  FAKE_DATA_FIXTURE_TIME_SLOTS,
  FAKE_DATA_NOTES,
  FAKE_DATA_VENUE_TYPES,
} from "./fakeDataVocabulary";

const CERTIFICATION_LEVELS = ["Level 1", "Level 2", "Level 3", "Badge A"];
const KIT_NAMES = ["Home Kit", "Away Kit", "Third Kit", "Training Kit"];

function issued_and_expiring(scenario: FakeDataScenario): FakeDataOverrides {
  const issued = random_years_ago(scenario.today, 0, 4);
  return {
    issue_date: to_iso_date(issued),
    expiry_date: to_iso_date(random_days_from(issued, 2 * 365, 5 * 365)),
  };
}

function a_note(): string {
  return faker.helpers.arrayElement(FAKE_DATA_NOTES);
}

export function qualification_overrides(
  scenario: FakeDataScenario,
): FakeDataOverrides {
  const level = faker.helpers.arrayElement(CERTIFICATION_LEVELS);
  const body = faker.helpers.arrayElement(FAKE_DATA_BODY_TYPES);
  return {
    certification_name: `${scenario.sport.name} Referee ${level}`,
    certification_number: `${scenario.sport.code}-${scenario.today.getFullYear()}-${faker.string.numeric(4)}`,
    issuing_authority: `Uganda ${scenario.sport.name} ${body}`,
    specializations: `${scenario.sport.name}, youth matches`,
    notes: a_note(),
    ...issued_and_expiring(scenario),
  };
}

export function identification_overrides(
  scenario: FakeDataScenario,
): FakeDataOverrides {
  return {
    identifier_value: `CM${faker.string.alphanumeric({ length: 12, casing: "upper" })}`,
    notes: a_note(),
    ...issued_and_expiring(scenario),
  };
}

export function dated_record_overrides(
  scenario: FakeDataScenario,
): FakeDataOverrides {
  const start = random_days_from(scenario.today, -365, -14);
  return {
    start_date: to_iso_date(start),
    end_date: to_iso_date(random_days_from(scenario.today, 180, 720)),
    transfer_date: to_iso_date(random_days_from(scenario.today, -60, -1)),
    employment_start_date: to_iso_date(start),
    employment_end_date: to_iso_date(
      random_days_from(scenario.today, 365, 1095),
    ),
    jersey_number: faker.number.int({ min: 1, max: 99 }),
    approved_by: `${scenario.first_name} ${scenario.last_name}`,
    notes: a_note(),
  };
}

export function fixture_overrides(
  scenario: FakeDataScenario,
): FakeDataOverrides {
  return {
    scheduled_date: to_iso_date(random_days_from(scenario.today, 3, 60)),
    scheduled_time: faker.helpers.arrayElement(FAKE_DATA_FIXTURE_TIME_SLOTS),
    venue: `${scenario.city} ${faker.helpers.arrayElement(FAKE_DATA_VENUE_TYPES)}`,
  };
}

export function presence_overrides(
  scenario: FakeDataScenario,
): FakeDataOverrides {
  const owner = `${scenario.city} ${scenario.mascot}`;
  return {
    nickname: faker.helpers.arrayElement(KIT_NAMES),
    profile_summary: `${owner} play ${scenario.sport.name.toLowerCase()} in ${scenario.city} and train three times a week.`,
    profile_slug: to_slug(`${owner} ${faker.string.numeric(3)}`),
    title: `${owner} official page`,
    url: `https://www.${to_slug(owner)}.org`,
    notes: a_note(),
    assignment_notes: a_note(),
  };
}
