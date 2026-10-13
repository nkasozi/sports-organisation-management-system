import type { Activity } from "../entities/Activity";
import { ACTIVITY_CATEGORY_TYPE } from "../entities/ActivityCategory";
import type { Fixture } from "../entities/Fixture";
import { ACTIVITY_SOURCE_TYPE } from "../entities/StatusConstants";
import type {
  ActivityCategoryRepository,
  ActivityRepository,
  ActivityUseCasesPort,
  CompetitionRepository,
  FixtureRepository,
  TeamRepository,
} from "../interfaces/ports";
import { create_success_result, type Result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import { sync_sources_to_activities } from "./ActivitySourceSync";
import {
  build_competition_activity_draft,
  build_fixture_activity_draft,
} from "./ActivitySyncDrafts";
import { find_activity_category_by_type } from "./ActivitySyncUseCasesHelpers";
import {
  ACTIVITY_SYNC_EVENT,
  ACTIVITY_SYNC_LOG_SCOPE,
  ACTIVITY_SYNC_MESSAGE,
  FIXTURE_SYNC_PAGE_SIZE,
} from "./ActivityUseCaseConstants";
import {
  create_log_target_builder,
  relay_repository_failure,
} from "./FailureRelay";

type ActivitySyncMethods = Pick<
  ActivityUseCasesPort,
  | "sync_competitions_to_activities"
  | "sync_fixtures_to_activities"
  | "find_activity_by_source"
>;

interface ActivitySyncDependencies {
  activity_repository: ActivityRepository;
  activity_category_repository: ActivityCategoryRepository;
  competition_repository: CompetitionRepository;
  fixture_repository: FixtureRepository;
  team_repository: TeamRepository;
}

type SyncCompetitions = ActivitySyncMethods["sync_competitions_to_activities"];
type SyncFixtures = ActivitySyncMethods["sync_fixtures_to_activities"];
type OrganizationId = Parameters<SyncCompetitions>[0];

interface CategoryRequirement {
  category_type: Activity["category_type"];
  missing_event: string;
  missing_message: string;
}

const log_target = create_log_target_builder(ACTIVITY_SYNC_LOG_SCOPE);

const COMPETITION_CATEGORY: CategoryRequirement = {
  category_type: ACTIVITY_CATEGORY_TYPE.COMPETITION,
  missing_event: ACTIVITY_SYNC_EVENT.COMPETITION_CATEGORY_MISSING,
  missing_message: ACTIVITY_SYNC_MESSAGE.COMPETITION_CATEGORY_MISSING,
};

const FIXTURE_CATEGORY: CategoryRequirement = {
  category_type: ACTIVITY_CATEGORY_TYPE.FIXTURE,
  missing_event: ACTIVITY_SYNC_EVENT.FIXTURE_CATEGORY_MISSING,
  missing_message: ACTIVITY_SYNC_MESSAGE.FIXTURE_CATEGORY_MISSING,
};

async function require_category(
  dependencies: ActivitySyncDependencies,
  organization_id: OrganizationId,
  requirement: CategoryRequirement,
): Promise<Result<Activity["category_id"]>> {
  const category_result = await find_activity_category_by_type(
    dependencies.activity_category_repository,
    organization_id,
    requirement.category_type,
  );
  if (category_result.success) return category_result;
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    ...log_target(requirement.missing_event, { organization_id }),
    user_message: requirement.missing_message,
    technical_detail: category_result.error,
  });
}

async function sync_competitions(
  dependencies: ActivitySyncDependencies,
  organization_id: OrganizationId,
): ReturnType<SyncCompetitions> {
  const category_result = await require_category(
    dependencies,
    organization_id,
    COMPETITION_CATEGORY,
  );
  if (!category_result.success) return category_result;
  const competitions_result =
    await dependencies.competition_repository.find_by_organization(
      organization_id,
    );
  if (!competitions_result.success)
    return relay_repository_failure(
      log_target(ACTIVITY_SYNC_EVENT.COMPETITIONS_FETCH_FAILED, {
        organization_id,
      }),
      competitions_result.error,
    );
  const counts = await sync_sources_to_activities(
    dependencies.activity_repository,
    ACTIVITY_SOURCE_TYPE.COMPETITION,
    competitions_result.data.items,
    async (competition) =>
      build_competition_activity_draft(
        competition,
        organization_id,
        category_result.data,
      ),
  );
  return create_success_result(counts);
}

async function load_fixtures_for_sync(
  dependencies: ActivitySyncDependencies,
  competition_id: Parameters<SyncFixtures>[1],
): Promise<Result<Fixture[]>> {
  const fixtures_result = competition_id
    ? await dependencies.fixture_repository.find_by_competition(competition_id)
    : await dependencies.fixture_repository.find_all(
        {},
        { page_size: FIXTURE_SYNC_PAGE_SIZE },
      );
  if (!fixtures_result.success)
    return relay_repository_failure(
      log_target(ACTIVITY_SYNC_EVENT.FIXTURES_FETCH_FAILED, { competition_id }),
      fixtures_result.error,
    );
  console.log(ACTIVITY_SYNC_LOG_SCOPE, {
    event: ACTIVITY_SYNC_EVENT.FIXTURES_LOADED,
    competition_id,
    count: fixtures_result.data.items.length,
  });
  return create_success_result(fixtures_result.data.items);
}

async function sync_fixtures(
  dependencies: ActivitySyncDependencies,
  organization_id: OrganizationId,
  competition_id: Parameters<SyncFixtures>[1],
): ReturnType<SyncFixtures> {
  console.log(ACTIVITY_SYNC_LOG_SCOPE, {
    event: ACTIVITY_SYNC_EVENT.FIXTURE_SYNC_STARTED,
    organization_id,
    competition_id,
  });
  const category_result = await require_category(
    dependencies,
    organization_id,
    FIXTURE_CATEGORY,
  );
  if (!category_result.success) return category_result;
  const fixtures_result = await load_fixtures_for_sync(
    dependencies,
    competition_id,
  );
  if (!fixtures_result.success) return fixtures_result;
  const counts = await sync_sources_to_activities(
    dependencies.activity_repository,
    ACTIVITY_SOURCE_TYPE.FIXTURE,
    fixtures_result.data,
    (fixture) =>
      build_fixture_activity_draft(
        dependencies.team_repository,
        fixture,
        organization_id,
        category_result.data,
      ),
  );
  return create_success_result(counts);
}

export function create_activity_sync(
  dependencies: ActivitySyncDependencies,
): ActivitySyncMethods {
  return {
    sync_competitions_to_activities: (organization_id) =>
      sync_competitions(dependencies, organization_id),
    sync_fixtures_to_activities: (organization_id, competition_id) =>
      sync_fixtures(dependencies, organization_id, competition_id),
    find_activity_by_source: (source_type, source_id) =>
      dependencies.activity_repository.find_by_source(source_type, source_id),
  };
}
