import { faker } from "@faker-js/faker";

import type { FakeDataOverrides } from "./fakeDataEntityNamed";
import { FAKE_DATA_FIRST_NAMES } from "./fakeDataPeopleNames";
import {
  FAKE_DATA_LIST_ENTITY,
  FAKE_DATA_ROLE_NAMES,
  type FakeDataNamedListEntity,
} from "./fakeDataRoleNames";
import {
  type FakeDataScenario,
  initials_code,
  person_email,
  random_years_ago,
  to_iso_date,
  uganda_phone_number,
} from "./fakeDataScenario";
import { FAKE_DATA_NOTES } from "./fakeDataVocabulary";

const PERSON_AGE_RANGE = {
  player: { min: 16, max: 35 },
  official: { min: 25, max: 60 },
  teamstaff: { min: 25, max: 65 },
  systemuser: { min: 20, max: 60 },
} as const;

type FakeDataPersonEntity = keyof typeof PERSON_AGE_RANGE;

function emergency_contact(scenario: FakeDataScenario): FakeDataOverrides {
  return {
    emergency_contact_name: `${faker.helpers.arrayElement(FAKE_DATA_FIRST_NAMES)} ${scenario.last_name}`,
    emergency_contact_phone: uganda_phone_number(),
  };
}

export function person_overrides(
  scenario: FakeDataScenario,
  entity: FakeDataPersonEntity,
): FakeDataOverrides {
  const age = PERSON_AGE_RANGE[entity];
  return {
    first_name: scenario.first_name,
    last_name: scenario.last_name,
    email: person_email(scenario.first_name, scenario.last_name),
    phone: uganda_phone_number(),
    date_of_birth: to_iso_date(
      random_years_ago(scenario.today, age.min, age.max),
    ),
    height_cm: faker.number.int({ min: 155, max: 200 }),
    weight_kg: faker.number.int({ min: 50, max: 105 }),
    years_of_experience: faker.number.int({ min: 1, max: 25 }),
    medical_notes: "No known conditions.",
    notes: faker.helpers.arrayElement(FAKE_DATA_NOTES),
    ...emergency_contact(scenario),
  };
}

function list_entity_description(
  entity: FakeDataNamedListEntity,
  name: string,
  scenario: FakeDataScenario,
): string {
  switch (entity) {
    case FAKE_DATA_LIST_ENTITY.TEAM_STAFF_ROLE:
    case FAKE_DATA_LIST_ENTITY.GAME_OFFICIAL_ROLE:
      return `The ${name.toLowerCase()} role for ${scenario.sport.name.toLowerCase()} matches.`;
    case FAKE_DATA_LIST_ENTITY.PLAYER_POSITION:
      return `${name} position in ${scenario.sport.name.toLowerCase()}.`;
    case FAKE_DATA_LIST_ENTITY.COMPETITION_FORMAT:
    case FAKE_DATA_LIST_ENTITY.COMPETITION_STAGE:
      return `${name} format for ${scenario.sport.name.toLowerCase()} competitions.`;
    case FAKE_DATA_LIST_ENTITY.GAME_EVENT_TYPE:
      return `Recorded when a ${name.toLowerCase()} happens during a match.`;
    case FAKE_DATA_LIST_ENTITY.IDENTIFICATION_TYPE:
      return `A ${name} used to confirm who a player or official is.`;
    case FAKE_DATA_LIST_ENTITY.GENDER:
      return `${name} category.`;
    case FAKE_DATA_LIST_ENTITY.COMPETITION_CONSTRAINT:
      return `${name} rule applied to every team in the competition.`;
  }
}

export function list_entity_overrides(
  scenario: FakeDataScenario,
  entity: FakeDataNamedListEntity,
): FakeDataOverrides {
  const name = faker.helpers.arrayElement(FAKE_DATA_ROLE_NAMES[entity]);
  return {
    name,
    code: initials_code(name),
    description: list_entity_description(entity, name, scenario),
    identifier_field_label: `${name} Number`,
    icon: scenario.sport.icon,
    display_order: faker.number.int({ min: 1, max: 10 }),
  };
}
