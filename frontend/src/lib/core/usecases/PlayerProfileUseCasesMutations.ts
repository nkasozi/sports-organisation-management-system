import type {
  CreatePlayerProfileInput,
  PlayerProfile,
  UpdatePlayerProfileInput,
} from "$lib/core/entities/PlayerProfile";
import { validate_player_profile_input } from "$lib/core/entities/PlayerProfile";
import type { PlayerProfileRepository } from "$lib/core/interfaces/ports";
import type { AsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
  PlayerProfileUseCaseEvent,
  PlayerProfileUseCaseMessage,
} from "./PlayerProfileUseCasesConstants";
import {
  fail_missing_player_profile_identifier,
  type PlayerProfileId,
} from "./PlayerProfileUseCasesQueries";
import {
  fail_validation,
  fail_with_message,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export async function create_player_profile(
  repository: PlayerProfileRepository,
  input: CreatePlayerProfileInput,
): AsyncResult<PlayerProfile> {
  const context = { player_id: input.player_id };
  const validation = validate_player_profile_input(input);
  if (!validation.is_valid) {
    return fail_validation(
      {
        log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
        event: PlayerProfileUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      },
      Object.values(validation.errors),
    );
  }
  const existing = await repository.find_by_player_id(input.player_id);
  if (existing.success) {
    return fail_with_message(
      {
        log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
        event: PlayerProfileUseCaseEvent.CREATE_ALREADY_EXISTS,
        context: { ...context, player_profile_id: existing.data.id },
        user_message: PlayerProfileUseCaseMessage.ALREADY_EXISTS,
      },
      UseCaseErrorCode.CONFLICT,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
    event: PlayerProfileUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

export async function update_player_profile(
  repository: PlayerProfileRepository,
  id: PlayerProfileId,
  input: UpdatePlayerProfileInput,
): AsyncResult<PlayerProfile> {
  if (is_blank_identifier(id)) {
    return fail_missing_player_profile_identifier(
      PlayerProfileUseCaseEvent.UPDATE_ID_MISSING,
      PlayerProfileUseCaseMessage.ID_REQUIRED,
    );
  }
  const validation = validate_player_profile_input(input);
  if (!validation.is_valid) {
    return fail_validation(
      {
        log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
        event: PlayerProfileUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context: { player_profile_id: id },
      },
      Object.values(validation.errors),
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
    event: PlayerProfileUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { player_profile_id: id },
  });
}

export async function delete_player_profile(
  repository: PlayerProfileRepository,
  id: PlayerProfileId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_player_profile_identifier(
      PlayerProfileUseCaseEvent.DELETE_ID_MISSING,
      PlayerProfileUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: PLAYER_PROFILE_USE_CASES_LOG_SCOPE,
    event: PlayerProfileUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { player_profile_id: id },
  });
}
