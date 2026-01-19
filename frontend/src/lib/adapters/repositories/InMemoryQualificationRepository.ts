import type {
  Qualification,
  CreateQualificationInput,
  UpdateQualificationInput,
  QualificationHolderType,
} from "../../core/entities/Qualification";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  QualificationRepository,
  QualificationFilter,
} from "../../core/interfaces/adapters/QualificationRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_qualifications";
const ENTITY_PREFIX = "qual";

export class InMemoryQualificationRepository
  extends InMemoryBaseRepository<
    Qualification,
    CreateQualificationInput,
    UpdateQualificationInput
  >
  implements QualificationRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateQualificationInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Qualification {
    return {
      id,
      ...timestamps,
      holder_type: input.holder_type,
      holder_id: input.holder_id,
      certification_name: input.certification_name,
      certification_level: input.certification_level,
      certification_number: input.certification_number,
      issuing_authority: input.issuing_authority,
      issue_date: input.issue_date,
      expiry_date: input.expiry_date,
      specializations: input.specializations || [],
      notes: input.notes,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Qualification,
    updates: UpdateQualificationInput,
  ): Qualification {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: QualificationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.holder_type) {
      filtered_entities = filtered_entities.filter(
        (qual) => qual.holder_type === filter.holder_type,
      );
    }

    if (filter.holder_id) {
      filtered_entities = filtered_entities.filter(
        (qual) => qual.holder_id === filter.holder_id,
      );
    }

    if (filter.certification_level) {
      filtered_entities = filtered_entities.filter(
        (qual) => qual.certification_level === filter.certification_level,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (qual) => qual.status === filter.status,
      );
    }

    if (filter.is_expired !== undefined) {
      const today = new Date();
      filtered_entities = filtered_entities.filter((qual) => {
        if (!qual.expiry_date) return !filter.is_expired;
        const expiry = new Date(qual.expiry_date);
        return filter.is_expired ? expiry < today : expiry >= today;
      });
    }

    const total_count = filtered_entities.length;
    const paginated_entities = this.apply_pagination_and_sort(
      filtered_entities,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_entities, total_count, options),
    );
  }

  async find_by_holder(
    holder_type: QualificationHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification> {
    return this.find_by_filter({ holder_type, holder_id }, options);
  }

  async find_active_qualifications(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification> {
    return this.find_by_filter(
      { status: "active", is_expired: false },
      options,
    );
  }
}

let singleton_instance: InMemoryQualificationRepository | null = null;

export function get_qualification_repository(): QualificationRepository {
  if (!singleton_instance) {
    singleton_instance = new InMemoryQualificationRepository();
    singleton_instance["ensure_cache_initialized"]();
  }

  return singleton_instance;
}

export function reset_qualification_repository(): void {
  if (singleton_instance) {
    singleton_instance.clear_all_data();
  }
}
