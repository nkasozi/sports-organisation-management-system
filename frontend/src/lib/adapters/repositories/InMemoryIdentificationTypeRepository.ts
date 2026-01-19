import type {
  IdentificationTypeRepository,
  IdentificationTypeFilter,
} from "../../core/interfaces/adapters/IdentificationTypeRepository";
import type {
  IdentificationType,
  CreateIdentificationTypeInput,
  UpdateIdentificationTypeInput,
} from "../../core/entities/IdentificationType";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_identification_types";
const ENTITY_PREFIX = "id_type";

function get_default_identification_types(): CreateIdentificationTypeInput[] {
  return [
    {
      name: "National ID",
      identifier_field_label: "National ID Number",
      description: "Government-issued national identification card",
      status: "active",
    },
    {
      name: "Passport",
      identifier_field_label: "Passport Number",
      description: "International travel document",
      status: "active",
    },
    {
      name: "Driver's License",
      identifier_field_label: "License Number",
      description: "Government-issued driving permit",
      status: "active",
    },
    {
      name: "Birth Certificate",
      identifier_field_label: "Certificate Number",
      description: "Official document recording birth",
      status: "active",
    },
  ];
}

export class InMemoryIdentificationTypeRepository
  extends InMemoryBaseRepository<
    IdentificationType,
    CreateIdentificationTypeInput,
    UpdateIdentificationTypeInput
  >
  implements IdentificationTypeRepository
{
  private seeded = false;

  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  private async seed_default_types_if_needed(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    await this.ensure_cache_initialized();

    if (this.entity_cache.size > 0) return;

    const default_types = get_default_identification_types();
    for (const type_input of default_types) {
      await this.create(type_input);
    }
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
    await this.seed_default_types_if_needed();
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (type) => type.status === filter.status,
      );
    }

    const page_number = options?.page_number || 1;
    const page_size = options?.page_size || 20;
    const start_index = (page_number - 1) * page_size;
    const paginated_items = filtered_entities.slice(
      start_index,
      start_index + page_size,
    );

    return create_success_result(
      this.create_paginated_result(
        paginated_items,
        filtered_entities.length,
        options,
      ),
    );
  }

  async find_active_types(
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType> {
    return this.find_by_filter({ status: "active" }, options);
  }

  async find_all(
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType> {
    await this.seed_default_types_if_needed();
    return super.find_all(options);
  }

  async find_all_with_filter(
    filter?: IdentificationTypeFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType> {
    await this.seed_default_types_if_needed();
    if (!filter) {
      return this.find_all(options);
    }
    return this.find_by_filter(filter, options);
  }
}

let identification_type_repository_instance: InMemoryIdentificationTypeRepository | null =
  null;

export function get_identification_type_repository(): InMemoryIdentificationTypeRepository {
  if (!identification_type_repository_instance) {
    identification_type_repository_instance =
      new InMemoryIdentificationTypeRepository();
  }
  return identification_type_repository_instance;
}
