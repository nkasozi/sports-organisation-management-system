import type {
  FixtureRepository,
  FixtureUseCasesPort,
} from "../interfaces/ports";
import type { Result } from "../types/Result";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";
import { update_fixture_details } from "./FixtureGuardedEdit";
import {
  FIXTURE_EVENT,
  FIXTURE_LOG_SCOPE,
  FIXTURE_MESSAGE,
  MINIMUM_ROUND_NUMBER,
} from "./FixtureUseCaseConstants";
import { SHARED_FIXTURE_WRITE_EXECUTOR } from "./FixtureWriteExecutor";
import type { KeyedSerialExecutor } from "./KeyedSerialExecutor";

type FixtureQueries = Pick<
  FixtureUseCasesPort,
  | "get_by_id"
  | "update"
  | "delete"
  | "list_fixtures_by_competition"
  | "list_fixtures_by_team"
  | "list_fixtures_by_round"
  | "list_upcoming_fixtures"
>;

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

function fail_missing_fixture_id(): Result<never> {
  return fail_missing_identifier(
    log_target(FIXTURE_EVENT.ID_MISSING),
    FIXTURE_MESSAGE.ID_REQUIRED,
  );
}

function fail_missing_competition_id(): Result<never> {
  return fail_missing_identifier(
    log_target(FIXTURE_EVENT.COMPETITION_ID_MISSING),
    FIXTURE_MESSAGE.COMPETITION_ID_REQUIRED,
  );
}

async function list_fixtures_by_round(
  repository: FixtureRepository,
  ...[competition_id, round_number, options]: Parameters<
    FixtureQueries["list_fixtures_by_round"]
  >
): ReturnType<FixtureQueries["list_fixtures_by_round"]> {
  if (is_blank_identifier(competition_id)) return fail_missing_competition_id();
  if (round_number < MINIMUM_ROUND_NUMBER)
    return fail_validation(
      log_target(FIXTURE_EVENT.ROUND_INVALID, { competition_id }),
      FIXTURE_MESSAGE.ROUND_TOO_LOW,
    );
  return relay_repository_result(
    repository.find_by_round(competition_id, round_number, options),
    log_target(FIXTURE_EVENT.LIST_FAILED, { competition_id, round_number }),
  );
}

function create_fixture_listing_queries(
  repository: FixtureRepository,
): Omit<FixtureQueries, "get_by_id" | "update" | "delete"> {
  return {
    list_fixtures_by_competition: async (competition_id, options) =>
      is_blank_identifier(competition_id)
        ? fail_missing_competition_id()
        : relay_repository_result(
            repository.find_by_competition(competition_id, options),
            log_target(FIXTURE_EVENT.LIST_FAILED, { competition_id }),
          ),
    list_fixtures_by_team: async (team_id, options) =>
      is_blank_identifier(team_id)
        ? fail_missing_identifier(
            log_target(FIXTURE_EVENT.TEAM_ID_MISSING),
            FIXTURE_MESSAGE.TEAM_ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_by_team(team_id, options),
            log_target(FIXTURE_EVENT.LIST_FAILED, { team_id }),
          ),
    list_fixtures_by_round: (competition_id, round_number, options) =>
      list_fixtures_by_round(repository, competition_id, round_number, options),
    list_upcoming_fixtures: async (competition_id, options) =>
      relay_repository_result(
        repository.find_upcoming(competition_id, options),
        log_target(FIXTURE_EVENT.LIST_FAILED, { competition_id }),
      ),
  };
}

export function create_fixture_queries(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor = SHARED_FIXTURE_WRITE_EXECUTOR,
): FixtureQueries {
  return {
    ...create_fixture_listing_queries(repository),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_fixture_id()
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(FIXTURE_EVENT.LOOKUP_FAILED, { fixture_id: id }),
          ),
    update: (id, input) =>
      update_fixture_details(repository, executor, id, input),
    delete: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_fixture_id()
        : relay_repository_result(
            repository.delete_by_id(id),
            log_target(FIXTURE_EVENT.DELETE_FAILED, { fixture_id: id }),
          ),
  };
}
