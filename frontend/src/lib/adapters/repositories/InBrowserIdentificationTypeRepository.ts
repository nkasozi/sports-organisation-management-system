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
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
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
    UpdateIdentificationTypeInput,
    IdentificationTypeFilter
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
      organization_id: input.organization_id,
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

  protected apply_entity_filter(
    entities: IdentificationType[],
    filter: IdentificationTypeFilter,
  ): IdentificationType[] {
    let filtered = entities;

    if (filter.status) {
      filtered = filtered.filter(
        (identification_type) => identification_type.status === filter.status,
      );
    }

    if (filter.organization_id) {
      filtered = filtered.filter(
        (identification_type) =>
          identification_type.organization_id === filter.organization_id,
      );
    }

    return filtered;
  }

  async find_active_types(
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType> {
    return this.find_all({ status: "active" }, options);
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType> {
    return this.find_all({ organization_id }, options);
  }
}

let singleton_instance: InBrowserIdentificationTypeRepository | null = null;

export function get_identification_type_repository(): IdentificationTypeRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserIdentificationTypeRepository();
  }
  return singleton_instance;
}
