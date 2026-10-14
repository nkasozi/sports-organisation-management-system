import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateQualificationInput,
  Qualification,
  QualificationHolderType,
  UpdateQualificationInput,
} from "../../core/entities/Qualification";
import { is_qualification_expired } from "../../core/entities/Qualification";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type {
  QualificationFilter,
  QualificationRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "qual";

function matches_expiry_filter(
  qualification: Qualification,
  is_expired: boolean,
  today: Date,
): boolean {
  if (!qualification.expiry_date) return !is_expired;
  return (
    is_qualification_expired(qualification.expiry_date, today) === is_expired
  );
}

class InBrowserQualificationRepository
  extends InBrowserBaseRepository<
    Qualification,
    CreateQualificationInput,
    UpdateQualificationInput,
    QualificationFilter
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
    id: Qualification["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Qualification {
    return {
      id: id as Qualification["id"],
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
    } as Qualification;
  }

  protected apply_updates_to_entity(
    entity: Qualification,
    updates: UpdateQualificationInput,
  ): Qualification {
    return {
      ...entity,
      ...updates,
    } as Qualification;
  }

  protected apply_entity_filter(
    entities: Qualification[],
    filter: QualificationFilter,
  ): Qualification[] {
    let filtered = entities;

    if (filter.holder_type) {
      filtered = filtered.filter(
        (qual) => qual.holder_type === filter.holder_type,
      );
    }

    if (filter.holder_id) {
      filtered = filtered.filter((qual) => qual.holder_id === filter.holder_id);
    }

    if (filter.certification_level) {
      filtered = filtered.filter(
        (qual) => qual.certification_level === filter.certification_level,
      );
    }

    if (filter.status) {
      filtered = filtered.filter((qual) => qual.status === filter.status);
    }

    if ("is_expired" in filter) {
      const today = new Date();
      filtered = filtered.filter((qual) =>
        matches_expiry_filter(qual, Boolean(filter.is_expired), today),
      );
    }

    return filtered;
  }

  async find_by_holder(
    holder_type: QualificationHolderType,
    holder_id: Qualification["holder_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification> {
    return this.find_all({ holder_type, holder_id }, options);
  }

  async find_active_qualifications(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification> {
    return this.find_all(
      { status: ENTITY_STATUS.ACTIVE, is_expired: false },
      options,
    );
  }
}

function create_default_qualifications(): import("$lib/core/types/DomainScalars").ScalarInput<Qualification>[] {
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
    } as Qualification,
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
    } as Qualification,
  ];
}

const get_concrete_repository: () => InBrowserQualificationRepository =
  create_lazy_repository_accessor(() => new InBrowserQualificationRepository());

export function get_qualification_repository(): QualificationRepository {
  return get_concrete_repository();
}

export function reset_qualification_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    get_concrete_repository().with_write_origin(origin),
    create_default_qualifications(),
  );
}
