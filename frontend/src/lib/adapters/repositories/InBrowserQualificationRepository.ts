import type { Table } from "dexie";
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
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "qual";

export class InBrowserQualificationRepository
  extends InBrowserBaseRepository<
    Qualification,
    CreateQualificationInput,
    UpdateQualificationInput
  >
  implements QualificationRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Qualification, string> {
    return this.database.qualifications;
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
    try {
      let filtered_entities = await this.database.qualifications.toArray();

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
        `Failed to filter qualifications: ${error_message}`,
      );
    }
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

export function create_default_qualifications(): Qualification[] {
  const now = new Date().toISOString();
  const one_year_from_now = new Date();
  one_year_from_now.setFullYear(one_year_from_now.getFullYear() + 1);
  const expiry_date = one_year_from_now.toISOString().split("T")[0];

  return [
    {
      id: "qual_default_1",
      holder_type: "official",
      holder_id: "off_default_1",
      certification_name: "National Umpire Certification",
      certification_level: "national",
      certification_number: "UGA-UMP-2024-001",
      issuing_authority: "Uganda Hockey Association",
      issue_date: "2024-01-15",
      expiry_date: expiry_date,
      specializations: ["Field Umpire", "Video Umpire"],
      notes: "Certified for national level competitions",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "qual_default_2",
      holder_type: "team_staff",
      holder_id: "ts_default_1",
      certification_name: "Level 2 Coaching Certificate",
      certification_level: "regional",
      certification_number: "UGA-COACH-2024-001",
      issuing_authority: "Uganda Hockey Association",
      issue_date: "2024-03-01",
      expiry_date: expiry_date,
      specializations: ["Youth Development", "Goalkeeper Training"],
      notes: "Qualified to coach regional level teams",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserQualificationRepository | null = null;

export function get_qualification_repository(): QualificationRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserQualificationRepository();
  }
  return singleton_instance;
}

export async function initialize_qualification_repository(): Promise<void> {
  const repository =
    get_qualification_repository() as InBrowserQualificationRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_qualifications());
  }
}

export async function reset_qualification_repository(): Promise<void> {
  const repository =
    get_qualification_repository() as InBrowserQualificationRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_qualifications());
}
