import type { CompetitionStage } from "../entities/CompetitionStage";
import type {
  CompetitionStageRepository,
  FixtureRepository,
  QueryOptions,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  build_linked_fixtures_message,
  build_reorder_failed_message,
  COMPETITION_STAGE_EVENT,
  COMPETITION_STAGE_LOG_SCOPE,
  COMPETITION_STAGE_MESSAGE,
  FIXTURE_PRESENCE_PAGE_SIZE,
} from "./CompetitionStageConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_failure,
} from "./FailureRelay";

type StageCompetitionId = ScalarValueInput<CompetitionStage["competition_id"]>;

const log_target = create_log_target_builder(COMPETITION_STAGE_LOG_SCOPE);

function fail_missing_competition_id(): ReturnType<
  typeof fail_missing_identifier
> {
  return fail_missing_identifier(
    log_target(COMPETITION_STAGE_EVENT.COMPETITION_ID_MISSING),
    COMPETITION_STAGE_MESSAGE.COMPETITION_ID_REQUIRED,
  );
}

export async function check_stage_has_no_linked_fixtures(
  fixture_repository: FixtureRepository,
  stage_id: ScalarValueInput<CompetitionStage["id"]>,
): AsyncResult<boolean> {
  const fixtures_result = await fixture_repository.find_all(
    { stage_id } as Parameters<typeof fixture_repository.find_all>[0],
    { page_size: FIXTURE_PRESENCE_PAGE_SIZE },
  );
  if (!fixtures_result.success)
    return fail_use_case({
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      ...log_target(COMPETITION_STAGE_EVENT.LINKED_FIXTURE_CHECK_FAILED, {
        stage_id,
      }),
      technical_detail: fixtures_result.error,
    });
  const fixture_count = fixtures_result.data.total_count;
  if (fixture_count === 0) return create_success_result(true);
  return fail_use_case({
    code: UseCaseErrorCode.CONFLICT,
    ...log_target(COMPETITION_STAGE_EVENT.LINKED_FIXTURES_BLOCK_DELETE, {
      stage_id,
      fixture_count,
    }),
    user_message: build_linked_fixtures_message(fixture_count),
  });
}

export async function list_stages_by_competition(
  repository: CompetitionStageRepository,
  competition_id: StageCompetitionId,
  options?: QueryOptions,
): PaginatedAsyncResult<CompetitionStage> {
  if (is_blank_identifier(competition_id)) return fail_missing_competition_id();
  const result = await repository.find_by_competition(competition_id, options);
  if (!result.success)
    return relay_repository_failure(
      log_target(COMPETITION_STAGE_EVENT.LIST_FAILED, { competition_id }),
      result.error,
    );
  const sorted_stages = [...result.data.items].sort(
    (left, right) => left.stage_order - right.stage_order,
  );
  return create_success_result({ ...result.data, items: sorted_stages });
}

export async function reorder_stages(
  repository: CompetitionStageRepository,
  competition_id: StageCompetitionId,
  ordered_stage_ids: Array<ScalarValueInput<CompetitionStage["id"]>>,
): AsyncResult<boolean> {
  if (is_blank_identifier(competition_id)) return fail_missing_competition_id();
  if (!ordered_stage_ids || ordered_stage_ids.length === 0)
    return fail_missing_identifier(
      log_target(COMPETITION_STAGE_EVENT.REORDER_IDS_MISSING, {
        competition_id,
      }),
      COMPETITION_STAGE_MESSAGE.REORDER_IDS_REQUIRED,
    );
  for (const [index, stage_id] of ordered_stage_ids.entries()) {
    const update_result = await repository.update(stage_id, {
      stage_order: index + 1,
    });
    if (!update_result.success)
      return relay_repository_failure(
        log_target(COMPETITION_STAGE_EVENT.REORDER_FAILED, {
          competition_id,
          stage_id,
        }),
        build_reorder_failed_message(stage_id, update_result.error),
      );
  }
  return create_success_result(true);
}
