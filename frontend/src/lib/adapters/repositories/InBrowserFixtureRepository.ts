import type { Table } from "dexie";
import type {
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
} from "../../core/entities/Fixture";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  generate_unique_id,
  create_timestamp_fields,
} from "../../core/entities/BaseEntity";
import type {
  FixtureRepository,
  FixtureFilter,
} from "../../core/interfaces/adapters/FixtureRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "fixture";

export class InBrowserFixtureRepository
  extends InBrowserBaseRepository<
    Fixture,
    CreateFixtureInput,
    UpdateFixtureInput
  >
  implements FixtureRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Fixture, string> {
    return this.database.fixtures;
  }

  protected create_entity_from_input(
    input: CreateFixtureInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Fixture {
    return {
      id,
      ...timestamps,
      competition_id: input.competition_id,
      round_number: input.round_number,
      round_name: input.round_name,
      home_team_id: input.home_team_id,
      away_team_id: input.away_team_id,
      venue: input.venue,
      scheduled_date: input.scheduled_date,
      scheduled_time: input.scheduled_time,
      home_team_score: null,
      away_team_score: null,
      assigned_officials: input.assigned_officials || [],
      game_events: [],
      current_period: "pre_game",
      current_minute: 0,
      match_day: input.match_day,
      notes: input.notes,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Fixture,
    updates: UpdateFixtureInput,
  ): Fixture {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: FixtureFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    try {
      let filtered_entities = await this.database.fixtures.toArray();

      if (filter.competition_id) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.competition_id === filter.competition_id,
        );
      }

      if (filter.home_team_id) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.home_team_id === filter.home_team_id,
        );
      }

      if (filter.away_team_id) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.away_team_id === filter.away_team_id,
        );
      }

      if (filter.team_id) {
        filtered_entities = filtered_entities.filter(
          (fixture) =>
            fixture.home_team_id === filter.team_id ||
            fixture.away_team_id === filter.team_id,
        );
      }

      if (filter.round_number !== undefined) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.round_number === filter.round_number,
        );
      }

      if (filter.match_day !== undefined) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.match_day === filter.match_day,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.status === filter.status,
        );
      }

      if (filter.scheduled_date_from) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.scheduled_date >= filter.scheduled_date_from!,
        );
      }

      if (filter.scheduled_date_to) {
        filtered_entities = filtered_entities.filter(
          (fixture) => fixture.scheduled_date <= filter.scheduled_date_to!,
        );
      }

      filtered_entities.sort((a, b) => {
        const date_comparison = a.scheduled_date.localeCompare(
          b.scheduled_date,
        );
        if (date_comparison !== 0) return date_comparison;
        return a.scheduled_time.localeCompare(b.scheduled_time);
      });

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter fixtures: ${error_message}`,
      );
    }
  }

  async find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_by_filter({ competition_id }, options);
  }

  async find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_by_filter({ team_id }, options);
  }

  async find_by_round(
    competition_id: string,
    round_number: number,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_by_filter({ competition_id, round_number }, options);
  }

  async find_upcoming(
    competition_id?: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    const today = new Date().toISOString().split("T")[0];
    const filter: FixtureFilter = {
      status: "scheduled",
      scheduled_date_from: today,
    };
    if (competition_id) {
      filter.competition_id = competition_id;
    }
    return this.find_by_filter(filter, options);
  }

  async find_by_date_range(
    start_date: string,
    end_date: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_by_filter(
      {
        scheduled_date_from: start_date,
        scheduled_date_to: end_date,
      },
      options,
    );
  }

  async create_many(
    inputs: CreateFixtureInput[],
  ): PaginatedAsyncResult<Fixture> {
    try {
      const created_fixtures: Fixture[] = [];

      for (const input of inputs) {
        const entity_id = generate_unique_id(ENTITY_PREFIX);
        const timestamps = create_timestamp_fields();
        const fixture = this.create_entity_from_input(
          input,
          entity_id,
          timestamps,
        );
        created_fixtures.push(fixture);
      }

      await this.database.fixtures.bulkAdd(created_fixtures);

      return create_success_result({
        items: created_fixtures,
        total_count: created_fixtures.length,
        page_number: 1,
        page_size: created_fixtures.length,
        total_pages: 1,
      });
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to create fixtures: ${error_message}`,
      );
    }
  }
}

export function create_default_fixtures(): Fixture[] {
  return [];
}

let singleton_instance: InBrowserFixtureRepository | null = null;

export function get_fixture_repository(): FixtureRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserFixtureRepository();
  }
  return singleton_instance;
}

export async function initialize_fixture_repository(): Promise<void> {
  const repository = get_fixture_repository() as InBrowserFixtureRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_fixtures());
  }
}

export async function reset_fixture_repository(): Promise<void> {
  const repository = get_fixture_repository() as InBrowserFixtureRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_fixtures());
}
