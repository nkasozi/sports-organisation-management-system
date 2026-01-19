import type {
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
} from "../../core/entities/Official";
import { DEFAULT_OFFICIAL_AVATAR } from "../../core/entities/Official";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  OfficialRepository,
  OfficialFilter,
} from "../../core/interfaces/adapters/OfficialRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_officials";
const ENTITY_PREFIX = "official";

export class InMemoryOfficialRepository
  extends InMemoryBaseRepository<
    Official,
    CreateOfficialInput,
    UpdateOfficialInput
  >
  implements OfficialRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateOfficialInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Official {
    return {
      id,
      ...timestamps,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.date_of_birth,
      organization_id: input.organization_id,
      primary_role_id: input.primary_role_id,
      years_of_experience: input.years_of_experience,
      nationality: input.nationality,
      profile_image_url: input.profile_image_url || DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: input.emergency_contact_name,
      emergency_contact_phone: input.emergency_contact_phone,
      notes: input.notes,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Official,
    updates: UpdateOfficialInput,
  ): Official {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: OfficialFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((official) =>
        `${official.first_name} ${official.last_name}`
          .toLowerCase()
          .includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered_entities = filtered_entities.filter(
        (official) => official.organization_id === filter.organization_id,
      );
    }

    if (filter.primary_role_id) {
      filtered_entities = filtered_entities.filter(
        (official) => official.primary_role_id === filter.primary_role_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (official) => official.status === filter.status,
      );
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

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    return this.find_by_filter({ organization_id }, options);
  }

  async find_by_role_id(
    role_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    return this.find_by_filter({ primary_role_id: role_id }, options);
  }

  async find_active_officials(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    return this.find_by_filter({ status: "active" }, options);
  }

  async find_available_for_date(
    _date: string,
    organization_id?: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    const filter: OfficialFilter = { status: "active" };
    if (organization_id) {
      filter.organization_id = organization_id;
    }
    return this.find_by_filter(filter, options);
  }

  async find_all(options?: QueryOptions): PaginatedAsyncResult<Official> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const all_entities = Array.from(this.entity_cache.values());
    const total_count = all_entities.length;
    const paginated_entities = this.apply_pagination_and_sort(
      all_entities,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_entities, total_count, options),
    );
  }
}

let repository_instance: InMemoryOfficialRepository | null = null;

export function get_official_repository(): OfficialRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryOfficialRepository();
  }
  return repository_instance;
}

export function reset_official_repository(): void {
  repository_instance = null;
}
