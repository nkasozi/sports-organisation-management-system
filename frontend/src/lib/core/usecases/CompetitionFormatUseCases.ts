import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
} from "../entities/CompetitionFormat";
import {
  hydrate_competition_format_input,
  validate_competition_format_input,
} from "../entities/CompetitionFormat";
import type { CompetitionFormatRepository } from "../interfaces/ports";
import type { CompetitionFormatUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  ensure_format_code_available,
  FORMAT_CODE_CLAIMANT_KIND,
} from "./CompetitionFormatCodeAvailability";
import {
  COMPETITION_FORMAT_EVENT,
  COMPETITION_FORMAT_LOG_SCOPE,
  COMPETITION_FORMAT_MESSAGE,
} from "./CompetitionFormatConstants";
import { create_competition_format_queries } from "./CompetitionFormatQueries";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";

export type CompetitionFormatUseCases = CompetitionFormatUseCasesPort;

type FormatId = ScalarValueInput<CompetitionFormat["id"]>;

const log_target = create_log_target_builder(COMPETITION_FORMAT_LOG_SCOPE);

function validate_hydrated_format(
  input: CreateCompetitionFormatInput,
): Result<CreateCompetitionFormatInput> {
  const hydrated_input = hydrate_competition_format_input(input);
  const validation = validate_competition_format_input(hydrated_input);
  if (validation.is_valid) return create_success_result(hydrated_input);
  return fail_validation(
    log_target(COMPETITION_FORMAT_EVENT.VALIDATION_FAILED),
    validation.errors.join(", "),
  );
}

async function create_format(
  repository: CompetitionFormatRepository,
  input: CreateCompetitionFormatInput,
): AsyncResult<CompetitionFormat> {
  const hydrated_result = validate_hydrated_format(input);
  if (!hydrated_result.success) return hydrated_result;
  const code_result = await ensure_format_code_available(
    repository,
    hydrated_result.data.code,
    { kind: FORMAT_CODE_CLAIMANT_KIND.NEW_FORMAT },
  );
  if (!code_result.success) return code_result;
  return relay_repository_result(
    repository.create(hydrated_result.data),
    log_target(COMPETITION_FORMAT_EVENT.CREATE_FAILED),
  );
}

async function find_existing_format(
  repository: CompetitionFormatRepository,
  id: FormatId,
): AsyncResult<CompetitionFormat> {
  const existing_result = await repository.find_by_id(id);
  if (existing_result.success) return existing_result;
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    ...log_target(COMPETITION_FORMAT_EVENT.NOT_FOUND, { format_id: id }),
    user_message: COMPETITION_FORMAT_MESSAGE.NOT_FOUND,
    technical_detail: existing_result.error,
  });
}

async function ensure_updated_code_available(
  repository: CompetitionFormatRepository,
  id: FormatId,
  input: UpdateCompetitionFormatInput,
): AsyncResult<boolean> {
  if (!input.code) return create_success_result(true);
  const code_result = await ensure_format_code_available(
    repository,
    input.code,
    {
      kind: FORMAT_CODE_CLAIMANT_KIND.EXISTING_FORMAT,
      format_id: id,
    },
  );
  return code_result.success ? create_success_result(true) : code_result;
}

async function update_format(
  repository: CompetitionFormatRepository,
  id: FormatId,
  input: UpdateCompetitionFormatInput,
): AsyncResult<CompetitionFormat> {
  if (is_blank_identifier(id))
    return fail_missing_identifier(
      log_target(COMPETITION_FORMAT_EVENT.ID_MISSING),
      COMPETITION_FORMAT_MESSAGE.ID_REQUIRED,
    );
  const existing_result = await find_existing_format(repository, id);
  if (!existing_result.success) return existing_result;
  const code_result = await ensure_updated_code_available(
    repository,
    id,
    input,
  );
  if (!code_result.success) return code_result;
  const merged_result = validate_hydrated_format({
    ...existing_result.data,
    ...input,
  } as CreateCompetitionFormatInput);
  if (!merged_result.success) return merged_result;
  return relay_repository_result(
    repository.update(id, merged_result.data),
    log_target(COMPETITION_FORMAT_EVENT.UPDATE_FAILED, { format_id: id }),
  );
}

export function create_competition_format_use_cases(
  repository: CompetitionFormatRepository,
): CompetitionFormatUseCases {
  return {
    ...create_competition_format_queries(repository),
    create: (input) => create_format(repository, input),
    update: (id, input) => update_format(repository, id, input),
  };
}
