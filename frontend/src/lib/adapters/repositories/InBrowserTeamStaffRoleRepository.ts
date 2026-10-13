import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateTeamStaffRoleInput,
  TeamStaffRole,
  UpdateTeamStaffRoleInput,
} from "../../core/entities/TeamStaffRole";
import type {
  QueryOptions,
  TeamStaffRoleFilter,
  TeamStaffRoleRepository,
} from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { find_rows_by_index } from "./InBrowserRepositoryIndexLookup";
import { find_all_entities_in_custom_order } from "./InBrowserRepositoryPagedQueries";
import {
  create_error_failure_details,
  create_warning_failure_details,
  with_failure_context,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";
export { create_default_team_staff_roles_for_organization } from "./InBrowserTeamStaffRoleRepositoryDefaults";

const ENTITY_PREFIX = "team_staff_role";

enum TEAM_STAFF_ROLE_INDEX {
  CATEGORY = "category",
}

function sort_roles_by_display_order(roles: TeamStaffRole[]): TeamStaffRole[] {
  return [...roles].sort((a, b) => a.display_order - b.display_order);
}

export class InBrowserTeamStaffRoleRepository
  extends InBrowserBaseRepository<
    TeamStaffRole,
    CreateTeamStaffRoleInput,
    UpdateTeamStaffRoleInput,
    TeamStaffRoleFilter
  >
  implements TeamStaffRoleRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<TeamStaffRole, string> {
    return this.database.team_staff_roles;
  }

  protected create_entity_from_input(
    input: CreateTeamStaffRoleInput,
    id: TeamStaffRole["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamStaffRole {
    return {
      id: id as TeamStaffRole["id"],
      ...timestamps,
      ...input,
      name: input.name as TeamStaffRole["name"],
      organization_id:
        input.organization_id as TeamStaffRole["organization_id"],
    };
  }

  protected apply_updates_to_entity(
    entity: TeamStaffRole,
    updates: UpdateTeamStaffRoleInput,
  ): TeamStaffRole {
    return {
      ...entity,
      ...updates,
      name: updates.name
        ? (updates.name as TeamStaffRole["name"])
        : entity.name,
      organization_id: updates.organization_id
        ? (updates.organization_id as TeamStaffRole["organization_id"])
        : entity.organization_id,
    };
  }

  protected apply_entity_filter(
    entities: TeamStaffRole[],
    filter: TeamStaffRoleFilter,
  ): TeamStaffRole[] {
    let filtered = entities;
    if (filter.name_contains) {
      const term = filter.name_contains.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(term));
    }
    if (filter.category) {
      filtered = filtered.filter((r) => r.category === filter.category);
    }
    if (filter.status) {
      filtered = filtered.filter((r) => r.status === filter.status);
    }
    if (filter.organization_id) {
      filtered = filtered.filter(
        (r) => r.organization_id === filter.organization_id,
      );
    }
    return filtered;
  }

  find_all_with_filter(
    filter?: TeamStaffRoleFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaffRole> {
    return find_all_entities_in_custom_order({
      table: this.database.team_staff_roles,
      filter: filter ?? {},
      apply_filter: this.apply_entity_filter.bind(this),
      order: sort_roles_by_display_order,
      options: options ?? {},
      failure: create_warning_failure_details(
        "[TeamStaffRoleRepository] Failed to filter team staff roles",
        "repository_filter_team_staff_roles_failed",
        "filter team staff roles",
      ),
    });
  }

  async find_by_category(
    category: TeamStaffRole["category"],
  ): AsyncResult<TeamStaffRole[]> {
    const roles_result = await find_rows_by_index({
      table: this.database.team_staff_roles,
      index_name: TEAM_STAFF_ROLE_INDEX.CATEGORY,
      value: category,
      failure: with_failure_context(
        create_error_failure_details(
          "[TeamStaffRoleRepository] Failed to find roles by category",
          "repository_find_by_category_failed",
          "find roles by category",
        ),
        { category },
      ),
    });
    if (!roles_result.success) return roles_result;
    return create_success_result(
      sort_roles_by_display_order(roles_result.data),
    );
  }

  async find_by_organization(
    organization_id: TeamStaffRole["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaffRole> {
    return this.find_all({ organization_id }, options);
  }
}

const get_concrete_repository: () => InBrowserTeamStaffRoleRepository =
  create_lazy_repository_accessor(() => new InBrowserTeamStaffRoleRepository());

export function get_team_staff_role_repository(): TeamStaffRoleRepository {
  return get_concrete_repository();
}

export function reset_team_staff_role_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<boolean> {
  return get_concrete_repository().with_write_origin(origin).clear_all_data();
}
