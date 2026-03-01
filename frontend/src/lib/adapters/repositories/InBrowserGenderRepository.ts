import type { Table } from "dexie";
import type {
  Gender,
  CreateGenderInput,
  UpdateGenderInput,
} from "../../core/entities/Gender";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  GenderRepository,
  GenderFilter,
} from "../../core/interfaces/adapters/GenderRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "gender";

export class InBrowserGenderRepository
  extends InBrowserBaseRepository<Gender, CreateGenderInput, UpdateGenderInput>
  implements GenderRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Gender, string> {
    return this.database.genders;
  }

  protected create_entity_from_input(
    input: CreateGenderInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Gender {
    return {
      id,
      ...timestamps,
      name: input.name,
      description: input.description,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Gender,
    updates: UpdateGenderInput,
  ): Gender {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: GenderFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Gender> {
    try {
      let filtered_entities = await this.database.genders.toArray();

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (gender) => gender.status === filter.status,
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
        `Failed to filter genders: ${error_message}`,
      );
    }
  }

  async find_active_genders(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Gender> {
    return this.find_by_filter({ status: "active" }, options);
  }
}

export function create_default_genders(): Gender[] {
  const now = new Date().toISOString();

  return [
    {
      id: "gender_default_male",
      name: "Male",
      description: "Male gender",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "gender_default_female",
      name: "Female",
      description: "Female gender",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserGenderRepository | null = null;

export function get_gender_repository(): GenderRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserGenderRepository();
  }
  return singleton_instance;
}

export async function initialize_gender_repository(): Promise<void> {
  const repository = get_gender_repository() as InBrowserGenderRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_genders());
  }
}

export async function reset_gender_repository(): Promise<void> {
  const repository = get_gender_repository() as InBrowserGenderRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_genders());
}
