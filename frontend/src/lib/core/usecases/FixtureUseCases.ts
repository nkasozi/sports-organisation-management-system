import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  CreateFixtureInput,
  Fixture,
  FixtureGenerationConfig,
  UpdateFixtureInput,
} from "../entities/Fixture";
import {
  generate_round_robin_fixtures,
  validate_fixture_input,
} from "../entities/Fixture";
import type { Team } from "../entities/Team";
import type {
  FixtureFilter,
  FixtureRepository,
  FixtureUseCasesPort,
  QueryOptions,
  TeamRepository,
} from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";

export type FixtureUseCases = FixtureUseCasesPort;

const ENTITY_TYPE = "fixture";

async function enrich_fixtures_with_team_names(
  fixtures: Fixture[],
  team_repository?: TeamRepository,
): Promise<Fixture[]> {
  if (fixtures.length === 0) return fixtures;
  if (!team_repository) return fixtures;
  try {
    const teams_result = await team_repository.find_all();
    if (!teams_result.success || !teams_result.data) return fixtures;
    const teams_map = new Map<string, Team>(
      teams_result.data.items.map((t) => [t.id, t]),
    );
    return fixtures.map(
      (fixture) =>
        ({
          ...fixture,
          home_team_name:
            teams_map.get(fixture.home_team_id)?.name || fixture.home_team_id,
          away_team_name:
            teams_map.get(fixture.away_team_id)?.name || fixture.away_team_id,
        }) as Fixture,
    );
  } catch (error) {
    console.warn("[Fixture] Failed to enrich with team names", {
      event: "enrich_failed",
      error: String(error),
    });
    return fixtures;
  }
}

function find_unmapped_rounds(config: FixtureGenerationConfig): number[] {
  return Array.from({ length: config.rounds }, (_, i) => i + 1).filter(
    (round) => !config.stage_id_per_round[round]?.trim(),
  );
}

export function create_fixture_use_cases(
  repository: FixtureRepository,
  team_repository?: TeamRepository,
): FixtureUseCases {
  return {
    async list(
      filter?: FixtureFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      const result = await repository.find_all(filter, options);
      if (!result.success) return result;
      const enriched_fixtures = await enrich_fixtures_with_team_names(
        result.data.items,
        team_repository,
      );
      return create_success_result({
        ...result.data,
        items: enriched_fixtures,
      });
    },

    async get_by_id(id: string): AsyncResult<Fixture> {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      return repository.find_by_id(id);
    },

    async create(input: CreateFixtureInput): AsyncResult<Fixture> {
      const validation_errors = validate_fixture_input(input);
      if (validation_errors.length > 0)
        return create_failure_result(validation_errors.join(", "));
      return repository.create(input);
    },

    async update(id: string, input: UpdateFixtureInput): AsyncResult<Fixture> {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id?.trim()) return create_failure_result("Fixture ID is required");
      return repository.delete_by_id(id);
    },

    async list_fixtures_by_competition(
      competition_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      if (!competition_id?.trim())
        return create_failure_result("Competition ID is required");
      return repository.find_by_competition(competition_id, options);
    },

    async list_fixtures_by_team(
      team_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      if (!team_id?.trim()) return create_failure_result("Team ID is required");
      return repository.find_by_team(team_id, options);
    },

    async list_fixtures_by_round(
      competition_id: string,
      round_number: number,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Fixture> {
      if (!competition_id?.trim())
        return create_failure_result("Competition ID is required");
      if (round_number < 1)
        return create_failure_result("Round number must be at least 1");
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
      if (!config.competition_id)
        return create_failure_result("Competition ID is required");
      if (!config.team_ids || config.team_ids.length < 2)
        return create_failure_result("At least 2 teams are required");
      if (!config.start_date)
        return create_failure_result("Start date is required");
      const unmapped_rounds = find_unmapped_rounds(config);
      if (unmapped_rounds.length > 0) {
        return create_failure_result(
          `All rounds must be mapped to a stage. Missing stage mappings for rounds: ${unmapped_rounds.join(", ")}`,
        );
      }
      const fixture_inputs = generate_round_robin_fixtures(config);
      const result = await repository.create_many(fixture_inputs);
      if (result.success && result.data) {
        for (const created of result.data.items) {
          const display_name =
            `${created.venue || "Fixture"} - Round ${created.round_number || ""}`.trim() ||
            created.id;
          EventBus.emit_entity_created(
            ENTITY_TYPE,
            created.id,
            display_name,
            created as unknown as Record<string, unknown>,
          );
        }
      }
      return result;
    },

    ...create_fixture_game_events(repository),
  };
}
