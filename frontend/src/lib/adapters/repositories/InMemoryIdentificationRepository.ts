import type {
  IdentificationRepository,
  IdentificationFilter,
} from "../../core/interfaces/adapters/IdentificationRepository";
import type {
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput,
  IdentificationHolderType,
} from "../../core/entities/Identification";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_identifications";
const ENTITY_PREFIX = "ident";

export class InMemoryIdentificationRepository
  extends InMemoryBaseRepository<
    Identification,
    CreateIdentificationInput,
    UpdateIdentificationInput
  >
  implements IdentificationRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateIdentificationInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Identification {
    return {
      id,
      ...timestamps,
      holder_type: input.holder_type,
      holder_id: input.holder_id,
      identification_type_id: input.identification_type_id,
      identifier_value: input.identifier_value,
      document_image_url: input.document_image_url,
      issue_date: input.issue_date,
      expiry_date: input.expiry_date,
      notes: input.notes,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Identification,
    updates: UpdateIdentificationInput,
  ): Identification {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: IdentificationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.holder_type) {
      filtered_entities = filtered_entities.filter(
        (ident) => ident.holder_type === filter.holder_type,
      );
    }

    if (filter.holder_id) {
      filtered_entities = filtered_entities.filter(
        (ident) => ident.holder_id === filter.holder_id,
      );
    }

    if (filter.identification_type_id) {
      filtered_entities = filtered_entities.filter(
        (ident) =>
          ident.identification_type_id === filter.identification_type_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (ident) => ident.status === filter.status,
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

  async find_by_holder(
    holder_type: IdentificationHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification> {
    return this.find_by_filter({ holder_type, holder_id }, options);
  }

  async find_all_with_filter(
    filter?: IdentificationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification> {
    if (!filter) {
      return this.find_all(options);
    }
    return this.find_by_filter(filter, options);
  }

  seed_with_data(identifications: Identification[]): void {
    this.ensure_cache_initialized();
    for (const identification of identifications) {
      this.entity_cache.set(identification.id, identification);
    }
    this.save_to_local_storage();
  }
}

let identification_repository_instance: InMemoryIdentificationRepository | null =
  null;

export function get_identification_repository(): InMemoryIdentificationRepository {
  if (!identification_repository_instance) {
    identification_repository_instance = new InMemoryIdentificationRepository();
  }
  return identification_repository_instance;
}
