import type { Competition } from "../entities/Competition";
import type { CompetitionFormat } from "../entities/CompetitionFormat";
import { ENTITY_STATUS } from "../entities/StatusConstants";
import type {
  CompetitionFormatRepository,
  CompetitionStageRepository,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  build_format_without_templates_message,
  COMPETITION_STAGE_EVENT,
  COMPETITION_STAGE_LIFECYCLE_LOG_SCOPE,
  COMPETITION_STAGE_MESSAGE,
} from "./CompetitionStageConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_failure,
} from "./FailureRelay";

export interface StageCreationCommand {
  competition_id: ScalarValueInput<Competition["id"]>;
  competition_format_id: ScalarValueInput<Competition["competition_format_id"]>;
}

export interface StageCreationRepositories {
  competition_format_repository: CompetitionFormatRepository;
  competition_stage_repository: CompetitionStageRepository;
}

const log_target = create_log_target_builder(
  COMPETITION_STAGE_LIFECYCLE_LOG_SCOPE,
);

function sort_stage_templates(
  competition_format: CompetitionFormat,
): CompetitionFormat["stage_templates"] {
  return [...competition_format.stage_templates].sort(
    (left, right) => left.stage_order - right.stage_order,
  );
}

async function find_stage_templates(
  repository: CompetitionFormatRepository,
  command: StageCreationCommand,
): AsyncResult<CompetitionFormat["stage_templates"]> {
  const context = { competition_format_id: command.competition_format_id };
  const format_result = await repository.find_by_id(
    command.competition_format_id,
  );
  if (!format_result.success)
    return fail_use_case({
      code: UseCaseErrorCode.NOT_FOUND,
      ...log_target(COMPETITION_STAGE_EVENT.FORMAT_NOT_FOUND, context),
      user_message: COMPETITION_STAGE_MESSAGE.FORMAT_NOT_FOUND,
      technical_detail: format_result.error,
    });
  const stage_templates = sort_stage_templates(format_result.data);
  if (stage_templates.length > 0) return create_success_result(stage_templates);
  return fail_use_case({
    code: UseCaseErrorCode.VALIDATION_FAILED,
    ...log_target(COMPETITION_STAGE_EVENT.FORMAT_WITHOUT_TEMPLATES, context),
    user_message: build_format_without_templates_message(
      format_result.data.name,
    ),
  });
}

function check_stage_creation_command(
  command: StageCreationCommand,
): Result<StageCreationCommand> {
  if (is_blank_identifier(command.competition_id))
    return fail_missing_identifier(
      log_target(COMPETITION_STAGE_EVENT.COMPETITION_ID_MISSING),
      COMPETITION_STAGE_MESSAGE.COMPETITION_ID_REQUIRED,
    );
  if (is_blank_identifier(command.competition_format_id))
    return fail_missing_identifier(
      log_target(COMPETITION_STAGE_EVENT.FORMAT_ID_MISSING),
      COMPETITION_STAGE_MESSAGE.FORMAT_ID_REQUIRED,
    );
  return create_success_result(command);
}

export async function create_stages_from_format(
  repositories: StageCreationRepositories,
  command: StageCreationCommand,
): AsyncResult<boolean> {
  const command_result = check_stage_creation_command(command);
  if (!command_result.success) return command_result;
  const templates_result = await find_stage_templates(
    repositories.competition_format_repository,
    command,
  );
  if (!templates_result.success) return templates_result;
  for (const template of templates_result.data) {
    const create_result =
      await repositories.competition_stage_repository.create({
        competition_id: command.competition_id,
        name: template.name,
        stage_type: template.stage_type,
        stage_order: template.stage_order,
        status: ENTITY_STATUS.ACTIVE,
      });
    if (!create_result.success)
      return relay_repository_failure(
        log_target(COMPETITION_STAGE_EVENT.CREATE_FAILED, {
          competition_id: command.competition_id,
        }),
        create_result.error,
      );
  }
  return create_success_result(true);
}
