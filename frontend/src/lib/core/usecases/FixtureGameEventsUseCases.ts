import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  Fixture,
  GameEvent,
  UpdateFixtureInput,
} from "../entities/Fixture";
import { FIXTURE_STATUS, GAME_PERIOD } from "../entities/StatusConstants";
import type {
  FixtureRepository,
  FixtureUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

const ENTITY_TYPE = "fixture";

type FixtureGameEventMethods = Pick<
  FixtureUseCasesPort,
  | "update_fixture_score"
  | "start_fixture"
  | "record_game_event"
  | "update_period"
  | "end_fixture"
>;

function build_fixture_display_name(fixture: Fixture): string {
  return (
    `${fixture.venue || "Fixture"} - Round ${fixture.round_number || ""}`.trim() ||
    fixture.id
  );
}

function emit_fixture_updated(
  old_fixture: Fixture,
  updated_fixture: Fixture,
  changed_fields: string[],
): boolean {
  EventBus.emit_entity_updated(
    ENTITY_TYPE,
    updated_fixture.id,
    build_fixture_display_name(updated_fixture),
    old_fixture as unknown as Record<string, unknown>,
    updated_fixture as unknown as Record<string, unknown>,
    changed_fields,
  );
  return true;
}

async function update_and_emit(
  repository: FixtureRepository,
  fixture_id: ScalarValueInput<Fixture["id"]>,
  updates: UpdateFixtureInput,
  changed_fields: string[],
  old_fixture?: Fixture,
): AsyncResult<Fixture> {
  const result = await repository.update(fixture_id, updates);
  if (result.success && result.data && old_fixture) {
    emit_fixture_updated(old_fixture, result.data, changed_fields);
  }
  return result;
}

const SCORING_EVENTS = new Set(["goal", "penalty_scored"]);
const OWN_GOAL_EVENT = "own_goal";

function calculate_score_delta(event: GameEvent): {
  home: number;
  away: number;
} {
  const is_scoring = SCORING_EVENTS.has(event.event_type);
  const is_own_goal = event.event_type === OWN_GOAL_EVENT;
  return {
    home:
      (is_scoring && event.team_side === "home") ||
      (is_own_goal && event.team_side === "away")
        ? 1
        : 0,
    away:
      (is_scoring && event.team_side === "away") ||
      (is_own_goal && event.team_side === "home")
        ? 1
        : 0,
  };
}

export function create_fixture_game_events(
  repository: FixtureRepository,
): FixtureGameEventMethods {
  return {
    async update_fixture_score(id, home_score, away_score) {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      if (home_score < 0 || away_score < 0)
        return create_failure_result("Scores cannot be negative");
      const old_result = await repository.find_by_id(id);
      if (!old_result.success || !old_result.data) {
        return update_and_emit(
          repository,
          id,
          { home_team_score: home_score, away_team_score: away_score },
          ["home_team_score", "away_team_score"],
        );
      }
      return update_and_emit(
        repository,
        id,
        { home_team_score: home_score, away_team_score: away_score },
        ["home_team_score", "away_team_score"],
        old_result.data,
      );
    },

    async start_fixture(id) {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      const old_result = await repository.find_by_id(id);
      if (!old_result.success || !old_result.data) {
        return update_and_emit(
          repository,
          id,
          {
            status: FIXTURE_STATUS.IN_PROGRESS,
            current_period: GAME_PERIOD.FIRST_HALF,
            current_minute: 0,
            home_team_score: 0,
            away_team_score: 0,
            game_events: [],
          },
          [
            "status",
            "current_period",
            "current_minute",
            "home_team_score",
            "away_team_score",
            "game_events",
          ],
        );
      }
      return update_and_emit(
        repository,
        id,
        {
          status: FIXTURE_STATUS.IN_PROGRESS,
          current_period: GAME_PERIOD.FIRST_HALF,
          current_minute: 0,
          home_team_score: 0,
          away_team_score: 0,
          game_events: [],
        },
        [
          "status",
          "current_period",
          "current_minute",
          "home_team_score",
          "away_team_score",
          "game_events",
        ],
        old_result.data,
      );
    },

    async record_game_event(id, event) {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      const fixture_result = await repository.find_by_id(id);
      if (!fixture_result.success)
        return create_failure_result("Fixture not found");
      const fixture = fixture_result.data;
      const updated_events = [...(fixture.game_events || []), event];
      const delta = calculate_score_delta(event);
      const home_score = (fixture.home_team_score || 0) + delta.home;
      const away_score = (fixture.away_team_score || 0) + delta.away;
      return update_and_emit(
        repository,
        id,
        {
          game_events: updated_events,
          home_team_score: home_score,
          away_team_score: away_score,
          current_minute: event.minute,
        },
        ["game_events", "home_team_score", "away_team_score", "current_minute"],
        fixture,
      );
    },

    async update_period(id, period, minute) {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      const old_result = await repository.find_by_id(id);
      if (!old_result.success || !old_result.data) {
        return update_and_emit(
          repository,
          id,
          { current_period: period, current_minute: minute },
          ["current_period", "current_minute"],
        );
      }
      return update_and_emit(
        repository,
        id,
        { current_period: period, current_minute: minute },
        ["current_period", "current_minute"],
        old_result.data,
      );
    },

    async end_fixture(id) {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      const fixture_result = await repository.find_by_id(id);
      if (!fixture_result.success || !fixture_result.data)
        return create_failure_result("Fixture not found");
      const fixture = fixture_result.data;
      return update_and_emit(
        repository,
        id,
        {
          status: FIXTURE_STATUS.COMPLETED,
          current_period: GAME_PERIOD.FINISHED,
          home_team_score: fixture.home_team_score ?? 0,
          away_team_score: fixture.away_team_score ?? 0,
        },
        ["status", "current_period", "home_team_score", "away_team_score"],
        fixture,
      );
    },
  };
}
