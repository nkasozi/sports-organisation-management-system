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
import type { PaginatedAsyncResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
export { create_default_team_staff_roles_for_organization } from "./InBrowserTeamStaffRoleRepositoryDefaults";

const ENTITY_PREFIX = "team_staff_role";

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
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamStaffRole {
    return { id, ...timestamps, ...input };
  }

  protected apply_updates_to_entity(
    entity: TeamStaffRole,
    updates: UpdateTeamStaffRoleInput,
  ): TeamStaffRole {
    return { ...entity, ...updates };
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

  async find_all_with_filter(
    filter?: TeamStaffRoleFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaffRole> {
    try {
      let filtered_entities = await this.database.team_staff_roles.toArray();
      if (filter) {
        filtered_entities = this.apply_entity_filter(filtered_entities, filter);
      }
      filtered_entities.sort((a, b) => a.display_order - b.display_order);
      const total_count = filtered_entities.length;
      const paginated = this.apply_pagination(filtered_entities, options);
      return create_success_result(
        this.create_paginated_result(paginated, total_count, options),
      );
    } catch (error) {
      console.warn(
        "[TeamStaffRoleRepository] Failed to filter team staff roles",
        {
          event: "repository_filter_team_staff_roles_failed",
          error: String(error),
        },
      );
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter team staff roles: ${error_message}`,
      );
    }
  }

  async find_by_category(
    category: TeamStaffRole["category"],
  ): Promise<Result<TeamStaffRole[]>> {
    try {
      const roles = await this.database.team_staff_roles
        .where("category")
        .equals(category)
        .toArray();
      return create_success_result(
        roles.sort((a, b) => a.display_order - b.display_order),
      );
    } catch (error) {
      console.error("[TeamStaffRoleRepository] find_by_category failed", {
        event: "repository_find_by_category_failed",
        error: String(error),
      });
      return create_failure_result(
        `Failed to find roles by category: ${error}`,
      );
    }
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamStaffRole> {
    return this.find_all({ organization_id }, options);
  }
}

let singleton_instance: InBrowserTeamStaffRoleRepository | null = null;

export function get_team_staff_role_repository(): TeamStaffRoleRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserTeamStaffRoleRepository();
  }
  return singleton_instance;
}

export async function reset_team_staff_role_repository(): Promise<void> {
  const repository =
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository;
  await repository.clear_all_data();
}
