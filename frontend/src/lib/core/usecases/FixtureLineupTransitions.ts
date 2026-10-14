import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  CreateFixtureLineupInput,
  FixtureLineup,
  UpdateFixtureLineupInput,
} from "../entities/FixtureLineup";
import type { FixtureStatusValue } from "../entities/StatusConstants";
import type {
  FixtureLineupRepository,
  FixtureRepository,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";
import {
  FIXTURE_LINEUP_ENTITY_TYPE,
  FIXTURE_LINEUP_EVENT,
  FIXTURE_LINEUP_LOG_SCOPE,
  FIXTURE_LINEUP_MESSAGE,
  type LineupAction,
  type LineupEditAction,
  type LineupStatusTransitionAction,
} from "./FixtureLineupConstants";
import { find_lineup_fixture_status } from "./FixtureLineupFixtureLookup";
import {
  decide_lineup_edit,
  decide_lineup_transition,
  LINEUP_DECISION,
  type LineupDecision,
} from "./FixtureLineupStateMachine";

type LineupId = ScalarValueInput<FixtureLineup["id"]>;

const log_target = create_log_target_builder(FIXTURE_LINEUP_LOG_SCOPE);

export function fail_missing_lineup_id(): Result<never> {
  return fail_missing_identifier(
    log_target(FIXTURE_LINEUP_EVENT.ID_MISSING),
    FIXTURE_LINEUP_MESSAGE.ID_REQUIRED,
  );
}

export function settle_decision<TAllowed>(
  decision: LineupDecision<TAllowed>,
  lineup_id: LineupId,
  action: LineupAction,
): Result<TAllowed> {
  switch (decision.kind) {
    case LINEUP_DECISION.ALLOWED:
      return create_success_result(decision.value);
    case LINEUP_DECISION.REJECTED:
      return fail_use_case({
        code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
        ...log_target(FIXTURE_LINEUP_EVENT.TRANSITION_REJECTED, {
          lineup_id,
          action,
        }),
        user_message: decision.reason,
      });
  }
}

async function find_lineup(
  repository: FixtureLineupRepository,
  id: LineupId,
): AsyncResult<FixtureLineup> {
  const existing_result = await repository.find_by_id(id);
  if (existing_result.success) return existing_result;
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    ...log_target(FIXTURE_LINEUP_EVENT.NOT_FOUND, { lineup_id: id }),
    user_message: FIXTURE_LINEUP_MESSAGE.NOT_FOUND,
    technical_detail: existing_result.error,
  });
}

export type LineupRepositories = {
  lineup_repository: FixtureLineupRepository;
  fixture_repository: FixtureRepository;
};

export async function find_lineup_with_fixture_status(
  repositories: LineupRepositories,
  id: LineupId,
): AsyncResult<{ lineup: FixtureLineup; fixture_status: FixtureStatusValue }> {
  if (is_blank_identifier(id)) return fail_missing_lineup_id();
  const lineup_result = await find_lineup(repositories.lineup_repository, id);
  if (!lineup_result.success) return lineup_result;
  const status_result = await find_lineup_fixture_status(
    repositories.fixture_repository,
    lineup_result.data,
  );
  if (!status_result.success) return status_result;
  return create_success_result({
    lineup: lineup_result.data,
    fixture_status: status_result.data,
  });
}

export async function find_unlocked_lineup(
  repositories: LineupRepositories,
  id: LineupId,
  action: LineupEditAction,
): AsyncResult<FixtureLineup> {
  const found = await find_lineup_with_fixture_status(repositories, id);
  if (!found.success) return found;
  return settle_decision(
    decide_lineup_edit(found.data.lineup, action, found.data.fixture_status),
    id,
    action,
  );
}

export async function create_unique_lineup(
  repository: FixtureLineupRepository,
  input: CreateFixtureLineupInput,
): AsyncResult<FixtureLineup> {
  if (is_blank_identifier(input.fixture_id))
    return fail_missing_identifier(
      log_target(FIXTURE_LINEUP_EVENT.FIXTURE_ID_MISSING),
      FIXTURE_LINEUP_MESSAGE.FIXTURE_ID_REQUIRED,
    );
  if (is_blank_identifier(input.team_id))
    return fail_missing_identifier(
      log_target(FIXTURE_LINEUP_EVENT.TEAM_ID_MISSING),
      FIXTURE_LINEUP_MESSAGE.TEAM_ID_REQUIRED,
    );
  const ids = { fixture_id: input.fixture_id, team_id: input.team_id };
  const existing_lineup_result =
    await repository.get_lineup_for_team_in_fixture(
      input.fixture_id,
      input.team_id,
    );
  if (existing_lineup_result.success)
    return fail_use_case({
      code: UseCaseErrorCode.CONFLICT,
      ...log_target(FIXTURE_LINEUP_EVENT.ALREADY_EXISTS, ids),
      user_message: FIXTURE_LINEUP_MESSAGE.ALREADY_EXISTS,
    });
  return relay_repository_result(
    repository.create(input),
    log_target(FIXTURE_LINEUP_EVENT.CREATE_FAILED, ids),
  );
}

export async function apply_lineup_update(
  repository: FixtureLineupRepository,
  id: LineupId,
  old_lineup: FixtureLineup,
  updates: UpdateFixtureLineupInput,
): AsyncResult<FixtureLineup> {
  const result = await relay_repository_result(
    repository.update(id, updates),
    log_target(FIXTURE_LINEUP_EVENT.UPDATE_FAILED, { lineup_id: id }),
  );
  if (!result.success) return result;
  EventBus.emit_entity_updated(
    FIXTURE_LINEUP_ENTITY_TYPE,
    result.data.id,
    result.data.id,
    old_lineup as unknown as Record<string, unknown>,
    result.data as unknown as Record<string, unknown>,
    Object.keys(updates),
  );
  return result;
}

export async function transition_lineup(
  repository: FixtureLineupRepository,
  id: LineupId,
  action: LineupStatusTransitionAction,
): AsyncResult<FixtureLineup> {
  const lineup_result = await find_lineup(repository, id);
  if (!lineup_result.success) return lineup_result;
  const now = new Date().toISOString() as FixtureLineup["submitted_at"];
  const updates_result = settle_decision(
    decide_lineup_transition(lineup_result.data, action, now),
    id,
    action,
  );
  if (!updates_result.success) return updates_result;
  return apply_lineup_update(
    repository,
    id,
    lineup_result.data,
    updates_result.data,
  );
}
