import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  Fixture,
  GameEvent,
  UpdateFixtureInput,
} from "../entities/Fixture";
import { TEAM_SIDE } from "../entities/GameEventLogTypes";
import {
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
  type ScoreAward,
  type ScoreCreditedSide,
} from "../entities/SportEventCatalogConstants";
import type { FixtureRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import {
  create_log_target_builder,
  relay_repository_failure,
} from "./FailureRelay";
import { build_fixture_display_name } from "./FixtureDisplay";
import {
  FIXTURE_ENTITY_TYPE,
  FIXTURE_EVENT,
  FIXTURE_LOG_SCOPE,
} from "./FixtureUseCaseConstants";

export interface FixtureUpdatePlan {
  updates: UpdateFixtureInput;
  changed_fields: string[];
}

export function plan_from_updates(
  updates: UpdateFixtureInput,
): FixtureUpdatePlan {
  return { updates, changed_fields: Object.keys(updates) };
}

export const PREVIOUS_FIXTURE_STATUS = {
  KNOWN: "known",
  UNKNOWN: "unknown",
} as const;

type PreviousFixtureState =
  | { status: typeof PREVIOUS_FIXTURE_STATUS.KNOWN; fixture: Fixture }
  | { status: typeof PREVIOUS_FIXTURE_STATUS.UNKNOWN };

type FixtureTeamSide = GameEvent["team_side"];

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

function emit_fixture_updated(
  old_fixture: Fixture,
  updated_fixture: Fixture,
  changed_fields: string[],
): void {
  EventBus.emit_entity_updated(
    FIXTURE_ENTITY_TYPE,
    updated_fixture.id,
    build_fixture_display_name(updated_fixture),
    old_fixture as unknown as Record<string, unknown>,
    updated_fixture as unknown as Record<string, unknown>,
    changed_fields,
  );
}

function announce_update(
  previous: PreviousFixtureState,
  updated_fixture: Fixture,
  changed_fields: string[],
): void {
  switch (previous.status) {
    case PREVIOUS_FIXTURE_STATUS.KNOWN:
      emit_fixture_updated(previous.fixture, updated_fixture, changed_fields);
      return;
    case PREVIOUS_FIXTURE_STATUS.UNKNOWN:
      return;
  }
}

export async function update_and_emit(
  repository: FixtureRepository,
  fixture_id: ScalarValueInput<Fixture["id"]>,
  plan: FixtureUpdatePlan,
  previous: PreviousFixtureState,
): AsyncResult<Fixture> {
  const result = await repository.update(fixture_id, plan.updates);
  if (!result.success)
    return relay_repository_failure(
      log_target(FIXTURE_EVENT.UPDATE_FAILED, { fixture_id }),
      result.error,
    );
  announce_update(previous, result.data, plan.changed_fields);
  return result;
}

export async function update_tracking_previous(
  repository: FixtureRepository,
  fixture_id: ScalarValueInput<Fixture["id"]>,
  plan: FixtureUpdatePlan,
): AsyncResult<Fixture> {
  const old_result = await repository.find_by_id(fixture_id);
  if (old_result.success)
    return update_and_emit(repository, fixture_id, plan, {
      status: PREVIOUS_FIXTURE_STATUS.KNOWN,
      fixture: old_result.data,
    });
  console.warn(FIXTURE_LOG_SCOPE, {
    event: FIXTURE_EVENT.PREVIOUS_STATE_UNAVAILABLE,
    fixture_id,
    technical_detail: old_result.error,
  });
  return update_and_emit(repository, fixture_id, plan, {
    status: PREVIOUS_FIXTURE_STATUS.UNKNOWN,
  });
}

function opposing_side(team_side: FixtureTeamSide): FixtureTeamSide {
  switch (team_side) {
    case TEAM_SIDE.HOME:
      return TEAM_SIDE.AWAY;
    case TEAM_SIDE.AWAY:
      return TEAM_SIDE.HOME;
    case TEAM_SIDE.MATCH:
      return TEAM_SIDE.MATCH;
  }
}

function credited_side(
  event: GameEvent,
  credited: ScoreCreditedSide,
): FixtureTeamSide {
  switch (credited) {
    case SCORE_CREDITED_SIDE.ACTING:
      return event.team_side;
    case SCORE_CREDITED_SIDE.OPPOSING:
      return opposing_side(event.team_side);
  }
}

export function calculate_score_delta(
  event: GameEvent,
  award: ScoreAward,
): { home: number; away: number } {
  switch (award.kind) {
    case SCORE_AWARD_KIND.NONE:
      return { home: 0, away: 0 };
    case SCORE_AWARD_KIND.CREDIT: {
      const side = credited_side(event, award.credited_side);
      return {
        home: side === TEAM_SIDE.HOME ? award.points : 0,
        away: side === TEAM_SIDE.AWAY ? award.points : 0,
      };
    }
  }
}
