import type { Table } from "dexie";
import type {
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput,
  IdentificationHolderType,
} from "../../core/entities/Identification";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  IdentificationRepository,
  IdentificationFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "ident";

class InBrowserIdentificationRepository
  extends InBrowserBaseRepository<
    Identification,
    CreateIdentificationInput,
    UpdateIdentificationInput,
    IdentificationFilter
  >
  implements IdentificationRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Identification, string> {
    return this.database.identifications;
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

  protected apply_entity_filter(
    entities: Identification[],
    filter: IdentificationFilter,
  ): Identification[] {
    let filtered = entities;

    if (filter.holder_type) {
      filtered = filtered.filter(
        (ident) => ident.holder_type === filter.holder_type,
      );
    }

    if (filter.holder_id) {
      filtered = filtered.filter(
        (ident) => ident.holder_id === filter.holder_id,
      );
    }

    if (filter.identification_type_id) {
      filtered = filtered.filter(
        (ident) =>
          ident.identification_type_id === filter.identification_type_id,
      );
    }

    if (filter.status) {
      filtered = filtered.filter((ident) => ident.status === filter.status);
    }

    return filtered;
  }

  async find_by_holder(
    holder_type: IdentificationHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification> {
    return this.find_all({ holder_type, holder_id }, options);
  }

  async find_all_with_filter(
    filter?: IdentificationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification> {
    return this.find_all(filter, options);
  }
}

let singleton_instance: InBrowserIdentificationRepository | null = null;

export function get_identification_repository(): IdentificationRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserIdentificationRepository();
  }
  return singleton_instance;
}
