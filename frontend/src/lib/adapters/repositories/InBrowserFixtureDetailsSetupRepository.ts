import type { Table } from "dexie";
import type {
  FixtureDetailsSetup,
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
} from "../../core/entities/FixtureDetailsSetup";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  FixtureDetailsSetupRepository,
  FixtureDetailsSetupFilter,
} from "../../core/interfaces/adapters/FixtureDetailsSetupRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "fixture-details-setup";

export class InBrowserFixtureDetailsSetupRepository
  extends InBrowserBaseRepository<
    FixtureDetailsSetup,
    CreateFixtureDetailsSetupInput,
    UpdateFixtureDetailsSetupInput
  >
  implements FixtureDetailsSetupRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<FixtureDetailsSetup, string> {
    return this.database.fixture_details_setups;
  }

  protected create_entity_from_input(
    input: CreateFixtureDetailsSetupInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): FixtureDetailsSetup {
    return {
      id,
      ...timestamps,
      fixture_id: input.fixture_id,
      home_team_jersey_id: input.home_team_jersey_id || "",
      away_team_jersey_id: input.away_team_jersey_id || "",
      official_jersey_id: input.official_jersey_id || "",
      assigned_officials: input.assigned_officials || [],
      assignment_notes: input.assignment_notes || "",
      confirmation_status: input.confirmation_status || "pending",
      status: input.status || "active",
    };
  }

  protected apply_updates_to_entity(
    entity: FixtureDetailsSetup,
    updates: UpdateFixtureDetailsSetupInput,
  ): FixtureDetailsSetup {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: FixtureDetailsSetupFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup> {
    try {
      let filtered_entities =
        await this.database.fixture_details_setups.toArray();

      if (filter.fixture_id) {
        filtered_entities = filtered_entities.filter(
          (item) => item.fixture_id === filter.fixture_id,
        );
      }

      if (filter.official_id) {
        filtered_entities = filtered_entities.filter((item) =>
          item.assigned_officials.some(
            (assignment) => assignment.official_id === filter.official_id,
          ),
        );
      }

      if (filter.role_id) {
        filtered_entities = filtered_entities.filter((item) =>
          item.assigned_officials.some(
            (assignment) => assignment.role_id === filter.role_id,
          ),
        );
      }

      if (filter.confirmation_status) {
        filtered_entities = filtered_entities.filter(
          (item) => item.confirmation_status === filter.confirmation_status,
        );
      }

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
        `Failed to filter fixture details setups: ${error_message}`,
      );
    }
  }

  async find_by_fixture(
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup> {
    return this.find_by_filter({ fixture_id }, options);
  }

  async find_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup> {
    return this.find_by_filter({ official_id }, options);
  }
}

export function create_default_fixture_details_setups(): FixtureDetailsSetup[] {
  return [];
}

let singleton_instance: InBrowserFixtureDetailsSetupRepository | null = null;

export function get_fixture_details_setup_repository(): FixtureDetailsSetupRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserFixtureDetailsSetupRepository();
  }
  return singleton_instance;
}

export async function initialize_fixture_details_setup_repository(): Promise<void> {
  const repository =
    get_fixture_details_setup_repository() as InBrowserFixtureDetailsSetupRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_fixture_details_setups());
  }
}

export async function reset_fixture_details_setup_repository(): Promise<void> {
  const repository =
    get_fixture_details_setup_repository() as InBrowserFixtureDetailsSetupRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_fixture_details_setups());
}
