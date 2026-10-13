import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateTeamStaffInput,
  TeamStaff,
  UpdateTeamStaffInput,
} from "../../core/entities/TeamStaff";
import { DEFAULT_STAFF_AVATAR } from "../../core/entities/TeamStaff";
import type {
  QueryOptions,
  TeamStaffFilter,
  TeamStaffRepository,
} from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { find_rows_by_index } from "./InBrowserRepositoryIndexLookup";
import {
  create_error_failure_details,
  with_failure_context,
} from "./InBrowserRepositoryQueryRunner";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";
import { create_default_team_staff } from "./InBrowserTeamStaffRepositoryDefaults";

const ENTITY_PREFIX = "team_staff";

enum TEAM_STAFF_INDEX {
  TEAM_ID = "team_id",
  ROLE_ID = "role_id",
}

export class InBrowserTeamStaffRepository
  extends InBrowserBaseRepository<
    TeamStaff,
    CreateTeamStaffInput,
    UpdateTeamStaffInput,
    TeamStaffFilter
  >
  implements TeamStaffRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<TeamStaff, string> {
    return this.database.team_staff;
  }

  protected create_entity_from_input(
    input: CreateTeamStaffInput,
    id: TeamStaff["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamStaff {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.date_of_birth,
      team_id: input.team_id,
      role_id: input.role_id,
      nationality: input.nationality || "",
      profile_image_url: input.profile_image_url || DEFAULT_STAFF_AVATAR,
      employment_start_date: input.employment_start_date,
      employment_end_date: input.employment_end_date,
      emergency_contact_name: input.emergency_contact_name || "",
      emergency_contact_phone: input.emergency_contact_phone || "",
      notes: input.notes || "",
      status: input.status,
    } as TeamStaff;
  }

  protected apply_updates_to_entity(
    entity: TeamStaff,
    updates: UpdateTeamStaffInput,
  ): TeamStaff {
    return {
      ...entity,
      ...updates,
      profile_image_url: updates.profile_image_url ?? entity.profile_image_url,
    } as TeamStaff;
  }

  protected apply_entity_filter(
    entities: TeamStaff[],
    filter: TeamStaffFilter,
  ): TeamStaff[] {
    let filtered = entities;
    if (filter.organization_id) {
      filtered = filtered.filter(
        (s) => s.organization_id === filter.organization_id,
      );
    }
    if (filter.name_contains) {
      const term = filter.name_contains.toLowerCase();
      filtered = filtered.filter((s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(term),
      );
    }
    if (filter.team_id) {
      filtered = filtered.filter((s) => s.team_id === filter.team_id);
    }
    if (filter.role_id) {
      filtered = filtered.filter((s) => s.role_id === filter.role_id);
    }
    if (filter.status) {
      filtered = filtered.filter((s) => s.status === filter.status);
    }
    return filtered;
  }

  find_all_with_filter(
    filter?: TeamStaffFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaff> {
    return this.find_all(filter ?? {}, options);
  }

  find_by_team(team_id: TeamStaff["team_id"]): AsyncResult<TeamStaff[]> {
    return find_rows_by_index({
      table: this.database.team_staff,
      index_name: TEAM_STAFF_INDEX.TEAM_ID,
      value: team_id,
      failure: with_failure_context(
        create_error_failure_details(
          "[TeamStaffRepository] Failed to find staff by team",
          "repository_find_by_team_failed",
          "find staff by team",
        ),
        { team_id },
      ),
    });
  }

  find_by_role(role_id: TeamStaff["role_id"]): AsyncResult<TeamStaff[]> {
    return find_rows_by_index({
      table: this.database.team_staff,
      index_name: TEAM_STAFF_INDEX.ROLE_ID,
      value: role_id,
      failure: with_failure_context(
        create_error_failure_details(
          "[TeamStaffRepository] Failed to find staff by role",
          "repository_find_by_role_failed",
          "find staff by role",
        ),
        { role_id },
      ),
    });
  }
}

const get_concrete_repository: () => InBrowserTeamStaffRepository =
  create_lazy_repository_accessor(() => new InBrowserTeamStaffRepository());

export function get_team_staff_repository(): TeamStaffRepository {
  return get_concrete_repository();
}

export function reset_team_staff_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    get_concrete_repository().with_write_origin(origin),
    create_default_team_staff(),
  );
}
