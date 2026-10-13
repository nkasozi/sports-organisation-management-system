import type {
  FixtureDetailsSetupRepository,
  FixtureDetailsSetupUseCasesPort,
} from "../interfaces/ports";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";
import { fail_missing_setup_id } from "./FixtureDetailsSetupAssignments";
import {
  DEFAULT_SETUP_PAGE_NUMBER,
  DEFAULT_SETUP_PAGE_SIZE,
  FIXTURE_DETAILS_SETUP_EVENT,
  FIXTURE_DETAILS_SETUP_LOG_SCOPE,
  FIXTURE_DETAILS_SETUP_MESSAGE,
} from "./FixtureDetailsSetupConstants";

type FixtureDetailsSetupQueries = Pick<
  FixtureDetailsSetupUseCasesPort,
  "get_by_id" | "list" | "list_by_fixture" | "list_by_official"
>;

const log_target = create_log_target_builder(FIXTURE_DETAILS_SETUP_LOG_SCOPE);

function create_setup_listing_queries(
  repository: FixtureDetailsSetupRepository,
): Pick<FixtureDetailsSetupQueries, "list_by_fixture" | "list_by_official"> {
  return {
    list_by_fixture: async (fixture_id, options) =>
      is_blank_identifier(fixture_id)
        ? fail_missing_identifier(
            log_target(FIXTURE_DETAILS_SETUP_EVENT.FIXTURE_ID_MISSING),
            FIXTURE_DETAILS_SETUP_MESSAGE.FIXTURE_ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_by_fixture(fixture_id, options),
            log_target(FIXTURE_DETAILS_SETUP_EVENT.LIST_FAILED, { fixture_id }),
          ),
    list_by_official: async (official_id, options) =>
      is_blank_identifier(official_id)
        ? fail_missing_identifier(
            log_target(FIXTURE_DETAILS_SETUP_EVENT.OFFICIAL_ID_MISSING),
            FIXTURE_DETAILS_SETUP_MESSAGE.OFFICIAL_ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_by_official(official_id, options),
            log_target(FIXTURE_DETAILS_SETUP_EVENT.LIST_FAILED, {
              official_id,
            }),
          ),
  };
}

export function create_fixture_details_setup_queries(
  repository: FixtureDetailsSetupRepository,
): FixtureDetailsSetupQueries {
  return {
    ...create_setup_listing_queries(repository),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_setup_id()
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(FIXTURE_DETAILS_SETUP_EVENT.LOOKUP_FAILED, {
              setup_id: id,
            }),
          ),
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter || {}, {
          page_number: options?.page_number || DEFAULT_SETUP_PAGE_NUMBER,
          page_size: options?.page_size || DEFAULT_SETUP_PAGE_SIZE,
        }),
        log_target(FIXTURE_DETAILS_SETUP_EVENT.LIST_FAILED),
      ),
  };
}
