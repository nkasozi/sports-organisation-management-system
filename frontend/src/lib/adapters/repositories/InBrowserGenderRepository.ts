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
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "gender";

export class InBrowserGenderRepository
  extends InBrowserBaseRepository<
    Gender,
    CreateGenderInput,
    UpdateGenderInput,
    GenderFilter
  >
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

  protected apply_entity_filter(
    entities: Gender[],
    filter: GenderFilter,
  ): Gender[] {
    let filtered_entities = entities;

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (gender) => gender.status === filter.status,
      );
    }

    return filtered_entities;
  }

  async find_active_genders(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Gender> {
    return this.find_all({ status: "active" }, options);
  }
}

let singleton_instance: InBrowserGenderRepository | null = null;

export function get_gender_repository(): GenderRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserGenderRepository();
  }
  return singleton_instance;
}
