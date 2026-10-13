import type {
  ActivityCategoryRepository,
  ActivityRepository,
  ActivityUseCasesPort,
  CompetitionRepository,
  FixtureRepository,
  TeamRepository,
} from "../interfaces/ports";
import { load_calendar_events } from "./ActivityCalendarEvents";
import {
  create_activity,
  delete_activity,
  fail_missing_activity_id,
  update_activity,
} from "./ActivityMutations";
import { create_activity_sync } from "./ActivitySyncUseCases";
import {
  ACTIVITY_EVENT,
  ACTIVITY_LOG_SCOPE,
  ACTIVITY_MESSAGE,
} from "./ActivityUseCaseConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

type ActivityUseCases = ActivityUseCasesPort;

interface ActivityUseCasesDependencies {
  activity_repository: ActivityRepository;
  activity_category_repository: ActivityCategoryRepository;
  competition_repository: CompetitionRepository;
  fixture_repository: FixtureRepository;
  team_repository: TeamRepository;
}

const log_target = create_log_target_builder(ACTIVITY_LOG_SCOPE);

function fail_missing_organization_id(): ReturnType<
  typeof fail_missing_identifier
> {
  return fail_missing_identifier(
    log_target(ACTIVITY_EVENT.ORGANIZATION_ID_MISSING),
    ACTIVITY_MESSAGE.ORGANIZATION_ID_REQUIRED,
  );
}

function create_activity_scoped_queries(
  repository: ActivityRepository,
): Pick<
  ActivityUseCases,
  "list_by_category" | "list_by_team" | "list_by_competition"
> {
  const list_failed = log_target(ACTIVITY_EVENT.LIST_FAILED);
  return {
    list_by_category: async (organization_id, category_id, options) =>
      relay_repository_result(
        repository.find_by_category(organization_id, category_id, options),
        list_failed,
      ),
    list_by_team: async (organization_id, team_id, options) =>
      relay_repository_result(
        repository.find_by_team(organization_id, team_id, options),
        list_failed,
      ),
    list_by_competition: async (competition_id, options) =>
      relay_repository_result(
        repository.find_by_competition(competition_id, options),
        list_failed,
      ),
  };
}

function create_activity_queries(
  repository: ActivityRepository,
): Pick<
  ActivityUseCases,
  "list" | "get_by_id" | "list_by_organization" | "list_by_date_range"
> {
  return {
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, options ?? {}),
        log_target(ACTIVITY_EVENT.LIST_FAILED),
      ),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_activity_id()
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(ACTIVITY_EVENT.LOOKUP_FAILED, { activity_id: id }),
          ),
    list_by_organization: async (organization_id, options) =>
      is_blank_identifier(organization_id)
        ? fail_missing_organization_id()
        : relay_repository_result(
            repository.find_by_organization(organization_id, options ?? {}),
            log_target(ACTIVITY_EVENT.LIST_FAILED, { organization_id }),
          ),
    list_by_date_range: async (organization_id, date_range, options) =>
      is_blank_identifier(organization_id)
        ? fail_missing_organization_id()
        : relay_repository_result(
            repository.find_by_date_range(
              organization_id,
              date_range.start_date,
              date_range.end_date,
              options,
            ),
            log_target(ACTIVITY_EVENT.LIST_FAILED, { organization_id }),
          ),
  };
}

export function create_activity_use_cases(
  dependencies: ActivityUseCasesDependencies,
): ActivityUseCases {
  const { activity_repository, activity_category_repository } = dependencies;
  return {
    ...create_activity_queries(activity_repository),
    ...create_activity_scoped_queries(activity_repository),
    create: (input) => create_activity(activity_repository, input),
    update: (id, input) => update_activity(activity_repository, id, input),
    delete: (id) => delete_activity(activity_repository, id),
    get_calendar_events: (organization_id, date_range, filter) =>
      load_calendar_events(activity_repository, activity_category_repository, {
        organization_id,
        date_range,
        filter,
      }),
    ...create_activity_sync(dependencies),
  };
}
