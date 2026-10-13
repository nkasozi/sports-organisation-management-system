import type { Competition } from "../entities/Competition";
import type { CompetitionStage } from "../entities/CompetitionStage";
import type {
  CompetitionFormatRepository,
  CompetitionStageRepository,
  FixtureRepository,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  COMPETITION_STAGE_EVENT,
  COMPETITION_STAGE_LIFECYCLE_LOG_SCOPE,
  COMPETITION_STAGE_MESSAGE,
  FIXTURE_PRESENCE_PAGE_SIZE,
  STAGE_LOOKUP_PAGE_SIZE,
} from "./CompetitionStageConstants";
import {
  create_stages_from_format,
  type StageCreationCommand,
  type StageCreationRepositories,
} from "./CompetitionStageCreation";
import type { CompetitionStageLifecyclePort } from "./CompetitionUseCases";
import {
  create_log_target_builder,
  relay_repository_failure,
} from "./FailureRelay";

type CompetitionId = ScalarValueInput<Competition["id"]>;

interface StageLifecycleRepositories extends StageCreationRepositories {
  fixture_repository: FixtureRepository;
}

const STAGE_INVENTORY_STATUS = {
  EMPTY: "empty",
  POPULATED: "populated",
} as const;

type StageInventory =
  | { status: typeof STAGE_INVENTORY_STATUS.EMPTY }
  | {
      status: typeof STAGE_INVENTORY_STATUS.POPULATED;
      stages: CompetitionStage[];
    };

const log_target = create_log_target_builder(
  COMPETITION_STAGE_LIFECYCLE_LOG_SCOPE,
);

function classify_stage_inventory(stages: CompetitionStage[]): StageInventory {
  return stages.length === 0
    ? { status: STAGE_INVENTORY_STATUS.EMPTY }
    : { status: STAGE_INVENTORY_STATUS.POPULATED, stages };
}

async function load_stage_inventory(
  repository: CompetitionStageRepository,
  competition_id: CompetitionId,
): AsyncResult<StageInventory> {
  const stages_result = await repository.find_by_competition(competition_id, {
    page_size: STAGE_LOOKUP_PAGE_SIZE,
  });
  if (!stages_result.success)
    return relay_repository_failure(
      log_target(COMPETITION_STAGE_EVENT.LIST_FAILED, { competition_id }),
      stages_result.error,
    );
  return create_success_result(
    classify_stage_inventory(stages_result.data.items),
  );
}

async function ensure_stages(
  repositories: StageLifecycleRepositories,
  command: StageCreationCommand,
): AsyncResult<boolean> {
  const inventory_result = await load_stage_inventory(
    repositories.competition_stage_repository,
    command.competition_id,
  );
  if (!inventory_result.success) return inventory_result;
  switch (inventory_result.data.status) {
    case STAGE_INVENTORY_STATUS.POPULATED:
      return create_success_result(true);
    case STAGE_INVENTORY_STATUS.EMPTY:
      return create_stages_from_format(repositories, command);
  }
}

async function can_replace_stages(
  fixture_repository: FixtureRepository,
  competition_id: CompetitionId,
): AsyncResult<boolean> {
  const fixtures_result = await fixture_repository.find_by_competition(
    competition_id,
    { page_size: FIXTURE_PRESENCE_PAGE_SIZE },
  );
  if (!fixtures_result.success)
    return relay_repository_failure(
      log_target(COMPETITION_STAGE_EVENT.FIXTURE_CHECK_FAILED, {
        competition_id,
      }),
      fixtures_result.error,
    );
  if (fixtures_result.data.total_count === 0)
    return create_success_result(true);
  return fail_use_case({
    code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
    ...log_target(COMPETITION_STAGE_EVENT.FIXTURES_BLOCK_REPLACEMENT, {
      competition_id,
      fixture_count: fixtures_result.data.total_count,
    }),
    user_message: COMPETITION_STAGE_MESSAGE.FIXTURES_BLOCK_REPLACEMENT,
  });
}

async function delete_existing_stages(
  repository: CompetitionStageRepository,
  inventory: StageInventory,
): AsyncResult<boolean> {
  switch (inventory.status) {
    case STAGE_INVENTORY_STATUS.EMPTY:
      return create_success_result(true);
    case STAGE_INVENTORY_STATUS.POPULATED:
      for (const stage of inventory.stages) {
        const delete_result = await repository.delete_by_id(stage.id);
        if (!delete_result.success)
          return relay_repository_failure(
            log_target(COMPETITION_STAGE_EVENT.DELETE_FAILED, {
              stage_id: stage.id,
            }),
            delete_result.error,
          );
      }
      return create_success_result(true);
  }
}

async function replace_stages(
  repositories: StageLifecycleRepositories,
  command: StageCreationCommand,
): AsyncResult<boolean> {
  const can_replace_result = await can_replace_stages(
    repositories.fixture_repository,
    command.competition_id,
  );
  if (!can_replace_result.success) return can_replace_result;
  const inventory_result = await load_stage_inventory(
    repositories.competition_stage_repository,
    command.competition_id,
  );
  if (!inventory_result.success) return inventory_result;
  const delete_result = await delete_existing_stages(
    repositories.competition_stage_repository,
    inventory_result.data,
  );
  if (!delete_result.success) return delete_result;
  return create_stages_from_format(repositories, command);
}

export function create_competition_stage_lifecycle(
  competition_format_repository: CompetitionFormatRepository,
  competition_stage_repository: CompetitionStageRepository,
  fixture_repository: FixtureRepository,
): CompetitionStageLifecyclePort {
  const repositories: StageLifecycleRepositories = {
    competition_format_repository,
    competition_stage_repository,
    fixture_repository,
  };
  return {
    ensure_stages_for_competition: (competition_id, competition_format_id) =>
      ensure_stages(repositories, { competition_id, competition_format_id }),
    can_replace_stages_for_competition: (competition_id) =>
      can_replace_stages(fixture_repository, competition_id),
    replace_stages_for_competition: (competition_id, competition_format_id) =>
      replace_stages(repositories, { competition_id, competition_format_id }),
  };
}
