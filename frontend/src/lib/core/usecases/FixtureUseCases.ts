import type {
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
  FixtureGenerationConfig,
  GameEvent,
  GamePeriod,
} from "../entities/Fixture";
import type { FixtureRepository, FixtureFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import {
  validate_fixture_input,
  generate_round_robin_fixtures,
} from "../entities/Fixture";
import { get_repository_container } from "../../infrastructure/container";
import { EventBus } from "$lib/infrastructure/events/EventBus";
import type { EntityListResult } from "./BaseUseCases";
import type { FixtureUseCasesPort } from "../interfaces/ports";
import type { Team } from "../entities/Team";

export type FixtureUseCases = FixtureUseCasesPort;

const ENTITY_TYPE = "fixture";

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
): void {
  EventBus.emit_entity_updated(
    ENTITY_TYPE,
    updated_fixture.id,
    build_fixture_display_name(updated_fixture),
    old_fixture as unknown as Record<string, unknown>,
    updated_fixture as unknown as Record<string, unknown>,
    changed_fields,
  );
}

async function enrich_fixtures_with_team_names(
  fixtures: Fixture[],
): Promise<Fixture[]> {
  if (fixtures.length === 0) return fixtures;

  try {
    const container = get_repository_container();
    if (!container.team_repository) {
      return fixtures;
    }

    const team_repository = container.team_repository;
    const teams_result = await team_repository.find_all();

    if (!teams_result.success || !teams_result.data) {
      return fixtures;
    }

    const teams_map = new Map<string, Team>();
    for (const team of teams_result.data.items) {
      teams_map.set(team.id, team);
    }

    return fixtures.map((fixture) => {
      const home_team = teams_map.get(fixture.home_team_id);
      const away_team = teams_map.get(fixture.away_team_id);
      return {
        ...fixture,
        home_team_name: home_team?.name || fixture.home_team_id,
        away_team_name: away_team?.name || fixture.away_team_id,
      } as Fixture;
    });
  } catch (error) {
    console.warn("[DEBUG] Failed to enrich fixtures with team names:", error);
    return fixtures;
  }
}

