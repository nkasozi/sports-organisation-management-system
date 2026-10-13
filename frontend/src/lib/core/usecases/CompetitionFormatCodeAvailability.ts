import type { CompetitionFormat } from "../entities/CompetitionFormat";
import type { CompetitionFormatRepository } from "../interfaces/ports";
import { is_competition_format_not_found_by_code_error } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  build_format_code_taken_message,
  COMPETITION_FORMAT_EVENT,
  COMPETITION_FORMAT_LOG_SCOPE,
} from "./CompetitionFormatConstants";
import {
  create_log_target_builder,
  relay_repository_failure,
} from "./FailureRelay";

const FORMAT_CODE_STATUS = {
  UNUSED: "unused",
  USED: "used",
} as const;

type FormatCodeUsage =
  | { status: typeof FORMAT_CODE_STATUS.UNUSED }
  | {
      status: typeof FORMAT_CODE_STATUS.USED;
      owner_id: CompetitionFormat["id"];
    };

export const FORMAT_CODE_CLAIMANT_KIND = {
  NEW_FORMAT: "new_format",
  EXISTING_FORMAT: "existing_format",
} as const;

type FormatCodeClaimant =
  | { kind: typeof FORMAT_CODE_CLAIMANT_KIND.NEW_FORMAT }
  | {
      kind: typeof FORMAT_CODE_CLAIMANT_KIND.EXISTING_FORMAT;
      format_id: ScalarValueInput<CompetitionFormat["id"]>;
    };

const log_target = create_log_target_builder(COMPETITION_FORMAT_LOG_SCOPE);

async function find_format_code_usage(
  repository: CompetitionFormatRepository,
  code: string,
): AsyncResult<FormatCodeUsage> {
  const lookup_result = await repository.find_by_code(code);
  if (lookup_result.success)
    return create_success_result({
      status: FORMAT_CODE_STATUS.USED,
      owner_id: lookup_result.data.id,
    });
  if (is_competition_format_not_found_by_code_error(lookup_result.error, code))
    return create_success_result({ status: FORMAT_CODE_STATUS.UNUSED });
  return relay_repository_failure(
    log_target(COMPETITION_FORMAT_EVENT.CODE_LOOKUP_FAILED),
    lookup_result.error,
  );
}

function is_claimant_owner(
  claimant: FormatCodeClaimant,
  owner_id: CompetitionFormat["id"],
): boolean {
  switch (claimant.kind) {
    case FORMAT_CODE_CLAIMANT_KIND.NEW_FORMAT:
      return false;
    case FORMAT_CODE_CLAIMANT_KIND.EXISTING_FORMAT:
      return claimant.format_id === owner_id;
  }
}

function is_code_available_to(
  usage: FormatCodeUsage,
  claimant: FormatCodeClaimant,
): boolean {
  switch (usage.status) {
    case FORMAT_CODE_STATUS.UNUSED:
      return true;
    case FORMAT_CODE_STATUS.USED:
      return is_claimant_owner(claimant, usage.owner_id);
  }
}

export async function ensure_format_code_available(
  repository: CompetitionFormatRepository,
  code: string,
  claimant: FormatCodeClaimant,
): AsyncResult<string> {
  const usage_result = await find_format_code_usage(repository, code);
  if (!usage_result.success) return usage_result;
  if (is_code_available_to(usage_result.data, claimant))
    return create_success_result(code);
  return fail_use_case({
    code: UseCaseErrorCode.CONFLICT,
    ...log_target(COMPETITION_FORMAT_EVENT.CODE_TAKEN, {
      claimant_kind: claimant.kind,
    }),
    user_message: build_format_code_taken_message(code),
  });
}
