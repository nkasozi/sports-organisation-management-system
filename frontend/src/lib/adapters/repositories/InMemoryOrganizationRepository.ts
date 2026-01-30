import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../../core/entities/Organization";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  OrganizationRepository,
  OrganizationFilter,
} from "../../core/interfaces/adapters/OrganizationRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import { get_sport_id_by_code_sync } from "./InMemorySportRepository";

const STORAGE_KEY = "sports_org_organizations";
const ENTITY_PREFIX = "org";

export class InMemoryOrganizationRepository
  extends InMemoryBaseRepository<
    Organization,
    CreateOrganizationInput,
    UpdateOrganizationInput
  >
  implements OrganizationRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateOrganizationInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Organization {
    return {
      id,
      ...timestamps,
      name: input.name,
      description: input.description,
      sport_id: input.sport_id,
      founded_date: input.founded_date,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      address: input.address,
      website: input.website,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Organization,
    updates: UpdateOrganizationInput,
  ): Organization {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: OrganizationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Organization> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((org) =>
        org.name.toLowerCase().includes(search_term),
      );
    }

    if (filter?.sport_id) {
      filtered_entities = filtered_entities.filter(
        (org) => org.sport_id === filter.sport_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (org) => org.status === filter.status,
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

  async find_active_organizations(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Organization> {
    return this.find_by_filter({ status: "active" }, options);
  }
}

function create_default_organizations(): Organization[] {
  const now = new Date().toISOString();

  const field_hockey_sport_id = get_sport_id_by_code_sync("FIELD_HOCKEY") || "";

  return [
    {
      id: "org_default_1",
      name: "Uganda Hockey Association",
      description:
        "The governing body for field hockey in Uganda - organizing national competitions, developing players, and promoting hockey across the country",
      sport_id: field_hockey_sport_id,
      founded_date: "1972-06-15",
      contact_email: "info@ugandahockey.org",
      contact_phone: "+256-700-123-456",
      address: "Lugogo Hockey Stadium, Kampala, Uganda",
      website: "https://ugandahockey.org",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InMemoryOrganizationRepository | null = null;

export function get_organization_repository(): OrganizationRepository {
  if (!singleton_instance) {
    singleton_instance = new InMemoryOrganizationRepository();

    const existing_result = singleton_instance["entity_cache"];
    singleton_instance["ensure_cache_initialized"]();

    if (singleton_instance["entity_cache"].size === 0) {
      singleton_instance.seed_with_data(create_default_organizations());
    }
  }

  return singleton_instance;
}

export function reset_organization_repository(): void {
  if (singleton_instance) {
    singleton_instance.clear_all_data();
    singleton_instance.seed_with_data(create_default_organizations());
  }
}
