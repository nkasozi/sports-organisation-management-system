import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateOfficialInput,
  Official,
  UpdateOfficialInput,
} from "../../core/entities/Official";
import { DEFAULT_OFFICIAL_AVATAR } from "../../core/entities/Official";
import type {
  OfficialFilter,
  OfficialRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_officials } from "./InBrowserOfficialRepositoryDefaults";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "official";

const OFFICIAL_FILTER_RULES: EntityFilterRule<Official, OfficialFilter>[] = [
  text_contains_rule(
    "name_contains",
    (official) => `${official.first_name} ${official.last_name}`,
  ),
  equals_rule("organization_id"),
  equals_rule("status"),
];
export class InBrowserOfficialRepository
  extends InBrowserBaseRepository<
    Official,
    CreateOfficialInput,
    UpdateOfficialInput,
    OfficialFilter
  >
  implements OfficialRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }
  protected get_table(): Table<Official, string> {
    return this.database.officials;
  }

  protected create_entity_from_input(
    input: CreateOfficialInput,
    id: Official["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Official {
    return {
      id,
      ...timestamps,
      first_name: input.first_name,
      last_name: input.last_name,
      gender_id: input.gender_id,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.date_of_birth,
      organization_id: input.organization_id,
      years_of_experience: input.years_of_experience,
      nationality: input.nationality,
      profile_image_url: input.profile_image_url || DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: input.emergency_contact_name,
      emergency_contact_phone: input.emergency_contact_phone,
      notes: input.notes,
      status: input.status,
    } as Official;
  }

  protected apply_updates_to_entity(
    entity: Official,
    updates: UpdateOfficialInput,
  ): Official {
    return {
      ...entity,
      ...updates,
    } as Official;
  }

  protected apply_entity_filter(
    entities: Official[],
    filter: OfficialFilter,
  ): Official[] {
    return apply_entity_filter_rules(entities, filter, OFFICIAL_FILTER_RULES);
  }

  async find_by_organization(
    organization_id: Official["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    return this.find_all({ organization_id }, options);
  }

  async find_active_officials(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    return this.find_all({ status: "active" }, options);
  }

  async find_available_for_date(
    _date: Official["date_of_birth"],
    organization_id?: Official["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    const filter: OfficialFilter = { status: "active" };
    if (organization_id) {
      filter.organization_id = organization_id;
    }
    return this.find_all(filter, options);
  }
}

export const get_official_repository: () => OfficialRepository =
  create_lazy_repository_accessor(() => new InBrowserOfficialRepository());

export function reset_official_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    (
      get_official_repository() as InBrowserOfficialRepository
    ).with_write_origin(origin),
    create_default_officials(),
  );
}
