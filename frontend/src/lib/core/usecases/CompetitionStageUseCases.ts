import type {
  CompetitionStage,
  CreateCompetitionStageInput,
} from "../entities/CompetitionStage";
import { validate_competition_stage_input } from "../entities/CompetitionStage";
import type {
  CompetitionStageRepository,
  FixtureRepository,
} from "../interfaces/ports";
import type { CompetitionStageUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import {
  COMPETITION_STAGE_EVENT,
  COMPETITION_STAGE_LOG_SCOPE,
  COMPETITION_STAGE_MESSAGE,
} from "./CompetitionStageConstants";
import {
  check_stage_has_no_linked_fixtures,
  list_stages_by_competition,
  reorder_stages,
} from "./CompetitionStageOrdering";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

export type CompetitionStageUseCases = CompetitionStageUseCasesPort;

const log_target = create_log_target_builder(COMPETITION_STAGE_LOG_SCOPE);

function fail_missing_stage_id(): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier(
    log_target(COMPETITION_STAGE_EVENT.ID_MISSING),
    COMPETITION_STAGE_MESSAGE.STAGE_ID_REQUIRED,
  );
}

async function create_stage(
  repository: CompetitionStageRepository,
  input: CreateCompetitionStageInput,
): AsyncResult<CompetitionStage> {
  const validation_errors = validate_competition_stage_input(input);
  if (validation_errors.length > 0)
    return fail_validation(
      log_target(COMPETITION_STAGE_EVENT.VALIDATION_FAILED),
      validation_errors.join(", "),
    );
  return relay_repository_result(
    repository.create(input),
    log_target(COMPETITION_STAGE_EVENT.CREATE_FAILED, {
      competition_id: input.competition_id,
    }),
  );
}

async function delete_stage(
  repository: CompetitionStageRepository,
  fixture_repository: FixtureRepository,
  id: ScalarValueInput<CompetitionStage["id"]>,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) return fail_missing_stage_id();
  const linked_fixtures_check = await check_stage_has_no_linked_fixtures(
    fixture_repository,
    id,
  );
  if (!linked_fixtures_check.success) return linked_fixtures_check;
  return relay_repository_result(
    repository.delete_by_id(id),
    log_target(COMPETITION_STAGE_EVENT.DELETE_FAILED, { stage_id: id }),
  );
}

export function create_competition_stage_use_cases(
  repository: CompetitionStageRepository,
  fixture_repository: FixtureRepository,
): CompetitionStageUseCases {
  return {
    create: (input) => create_stage(repository, input),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_stage_id()
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(COMPETITION_STAGE_EVENT.LOOKUP_FAILED, { stage_id: id }),
          ),
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, options ?? {}),
        log_target(COMPETITION_STAGE_EVENT.LIST_FAILED),
      ),
    update: async (id, input) =>
      is_blank_identifier(id)
        ? fail_missing_stage_id()
        : relay_repository_result(
            repository.update(id, input),
            log_target(COMPETITION_STAGE_EVENT.UPDATE_FAILED, { stage_id: id }),
          ),
    delete: (id) => delete_stage(repository, fixture_repository, id),
    list_stages_by_competition: (competition_id, options) =>
      list_stages_by_competition(repository, competition_id, options),
    reorder_stages: (competition_id, ordered_stage_ids) =>
      reorder_stages(repository, competition_id, ordered_stage_ids),
  };
}
