import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateSystemUserInput,
  SystemUser,
  SystemUserRole,
  UpdateSystemUserInput,
} from "../../core/entities/SystemUser";
import type {
  QueryOptions,
  SystemUserFilter,
  SystemUserRepository,
  UserRole,
} from "../../core/interfaces/ports";
import { check_data_permission } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_system_user_filter,
  apply_system_user_updates,
  create_system_user_from_input,
} from "./InBrowserSystemUserRepositoryUtils";

const ENTITY_PREFIX = "usr";
export { resolve_organization_id_for_role } from "./InBrowserSystemUserRepositoryUtils";

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
    return create_system_user_from_input(input, id, timestamps);
  }

  protected apply_updates_to_entity(
    entity: SystemUser,
    updates: UpdateSystemUserInput,
  ): SystemUser {
    return apply_system_user_updates(entity, updates);
  }

  protected apply_entity_filter(
    entities: SystemUser[],
    filter: SystemUserFilter,
  ): SystemUser[] {
    return apply_system_user_filter(entities, filter);
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
      console.warn(
        "[SystemUserRepository] Failed to find system user by email",
        {
          event: "repository_find_system_user_by_email_failed",
          error: String(error),
        },
      );
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
      console.warn("[SystemUserRepository] Failed to find admin users", {
        event: "repository_find_admin_users_failed",
        error: String(error),
      });
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
