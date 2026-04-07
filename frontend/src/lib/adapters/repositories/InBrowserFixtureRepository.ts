import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  create_timestamp_fields,
  generate_unique_id,
} from "../../core/entities/BaseEntity";
import type {
  CreateFixtureInput,
  Fixture,
  UpdateFixtureInput,
} from "../../core/entities/Fixture";
import type {
  FixtureFilter,
  FixtureRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "fixture";

export class InBrowserFixtureRepository
  extends InBrowserBaseRepository<
    Fixture,
    CreateFixtureInput,
    UpdateFixtureInput,
    FixtureFilter
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
      ...input,
      assigned_officials: input.assigned_officials || [],
      game_events: [],
      current_period: "pre_game",
      current_minute: 0,
      home_team_score: null,
      away_team_score: null,
    };
  }

  protected apply_updates_to_entity(
    entity: Fixture,
    updates: UpdateFixtureInput,
  ): Fixture {
    return { ...entity, ...updates };
  }

  protected apply_entity_filter(
    entities: Fixture[],
    filter: FixtureFilter,
  ): Fixture[] {
    let filtered = entities;
    if (filter.organization_id) {
      filtered = filtered.filter(
        (f) => f.organization_id === filter.organization_id,
      );
    }
    if (filter.competition_id) {
      filtered = filtered.filter(
        (f) => f.competition_id === filter.competition_id,
      );
    }
    if (filter.stage_id) {
      filtered = filtered.filter((f) => f.stage_id === filter.stage_id);
    }
    if (filter.home_team_id) {
      filtered = filtered.filter((f) => f.home_team_id === filter.home_team_id);
    }
    if (filter.away_team_id) {
      filtered = filtered.filter((f) => f.away_team_id === filter.away_team_id);
    }
    if (filter.team_id) {
      filtered = filtered.filter(
        (f) =>
          f.home_team_id === filter.team_id ||
          f.away_team_id === filter.team_id,
      );
    }
    if (filter.round_number !== undefined) {
      filtered = filtered.filter((f) => f.round_number === filter.round_number);
    }
    if (filter.match_day !== undefined) {
      filtered = filtered.filter((f) => f.match_day === filter.match_day);
    }
    if (filter.status) {
      filtered = filtered.filter((f) => f.status === filter.status);
    }
    if (filter.scheduled_date_from) {
      filtered = filtered.filter(
        (f) => f.scheduled_date >= filter.scheduled_date_from!,
      );
    }
    if (filter.scheduled_date_to) {
      filtered = filtered.filter(
        (f) => f.scheduled_date <= filter.scheduled_date_to!,
      );
    }
    filtered.sort((a, b) => {
      const date_cmp = a.scheduled_date.localeCompare(b.scheduled_date);
      return date_cmp !== 0
        ? date_cmp
        : a.scheduled_time.localeCompare(b.scheduled_time);
    });
    return filtered;
  }

  async find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_all({ competition_id }, options);
  }

  async find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_all({ team_id }, options);
  }

  async find_by_round(
    competition_id: string,
    round_number: number,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_all({ competition_id, round_number }, options);
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
    return this.find_all(filter, options);
  }

  async find_by_date_range(
    start_date: string,
    end_date: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Fixture> {
    return this.find_all(
      { scheduled_date_from: start_date, scheduled_date_to: end_date },
      options,
    );
  }

  async create_many(
    inputs: CreateFixtureInput[],
  ): PaginatedAsyncResult<Fixture> {
    try {
      const created_fixtures = inputs.map((input) => {
        const entity_id = generate_unique_id(ENTITY_PREFIX);
        return this.create_entity_from_input(
          input,
          entity_id,
          create_timestamp_fields(),
        );
      });
      await this.database.fixtures.bulkAdd(created_fixtures);
      return create_success_result({
        items: created_fixtures,
        total_count: created_fixtures.length,
        page_number: 1,
        page_size: created_fixtures.length,
        total_pages: 1,
      });
    } catch (error) {
      console.warn("[FixtureRepository] Failed to create fixtures", {
        event: "repository_create_fixtures_failed",
        error: String(error),
      });
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to create fixtures: ${error_message}`,
      );
    }
  }
}

function create_default_fixtures(): Fixture[] {
  return [];
}
let singleton_instance: InBrowserFixtureRepository | null = null;

export function get_fixture_repository(): FixtureRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserFixtureRepository();
  }
  return singleton_instance;
}

export async function reset_fixture_repository(): Promise<void> {
  const repository = get_fixture_repository() as InBrowserFixtureRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_fixtures());
}
