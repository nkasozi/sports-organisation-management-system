import {
  competition_overrides,
  type FakeDataOverrides,
  organization_overrides,
  sport_overrides,
  team_overrides,
  venue_overrides,
} from "./fakeDataEntityNamed";
import {
  list_entity_overrides,
  person_overrides,
} from "./fakeDataEntityPeople";
import {
  dated_record_overrides,
  fixture_overrides,
  identification_overrides,
  presence_overrides,
  qualification_overrides,
} from "./fakeDataEntityRecords";
import { FAKE_DATA_LIST_ENTITY } from "./fakeDataRoleNames";
import type { FakeDataScenario } from "./fakeDataScenario";

type OverrideBuilder = (scenario: FakeDataScenario) => FakeDataOverrides;

const ENTITY_OVERRIDE_BUILDERS: Readonly<Record<string, OverrideBuilder>> = {
  organization: organization_overrides,
  competition: competition_overrides,
  team: team_overrides,
  venue: venue_overrides,
  sport: sport_overrides,
  player: (scenario) => person_overrides(scenario, "player"),
  official: (scenario) => person_overrides(scenario, "official"),
  teamstaff: (scenario) => ({
    ...person_overrides(scenario, "teamstaff"),
    ...dated_record_overrides(scenario),
  }),
  systemuser: (scenario) => person_overrides(scenario, "systemuser"),
  teamstaffrole: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.TEAM_STAFF_ROLE),
  gameofficialrole: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.GAME_OFFICIAL_ROLE),
  playerposition: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.PLAYER_POSITION),
  competitionformat: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.COMPETITION_FORMAT),
  competitionstage: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.COMPETITION_STAGE),
  gameeventtype: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.GAME_EVENT_TYPE),
  identificationtype: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.IDENTIFICATION_TYPE),
  gender: (scenario) =>
    list_entity_overrides(scenario, FAKE_DATA_LIST_ENTITY.GENDER),
  competition_constraint: (scenario) =>
    list_entity_overrides(
      scenario,
      FAKE_DATA_LIST_ENTITY.COMPETITION_CONSTRAINT,
    ),
  qualification: qualification_overrides,
  identification: identification_overrides,
  playerteammembership: dated_record_overrides,
  playerteamtransferhistory: dated_record_overrides,
  officialassociatedteam: dated_record_overrides,
  fixture: fixture_overrides,
  jerseycolor: presence_overrides,
  playerprofile: presence_overrides,
  teamprofile: presence_overrides,
  profilelink: presence_overrides,
  fixturedetailssetup: presence_overrides,
  game_assignment: presence_overrides,
  fixturelineup: presence_overrides,
  officialperformancerating: presence_overrides,
};

const NO_OVERRIDES: FakeDataOverrides = {};

export function build_entity_overrides(
  entity_type: string,
  scenario: FakeDataScenario,
): FakeDataOverrides {
  const builder = ENTITY_OVERRIDE_BUILDERS[entity_type];
  return builder ? builder(scenario) : NO_OVERRIDES;
}
