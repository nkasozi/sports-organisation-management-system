import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "../../core/entities/Organization";
import type { Sport } from "../../core/entities/Sport";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type {
  OrganizationFilter,
  OrganizationRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_organizations } from "./InBrowserOrganizationRepositoryDefaults";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "org";

class InBrowserOrganizationRepository
  extends InBrowserBaseRepository<
    Organization,
    CreateOrganizationInput,
    UpdateOrganizationInput,
    OrganizationFilter
  >
  implements OrganizationRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Organization, string> {
    return this.database.organizations;
  }

  protected create_entity_from_input(
    input: CreateOrganizationInput,
    id: Organization["id"],
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
    } as Organization;
  }

  protected apply_updates_to_entity(
    entity: Organization,
    updates: UpdateOrganizationInput,
  ): Organization {
    return {
      ...entity,
      ...updates,
    } as Organization;
  }

  protected apply_entity_filter(
    entities: Organization[],
    filter: OrganizationFilter,
  ): Organization[] {
    let filtered_entities = entities;

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

    return filtered_entities;
  }

  async find_active_organizations(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Organization> {
    return this.find_all({ status: ENTITY_STATUS.ACTIVE }, options);
  }
}

const get_concrete_repository: () => InBrowserOrganizationRepository =
  create_lazy_repository_accessor(() => new InBrowserOrganizationRepository());

export function get_organization_repository(): OrganizationRepository {
  return get_concrete_repository();
}

export async function reset_organization_repository(
  seeded_sports: Sport[],
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  const defaults_result = create_default_organizations(seeded_sports);
  if (!defaults_result.success) return defaults_result;
  return reset_repository_data(
    get_concrete_repository().with_write_origin(origin),
    defaults_result.data,
  );
}
