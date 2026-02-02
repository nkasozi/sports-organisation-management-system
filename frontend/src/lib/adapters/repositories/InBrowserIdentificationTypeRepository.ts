import type { Table } from "dexie";
import type {
  IdentificationType,
  CreateIdentificationTypeInput,
  UpdateIdentificationTypeInput,
} from "../../core/entities/IdentificationType";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  IdentificationTypeRepository,
  IdentificationTypeFilter,
} from "../../core/interfaces/adapters/IdentificationTypeRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "id_type";

export class InBrowserIdentificationTypeRepository
  extends InBrowserBaseRepository<
    IdentificationType,
    CreateIdentificationTypeInput,
    UpdateIdentificationTypeInput
  >
  implements IdentificationTypeRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<IdentificationType, string> {
    return this.database.identification_types;
  }

  protected create_entity_from_input(
    input: CreateIdentificationTypeInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): IdentificationType {
    return {
      id,
      ...timestamps,
      name: input.name,
      identifier_field_label: input.identifier_field_label,
      description: input.description,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: IdentificationType,
    updates: UpdateIdentificationTypeInput,
  ): IdentificationType {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: IdentificationTypeFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType> {
    try {
      let filtered_entities =
        await this.database.identification_types.toArray();

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (identification_type) => identification_type.status === filter.status,
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
        `Failed to filter identification types: ${error_message}`,
      );
    }
  }

  async find_active_types(
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType> {
    return this.find_by_filter({ status: "active" }, options);
  }
}

export function create_default_identification_types(): IdentificationType[] {
  const now = new Date().toISOString();

  return [
    {
      id: "id_type_default_1",
      name: "National ID",
      identifier_field_label: "National ID Number",
      description: "Government-issued national identification card",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "id_type_default_2",
      name: "Passport",
      identifier_field_label: "Passport Number",
      description: "International travel document",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "id_type_default_3",
      name: "Driver's License",
      identifier_field_label: "License Number",
      description: "Government-issued driving permit",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "id_type_default_4",
      name: "Birth Certificate",
      identifier_field_label: "Certificate Number",
      description: "Official document recording birth",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserIdentificationTypeRepository | null = null;

export function get_identification_type_repository(): IdentificationTypeRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserIdentificationTypeRepository();
  }
  return singleton_instance;
}

export async function initialize_identification_type_repository(): Promise<void> {
  const repository =
    get_identification_type_repository() as InBrowserIdentificationTypeRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_identification_types());
  }
}

export async function reset_identification_type_repository(): Promise<void> {
  const repository =
    get_identification_type_repository() as InBrowserIdentificationTypeRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_identification_types());
}
