import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../entities/Competition";
import { validate_competition_input } from "../entities/Competition";
import type { CompetitionRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  COMPETITION_EVENT,
  COMPETITION_LOG_SCOPE,
  COMPETITION_MESSAGE,
  COMPETITION_OPERATION,
} from "./CompetitionConstants";
import {
  plan_stage_reconciliation,
  STAGE_RECONCILIATION_KIND,
  type StageReconciliationPlan,
} from "./CompetitionStageReconciliation";
import type { CompetitionStageLifecyclePort } from "./CompetitionUseCases";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
  relay_repository_failure,
} from "./FailureRelay";

type CompetitionId = ScalarValueInput<Competition["id"]>;

interface CompetitionMutationDependencies {
  repository: CompetitionRepository;
  stage_lifecycle: CompetitionStageLifecyclePort;
}

const log_target = create_log_target_builder(COMPETITION_LOG_SCOPE);

async function roll_back_created_competition(
  repository: CompetitionRepository,
  competition_id: Competition["id"],
): Promise<void> {
  const rollback_result = await repository.delete_by_id(competition_id);
  if (rollback_result.success) return;
  console.error(COMPETITION_LOG_SCOPE, {
    event: COMPETITION_EVENT.CREATE_ROLLBACK_FAILED,
    competition_id,
    technical_detail: rollback_result.error,
  });
}

export async function create_competition(
  dependencies: CompetitionMutationDependencies,
  input: CreateCompetitionInput,
): AsyncResult<Competition> {
  const validation_errors = validate_competition_input(input);
  if (validation_errors.length > 0)
    return fail_validation(
      log_target(COMPETITION_EVENT.VALIDATION_FAILED, {}),
      validation_errors.join(", "),
    );
  const create_result = await dependencies.repository.create(input);
  if (!create_result.success)
    return relay_repository_failure(
      log_target(COMPETITION_EVENT.CREATE_FAILED, {}),
      create_result.error,
    );
  const competition = create_result.data;
  const stages_result =
    await dependencies.stage_lifecycle.ensure_stages_for_competition(
      competition.id,
      competition.competition_format_id,
    );
  if (stages_result.success) return create_success_result(competition);
  await roll_back_created_competition(dependencies.repository, competition.id);
  return relay_repository_failure(
    log_target(COMPETITION_EVENT.STAGE_SETUP_FAILED, {
      competition_id: competition.id,
    }),
    stages_result.error,
  );
}

async function ensure_stages_can_be_replaced(
  dependencies: CompetitionMutationDependencies,
  id: CompetitionId,
  plan: StageReconciliationPlan,
): AsyncResult<boolean> {
  switch (plan.kind) {
    case STAGE_RECONCILIATION_KIND.KEEP_FORMAT:
      return create_success_result(true);
    case STAGE_RECONCILIATION_KIND.REPLACE_FORMAT: {
      const can_replace_result =
        await dependencies.stage_lifecycle.can_replace_stages_for_competition(
          id,
        );
      return can_replace_result.success
        ? can_replace_result
        : relay_repository_failure(
            log_target(COMPETITION_EVENT.STAGE_REPLACEMENT_BLOCKED, {
              competition_id: id,
            }),
            can_replace_result.error,
          );
    }
  }
}

async function apply_stage_reconciliation(
  dependencies: CompetitionMutationDependencies,
  id: CompetitionId,
  plan: StageReconciliationPlan,
): AsyncResult<boolean> {
  switch (plan.kind) {
    case STAGE_RECONCILIATION_KIND.KEEP_FORMAT:
      return dependencies.stage_lifecycle.ensure_stages_for_competition(
        id,
        plan.competition_format_id,
      );
    case STAGE_RECONCILIATION_KIND.REPLACE_FORMAT:
      return dependencies.stage_lifecycle.replace_stages_for_competition(
        id,
        plan.competition_format_id,
      );
  }
}

async function find_existing_competition(
  repository: CompetitionRepository,
  id: CompetitionId,
): AsyncResult<Competition> {
  const existing_result = await repository.find_by_id(id);
  if (existing_result.success) return existing_result;
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    ...log_target(COMPETITION_EVENT.NOT_FOUND, { competition_id: id }),
    user_message: COMPETITION_MESSAGE.NOT_FOUND,
    technical_detail: existing_result.error,
  });
}

export async function update_competition(
  dependencies: CompetitionMutationDependencies,
  id: CompetitionId,
  input: UpdateCompetitionInput,
): AsyncResult<Competition> {
  const target = log_target(COMPETITION_EVENT.ID_MISSING, {
    operation: COMPETITION_OPERATION.UPDATE,
  });
  if (is_blank_identifier(id))
    return fail_missing_identifier(target, COMPETITION_MESSAGE.ID_REQUIRED);
  const existing_result = await find_existing_competition(
    dependencies.repository,
    id,
  );
  if (!existing_result.success) return existing_result;
  const plan = plan_stage_reconciliation(existing_result.data, input);
  const replaceable_result = await ensure_stages_can_be_replaced(
    dependencies,
    id,
    plan,
  );
  if (!replaceable_result.success) return replaceable_result;
  const update_result = await dependencies.repository.update(id, input);
  if (!update_result.success)
    return relay_repository_failure(
      log_target(COMPETITION_EVENT.UPDATE_FAILED, { competition_id: id }),
      update_result.error,
    );
  const stages_result = await apply_stage_reconciliation(
    dependencies,
    id,
    plan,
  );
  if (stages_result.success) return create_success_result(update_result.data);
  return relay_repository_failure(
    log_target(COMPETITION_EVENT.STAGE_SETUP_FAILED, { competition_id: id }),
    stages_result.error,
  );
}
