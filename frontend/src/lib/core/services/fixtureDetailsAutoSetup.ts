import type { Fixture } from "../entities/Fixture";
import type {
  CreateFixtureDetailsSetupInput,
  FixtureDetailsSetup,
} from "../entities/FixtureDetailsSetup";
import {
  CONFIRMATION_STATUS,
  ENTITY_STATUS,
} from "../entities/StatusConstants";
import type { Result } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  FIXTURE_DETAILS_AUTO_SETUP_EVENT,
  FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE,
  FIXTURE_DETAILS_AUTO_SETUP_MESSAGES,
} from "./FixtureDetailsAutoSetupConstants";
import {
  type AutoSetupDependencies,
  type AutoSetupLookups,
  load_auto_setup_lookups,
} from "./fixtureDetailsAutoSetupLookups";
import {
  assign_officials_to_slots,
  build_official_role_slots,
  type OfficialRequirementSource,
} from "./officialRoleSlots";

export type { AutoSetupDependencies } from "./fixtureDetailsAutoSetupLookups";

interface JerseySelection {
  home_team_jersey_id: string;
  away_team_jersey_id: string;
  official_jersey_id: string;
}

export async function auto_create_fixture_details_setup(
  fixture: Fixture,
  dependencies: AutoSetupDependencies,
  official_requirements: readonly OfficialRequirementSource[],
): Promise<Result<FixtureDetailsSetup>> {
  console.debug(FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE, {
    event: FIXTURE_DETAILS_AUTO_SETUP_EVENT.STARTED,
    fixture_id: fixture.id,
  });
  const lookups_result = await load_auto_setup_lookups(fixture, dependencies);
  if (!lookups_result.success) return lookups_result;
  const input_result = build_auto_populated_input(
    fixture,
    lookups_result.data,
    official_requirements,
  );
  if (!input_result.success) return input_result;
  const create_result =
    await dependencies.fixture_details_setup_use_cases.create(
      input_result.data,
    );
  if (!create_result.success) {
    return fail_use_case({
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      event: FIXTURE_DETAILS_AUTO_SETUP_EVENT.CREATE_FAILED,
      log_scope: FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE,
      context: { fixture_id: fixture.id },
      user_message: create_result.error,
      technical_detail: create_result.error,
    });
  }
  console.debug(FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE, {
    event: FIXTURE_DETAILS_AUTO_SETUP_EVENT.CREATED,
    fixture_id: fixture.id,
    fixture_details_setup_id: create_result.data.id,
  });
  return create_result;
}

function select_jerseys(
  fixture: Fixture,
  lookups: AutoSetupLookups,
): Result<JerseySelection, string[]> {
  const [home] = lookups.home_jerseys;
  const [away] = lookups.away_jerseys;
  const [official] = lookups.official_jerseys;
  if (home && away && official) {
    return create_success_result({
      home_team_jersey_id: home.id,
      away_team_jersey_id: away.id,
      official_jersey_id: official.id,
    });
  }
  const messages = FIXTURE_DETAILS_AUTO_SETUP_MESSAGES;
  return create_failure_result([
    ...(home ? [] : [messages.missing_home_jersey(fixture.home_team_id)]),
    ...(away ? [] : [messages.missing_away_jersey(fixture.away_team_id)]),
    ...(official
      ? []
      : [messages.missing_official_jersey(fixture.competition_id)]),
  ]);
}

function collect_official_errors(
  fixture: Fixture,
  lookups: AutoSetupLookups,
): string[] {
  const has_officials = lookups.officials.length > 0;
  const has_roles = lookups.official_roles.length > 0;
  const messages = FIXTURE_DETAILS_AUTO_SETUP_MESSAGES;
  return [
    ...(has_roles && !has_officials
      ? [messages.missing_officials(fixture.organization_id)]
      : []),
    ...(has_officials && !has_roles
      ? [messages.missing_official_roles(fixture.competition_id)]
      : []),
  ];
}

function fail_missing_data(
  fixture: Fixture,
  errors: string[],
): Result<never, string> {
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    event: FIXTURE_DETAILS_AUTO_SETUP_EVENT.MISSING_DATA,
    log_scope: FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE,
    context: { fixture_id: fixture.id, missing_count: errors.length },
    user_message: errors.join(", "),
  });
}

function build_auto_populated_input(
  fixture: Fixture,
  lookups: AutoSetupLookups,
  official_requirements: readonly OfficialRequirementSource[],
): Result<CreateFixtureDetailsSetupInput> {
  const jersey_result = select_jerseys(fixture, lookups);
  const official_errors = collect_official_errors(fixture, lookups);
  if (!jersey_result.success) {
    return fail_missing_data(fixture, [
      ...jersey_result.error,
      ...official_errors,
    ]);
  }
  if (official_errors.length > 0) {
    return fail_missing_data(fixture, official_errors);
  }
  return create_success_result({
    organization_id: fixture.organization_id,
    fixture_id: fixture.id,
    ...jersey_result.data,
    assigned_officials: assign_officials_to_slots(
      lookups.officials,
      build_official_role_slots(official_requirements, lookups.official_roles),
    ),
    assignment_notes: "",
    confirmation_status: CONFIRMATION_STATUS.CONFIRMED,
    status: ENTITY_STATUS.ACTIVE,
  });
}