export function create_fixture_use_cases(
  repository: FixtureRepository,
): FixtureUseCases {
  return {
    async list(
      filter?: FixtureFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Fixture>> {
      const result = await repository.find_all(filter, options);
      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }

      const fixtures = result.data?.items || [];
      const enriched_fixtures = await enrich_fixtures_with_team_names(fixtures);

      return {
        success: true,
        data: enriched_fixtures,
        total_count: result.data?.total_count || 0,
      };
    },

    async get_by_id(id: string): AsyncResult<Fixture> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async create(input: CreateFixtureInput): AsyncResult<Fixture> {
      const validation_errors = validate_fixture_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async update(id: string, input: UpdateFixtureInput): AsyncResult<Fixture> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }
      return create_success_result(result.data);
    },

    async list_fixtures_by_competition(
      competition_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      if (!competition_id || competition_id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      return repository.find_by_competition(competition_id, options);
    },

    async list_fixtures_by_team(
      team_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.find_by_team(team_id, options);
    },

    async list_fixtures_by_round(
      competition_id: string,
      round_number: number,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      if (!competition_id || competition_id.trim().length === 0) {
        return create_failure_result("Competition ID is required");
      }
      if (round_number < 1) {
        return create_failure_result("Round number must be at least 1");
      }
      return repository.find_by_round(competition_id, round_number, options);
    },

    async list_upcoming_fixtures(
      competition_id?: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      return repository.find_upcoming(competition_id, options);
    },

    async generate_fixtures(
      config: FixtureGenerationConfig,
    ): PaginatedAsyncResult<Fixture> {
      if (!config.competition_id) {
        return create_failure_result("Competition ID is required");
      }
      if (!config.team_ids || config.team_ids.length < 2) {
        return create_failure_result("At least 2 teams are required");
      }
      if (!config.start_date) {
        return create_failure_result("Start date is required");
      }

      const fixture_inputs = generate_round_robin_fixtures(config);
      const result = await repository.create_many(fixture_inputs);

      if (result.success && result.data) {
        for (const created_fixture of result.data.items) {
          EventBus.emit_entity_created(
            ENTITY_TYPE,
            created_fixture.id,
            build_fixture_display_name(created_fixture),
            created_fixture as unknown as Record<string, unknown>,
          );
        }
      }

      return result;
    },

    async update_fixture_score(
      id: string,
      home_score: number,
      away_score: number,
    ): AsyncResult<Fixture> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }
      if (home_score < 0 || away_score < 0) {
        return create_failure_result("Scores cannot be negative");
      }

      const old_result = await repository.find_by_id(id);
      const old_fixture = old_result.success ? old_result.data : undefined;

      const result = await repository.update(id, {
        home_team_score: home_score,
        away_team_score: away_score,
      });

      if (result.success && result.data && old_fixture) {
        emit_fixture_updated(old_fixture, result.data, [
          "home_team_score",
          "away_team_score",
        ]);
      }

      return result;
    },

    async start_fixture(id: string): AsyncResult<Fixture> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }

      const old_result = await repository.find_by_id(id);
      const old_fixture = old_result.success ? old_result.data : undefined;

      const result = await repository.update(id, {
        status: "in_progress",
        current_period: "first_half",
        current_minute: 0,
        home_team_score: 0,
        away_team_score: 0,
        game_events: [],
      });

      if (result.success && result.data && old_fixture) {
        emit_fixture_updated(old_fixture, result.data, [
          "status",
          "current_period",
          "current_minute",
          "home_team_score",
          "away_team_score",
          "game_events",
        ]);
      }

      return result;
    },

    async record_game_event(
      id: string,
      event: GameEvent,
    ): AsyncResult<Fixture> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }

      const fixture_result = await repository.find_by_id(id);
      if (!fixture_result.success) {
        return create_failure_result("Fixture not found");
      }

      const fixture = fixture_result.data;
      const updated_events = [...(fixture.game_events || []), event];

      let home_score = fixture.home_team_score || 0;
      let away_score = fixture.away_team_score || 0;

      const scoring_events = ["goal", "penalty_scored"];
      if (scoring_events.includes(event.event_type)) {
        if (event.team_side === "home") {
          home_score += 1;
        } else if (event.team_side === "away") {
          away_score += 1;
        }
      }

      if (event.event_type === "own_goal") {
        if (event.team_side === "home") {
          away_score += 1;
        } else if (event.team_side === "away") {
          home_score += 1;
        }
      }

      const result = await repository.update(id, {
        game_events: updated_events,
        home_team_score: home_score,
        away_team_score: away_score,
        current_minute: event.minute,
      });

      if (result.success && result.data) {
        emit_fixture_updated(fixture, result.data, [
          "game_events",
          "home_team_score",
          "away_team_score",
          "current_minute",
        ]);
      }

      return result;
    },

    async update_period(
      id: string,
      period: GamePeriod,
      minute: number,
    ): AsyncResult<Fixture> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }

      const old_result = await repository.find_by_id(id);
      const old_fixture = old_result.success ? old_result.data : undefined;

      const result = await repository.update(id, {
        current_period: period,
        current_minute: minute,
      });

      if (result.success && result.data && old_fixture) {
        emit_fixture_updated(old_fixture, result.data, [
          "current_period",
          "current_minute",
        ]);
      }

      return result;
    },

    async end_fixture(id: string): AsyncResult<Fixture> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Fixture ID is required");
      }

      const fixture_result = await repository.find_by_id(id);
      if (!fixture_result.success || !fixture_result.data) {
        return create_failure_result("Fixture not found");
      }

      const fixture = fixture_result.data;
      const final_home_score = fixture.home_team_score ?? 0;
      const final_away_score = fixture.away_team_score ?? 0;

      const result = await repository.update(id, {
        status: "completed",
        current_period: "finished",
        home_team_score: final_home_score,
        away_team_score: final_away_score,
      });

      if (result.success && result.data) {
        emit_fixture_updated(fixture, result.data, [
          "status",
          "current_period",
          "home_team_score",
          "away_team_score",
        ]);
      }

      return result;
    },
  };
}

export function get_fixture_use_cases(): FixtureUseCases {
  const container = get_repository_container();
  return create_fixture_use_cases(container.fixture_repository);
}
