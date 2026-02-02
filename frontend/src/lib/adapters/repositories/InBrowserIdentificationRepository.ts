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
} from "../../core/interfaces/adapters/IdentificationRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "ident";

export class InBrowserIdentificationRepository
  extends InBrowserBaseRepository<
    Identification,
    CreateIdentificationInput,
    UpdateIdentificationInput
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

  async find_by_filter(
    filter: IdentificationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification> {
    try {
      let filtered_entities = await this.database.identifications.toArray();

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
        `Failed to filter identifications: ${error_message}`,
      );
    }
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
}

export function create_default_identifications(): Identification[] {
  const now = new Date().toISOString();

  return [
    {
      id: "ident_default_1",
      holder_type: "player",
      holder_id: "player_default_1",
      identification_type_id: "ident_type_default_1",
      identifier_value: "NIN-1234567890",
      document_image_url: "",
      issue_date: "2020-01-15",
      expiry_date: "2030-01-15",
      notes: "National ID Card",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "ident_default_2",
      holder_type: "player",
      holder_id: "player_default_2",
      identification_type_id: "ident_type_default_2",
      identifier_value: "PASS-AB123456",
      document_image_url: "",
      issue_date: "2022-06-01",
      expiry_date: "2032-06-01",
      notes: "Passport",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "ident_default_3",
      holder_type: "team_staff",
      holder_id: "staff_default_1",
      identification_type_id: "ident_type_default_1",
      identifier_value: "NIN-9876543210",
      document_image_url: "",
      issue_date: "2019-03-20",
      expiry_date: "2029-03-20",
      notes: "National ID Card",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "ident_default_4",
      holder_type: "official",
      holder_id: "official_default_1",
      identification_type_id: "ident_type_default_1",
      identifier_value: "NIN-5555555555",
      document_image_url: "",
      issue_date: "2021-08-10",
      expiry_date: "2031-08-10",
      notes: "National ID Card",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserIdentificationRepository | null = null;

export function get_identification_repository(): IdentificationRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserIdentificationRepository();
  }
  return singleton_instance;
}

export async function initialize_identification_repository(): Promise<void> {
  const repository =
    get_identification_repository() as InBrowserIdentificationRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_identifications());
  }
}

export async function reset_identification_repository(): Promise<void> {
  const repository =
    get_identification_repository() as InBrowserIdentificationRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_identifications());
}
