import type {
  FixtureLineupRepository,
  FixtureLineupUseCasesPort,
} from "../interfaces/ports";
import type { Result } from "../types/Result";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";
import {
  FIXTURE_LINEUP_EVENT,
  FIXTURE_LINEUP_LOG_SCOPE,
  FIXTURE_LINEUP_MESSAGE,
  LINEUP_ACTION,
} from "./FixtureLineupConstants";
import {
  create_unique_lineup,
  fail_missing_lineup_id,
  find_unlocked_lineup,
  transition_lineup,
} from "./FixtureLineupTransitions";

export type FixtureLineupUseCases = FixtureLineupUseCasesPort;

const log_target = create_log_target_builder(FIXTURE_LINEUP_LOG_SCOPE);

function fail_missing_fixture_id(): Result<never> {
  return fail_missing_identifier(
    log_target(FIXTURE_LINEUP_EVENT.FIXTURE_ID_MISSING),
    FIXTURE_LINEUP_MESSAGE.FIXTURE_ID_REQUIRED,
  );
}

async function list_lineups_by_fixture_and_team(
  repository: FixtureLineupRepository,
  ...[fixture_id, team_id, options]: Parameters<
    FixtureLineupUseCases["list_lineups_by_fixture_and_team"]
  >
): ReturnType<FixtureLineupUseCases["list_lineups_by_fixture_and_team"]> {
  if (is_blank_identifier(fixture_id)) return fail_missing_fixture_id();
  if (is_blank_identifier(team_id))
    return fail_missing_identifier(
      log_target(FIXTURE_LINEUP_EVENT.TEAM_ID_MISSING),
      FIXTURE_LINEUP_MESSAGE.TEAM_ID_REQUIRED,
    );
  return relay_repository_result(
    repository.find_by_fixture_and_team(fixture_id, team_id, options),
    log_target(FIXTURE_LINEUP_EVENT.LIST_FAILED, { fixture_id, team_id }),
  );
}

type FixtureScopedQueryName =
  | "get_lineups_for_fixture"
  | "get_lineup_for_team_in_fixture"
  | "list_lineups_by_fixture"
  | "list_lineups_by_fixture_and_team";

function create_fixture_scoped_lineup_queries(
  repository: FixtureLineupRepository,
): Pick<FixtureLineupUseCases, FixtureScopedQueryName> {
  return {
    get_lineups_for_fixture: async (fixture_id) =>
      relay_repository_result(
        repository.get_lineups_for_fixture(fixture_id),
        log_target(FIXTURE_LINEUP_EVENT.LIST_FAILED, { fixture_id }),
      ),
    get_lineup_for_team_in_fixture: async (fixture_id, team_id) =>
      repository.get_lineup_for_team_in_fixture(fixture_id, team_id),
    list_lineups_by_fixture: async (fixture_id, options) =>
      is_blank_identifier(fixture_id)
        ? fail_missing_fixture_id()
        : relay_repository_result(
            repository.find_by_fixture(fixture_id, options),
            log_target(FIXTURE_LINEUP_EVENT.LIST_FAILED, { fixture_id }),
          ),
    list_lineups_by_fixture_and_team: (fixture_id, team_id, options) =>
      list_lineups_by_fixture_and_team(
        repository,
        fixture_id,
        team_id,
        options,
      ),
  };
}

function create_lineup_queries(
  repository: FixtureLineupRepository,
): Pick<FixtureLineupUseCases, "get_by_id" | "list" | FixtureScopedQueryName> {
  return {
    ...create_fixture_scoped_lineup_queries(repository),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_lineup_id()
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(FIXTURE_LINEUP_EVENT.LOOKUP_FAILED, { lineup_id: id }),
          ),
    list: async (filter, pagination) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, pagination ?? {}),
        log_target(FIXTURE_LINEUP_EVENT.LIST_FAILED),
      ),
  };
}

export function create_fixture_lineup_use_cases(
  repository: FixtureLineupRepository,
): FixtureLineupUseCases {
  return {
    ...create_lineup_queries(repository),
    create: (input) => create_unique_lineup(repository, input),
    async update(id, input) {
      const lineup_result = await find_unlocked_lineup(
        repository,
        id,
        LINEUP_ACTION.UPDATE,
      );
      if (!lineup_result.success) return lineup_result;
      return relay_repository_result(
        repository.update(id, input),
        log_target(FIXTURE_LINEUP_EVENT.UPDATE_FAILED, { lineup_id: id }),
      );
    },
    async delete(id) {
      const lineup_result = await find_unlocked_lineup(
        repository,
        id,
        LINEUP_ACTION.DELETE,
      );
      if (!lineup_result.success) return lineup_result;
      return relay_repository_result(
        repository.delete_by_id(id),
        log_target(FIXTURE_LINEUP_EVENT.DELETE_FAILED, { lineup_id: id }),
      );
    },
    submit_lineup: (id) =>
      transition_lineup(repository, id, LINEUP_ACTION.SUBMIT),
    lock_lineup: (id) => transition_lineup(repository, id, LINEUP_ACTION.LOCK),
  };
}
