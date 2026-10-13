import type { PlayerPosition } from "../entities/PlayerPosition";
import type { PlayerPositionRepository } from "../interfaces/ports";
import { is_player_position_not_found_by_code_error } from "../interfaces/ports";
import type { Option } from "../types/Option";
import { OptionStatus } from "../types/Option";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  build_position_code_conflict_message,
  PLAYER_POSITION_USE_CASES_LOG_SCOPE,
  PositionCodeLookupStatus,
} from "./PlayerPositionUseCasesConstants";
import type { UseCaseFailureTarget } from "./UseCaseResultGuards";
import {
  fail_with_message,
  forward_dependency_result,
} from "./UseCaseResultGuards";

type PositionCodeLookup =
  | { status: typeof PositionCodeLookupStatus.UNUSED }
  | {
      status: typeof PositionCodeLookupStatus.IN_USE;
      position_id: PlayerPosition["id"];
    };

interface PositionCodeCheck {
  code: string;
  owner: Option<PlayerPosition["id"]>;
  lookup_failed_event: string;
  conflict_event: string;
}

export function build_player_position_target(
  event: string,
  context: Record<string, unknown>,
): UseCaseFailureTarget {
  return { log_scope: PLAYER_POSITION_USE_CASES_LOG_SCOPE, event, context };
}

function build_owner_context(
  check: PositionCodeCheck,
): Record<string, unknown> {
  switch (check.owner.status) {
    case OptionStatus.SOME:
      return { position_id: check.owner.value };
    case OptionStatus.NONE:
      return {};
  }
}

function is_owned_by_checked_position(
  check: PositionCodeCheck,
  position_id: PlayerPosition["id"],
): boolean {
  switch (check.owner.status) {
    case OptionStatus.SOME:
      return check.owner.value === position_id;
    case OptionStatus.NONE:
      return false;
  }
}

async function lookup_position_code(
  repository: PlayerPositionRepository,
  check: PositionCodeCheck,
): AsyncResult<PositionCodeLookup> {
  const result = await repository.find_by_code(check.code);
  if (result.success) {
    return create_success_result({
      status: PositionCodeLookupStatus.IN_USE,
      position_id: result.data.id,
    });
  }
  if (is_player_position_not_found_by_code_error(result.error, check.code)) {
    return create_success_result({ status: PositionCodeLookupStatus.UNUSED });
  }
  return forward_dependency_result(result, {
    ...build_player_position_target(
      check.lookup_failed_event,
      build_owner_context(check),
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

function resolve_code_lookup(
  lookup: PositionCodeLookup,
  check: PositionCodeCheck,
): Result<true> {
  switch (lookup.status) {
    case PositionCodeLookupStatus.UNUSED:
      return create_success_result(true);
    case PositionCodeLookupStatus.IN_USE:
      if (is_owned_by_checked_position(check, lookup.position_id)) {
        return create_success_result(true);
      }
      return fail_with_message(
        {
          ...build_player_position_target(check.conflict_event, {
            ...build_owner_context(check),
            existing_position_id: lookup.position_id,
          }),
          user_message: build_position_code_conflict_message(check.code),
        },
        UseCaseErrorCode.CONFLICT,
      );
  }
}

export async function ensure_position_code_available(
  repository: PlayerPositionRepository,
  check: PositionCodeCheck,
): AsyncResult<true> {
  const lookup_result = await lookup_position_code(repository, check);
  if (!lookup_result.success) {
    return lookup_result;
  }
  return resolve_code_lookup(lookup_result.data, check);
}
