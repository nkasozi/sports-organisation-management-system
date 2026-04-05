import type { Table } from "dexie";
import type {
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
  SystemUserRole,
} from "../../core/entities/SystemUser";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  QueryOptions,
  SystemUserRepository,
  SystemUserFilter,
  UserRole,
} from "../../core/interfaces/ports";
import { check_data_permission, ANY_VALUE } from "../../core/interfaces/ports";
import type {
  PaginatedAsyncResult,
  AsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "usr";
const ALL_ORGANIZATIONS_SCOPE = ANY_VALUE;

export function resolve_organization_id_for_role(
  organization_id: string,
  role: SystemUserRole,
): string {
  const has_platform_wide_scope = check_data_permission(
    role as UserRole,
    "root_level",
    "delete",
  );
  return has_platform_wide_scope
    ? ALL_ORGANIZATIONS_SCOPE
    : organization_id || "";
}

export class InBrowserSystemUserRepository
  extends InBrowserBaseRepository<
    SystemUser,
    CreateSystemUserInput,
    UpdateSystemUserInput,
    SystemUserFilter
  >
  implements SystemUserRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<SystemUser, string> {
    return this.database.system_users;
  }

  async create(input: CreateSystemUserInput): AsyncResult<SystemUser> {
    console.debug("[SystemUserRepo] create called", {
      event: "system_user_create_start",
      email: input.email,
      role: input.role,
      status: input.status,
    });
    const result = await super.create(input);
    if (!result.success) {
      console.error("[SystemUserRepo] create failed", {
        event: "system_user_create_failed",
        error: result.error,
      });
      return result;
    }
    console.debug("[SystemUserRepo] create succeeded", {
      event: "system_user_created",
      id: result.data.id,
      role: result.data.role,
      status: result.data.status,
    });
    return result;
  }

  protected create_entity_from_input(
    input: CreateSystemUserInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): SystemUser {
    const organization_id = resolve_organization_id_for_role(
      input.organization_id,
      input.role,
    );
    return {
      id,
      ...timestamps,
      ...input,
      email: input.email.trim().toLowerCase(),
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      status: input.status || "active",
      organization_id,
    };
  }

  protected apply_updates_to_entity(
    entity: SystemUser,
    updates: UpdateSystemUserInput,
  ): SystemUser {
    const updated_role = updates.role ?? entity.role;
    const updated_org_id = resolve_organization_id_for_role(
      updates.organization_id ?? entity.organization_id,
      updated_role,
    );
    return {
      ...entity,
      ...updates,
      email: updates.email?.trim().toLowerCase() ?? entity.email,
      first_name: updates.first_name?.trim() ?? entity.first_name,
      last_name: updates.last_name?.trim() ?? entity.last_name,
      role: updated_role,
      organization_id: updated_org_id,
    };
  }

  protected apply_entity_filter(
    entities: SystemUser[],
    filter: SystemUserFilter,
  ): SystemUser[] {
    let filtered = entities;
    if (filter.email_contains) {
      const s = filter.email_contains.toLowerCase();
      filtered = filtered.filter((u) => u.email.toLowerCase().includes(s));
    }
    if (filter.name_contains) {
      const s = filter.name_contains.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.first_name.toLowerCase().includes(s) ||
          u.last_name.toLowerCase().includes(s),
      );
    }
    if (filter.role) {
      filtered = filtered.filter((u) => u.role === filter.role);
    }
    if (filter.status) {
      filtered = filtered.filter((u) => u.status === filter.status);
    }
    if (filter.organization_id) {
      filtered = filtered.filter(
        (u) => u.organization_id === filter.organization_id,
      );
    }
    return filtered;
  }

  async find_by_email(email: string): PaginatedAsyncResult<SystemUser> {
    try {
      const users = await this.database.system_users
        .where("email")
        .equals(email.trim().toLowerCase())
        .toArray();
      return create_success_result(
        this.create_paginated_result(users, users.length),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find system user by email: ${error_message}`,
      );
    }
  }

  async find_by_role(
    role: SystemUserRole,
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser> {
    return this.find_all({ role }, options);
  }

  async find_active_users(
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser> {
    return this.find_all({ status: "active" }, options);
  }

  async find_admins(options?: QueryOptions): PaginatedAsyncResult<SystemUser> {
    try {
      let filtered = await this.database.system_users.toArray();
      filtered = filtered.filter((u) =>
        check_data_permission(
          u.role as UserRole,
          "org_administrator_level",
          "read",
        ),
      );
      const sorted = this.apply_sort(filtered, options);
      const paginated = this.apply_pagination(sorted, options);
      return create_success_result(
        this.create_paginated_result(paginated, filtered.length, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find admin users: ${error_message}`,
      );
    }
  }
}

let singleton_instance: InBrowserSystemUserRepository | null = null;

export function get_system_user_repository(): InBrowserSystemUserRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserSystemUserRepository();
  }
  return singleton_instance;
}

export async function reset_system_user_repository(): Promise<void> {
  const repository = get_system_user_repository();
  await repository.clear_all_data();
}
