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
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { find_rows_by_index } from "./InBrowserRepositoryIndexLookup";
import {
  create_warning_failure_details,
  execute_repository_operation,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import {
  apply_system_user_filter,
  apply_system_user_updates,
  create_system_user_from_input,
} from "./InBrowserSystemUserRepositoryUtils";

const ENTITY_PREFIX = "usr";

enum SYSTEM_USER_INDEX {
  EMAIL = "email",
}

function is_admin_user(user: SystemUser): boolean {
  return check_data_permission(
    user.role as UserRole,
    "org_administrator_level",
    "read",
  );
}
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
    id: SystemUser["id"],
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

  async find_by_email(
    email: ScalarValueInput<SystemUser["email"]>,
  ): PaginatedAsyncResult<SystemUser> {
    const users_result = await find_rows_by_index({
      table: this.database.system_users,
      index_name: SYSTEM_USER_INDEX.EMAIL,
      value: email.trim().toLowerCase(),
      failure: create_warning_failure_details(
        "[SystemUserRepository] Failed to find system user by email",
        "repository_find_system_user_by_email_failed",
        "find system user by email",
      ),
    });
    if (!users_result.success) return users_result;
    return create_success_result(
      this.create_paginated_result(users_result.data, users_result.data.length),
    );
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

  find_admins(options?: QueryOptions): PaginatedAsyncResult<SystemUser> {
    return execute_repository_operation(
      create_warning_failure_details(
        "[SystemUserRepository] Failed to find admin users",
        "repository_find_admin_users_failed",
        "find admin users",
      ),
      async () => {
        const admins = (await this.database.system_users.toArray()).filter(
          is_admin_user,
        );
        const sorted = this.apply_sort(admins, options);
        const paginated = this.apply_pagination(sorted, options);
        return this.create_paginated_result(paginated, admins.length, options);
      },
    );
  }
}

const get_concrete_repository: () => InBrowserSystemUserRepository =
  create_lazy_repository_accessor(() => new InBrowserSystemUserRepository());

export function get_system_user_repository(): InBrowserSystemUserRepository {
  return get_concrete_repository();
}
