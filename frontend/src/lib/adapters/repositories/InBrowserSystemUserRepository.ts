import type { Table } from "dexie";
import type {
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
  SystemUserRole,
} from "../../core/entities/SystemUser";
import type { BaseEntity, EntityStatus } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "usr";

export interface SystemUserFilter {
  email_contains?: string;
  name_contains?: string;
  role?: SystemUserRole;
  status?: EntityStatus;
}

export class InBrowserSystemUserRepository extends InBrowserBaseRepository<
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput
> {
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<SystemUser, string> {
    return this.database.system_users;
  }

  protected create_entity_from_input(
    input: CreateSystemUserInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): SystemUser {
    return {
      id,
      ...timestamps,
      email: input.email.trim().toLowerCase(),
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      role: input.role,
      status: input.status || "active",
      profile_picture_base64: input.profile_picture_base64,
    };
  }

  protected apply_updates_to_entity(
    entity: SystemUser,
    updates: UpdateSystemUserInput,
  ): SystemUser {
    return {
      ...entity,
      email: updates.email?.trim().toLowerCase() ?? entity.email,
      first_name: updates.first_name?.trim() ?? entity.first_name,
      last_name: updates.last_name?.trim() ?? entity.last_name,
      role: updates.role ?? entity.role,
      status: updates.status ?? entity.status,
      profile_picture_base64:
        updates.profile_picture_base64 ?? entity.profile_picture_base64,
    };
  }

  async find_by_filter(
    filter: SystemUserFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser> {
    try {
      let filtered_entities = await this.database.system_users.toArray();

      if (filter.email_contains) {
        const search_term = filter.email_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((user) =>
          user.email.toLowerCase().includes(search_term),
        );
      }

      if (filter.name_contains) {
        const search_term = filter.name_contains.toLowerCase();
        filtered_entities = filtered_entities.filter(
          (user) =>
            user.first_name.toLowerCase().includes(search_term) ||
            user.last_name.toLowerCase().includes(search_term),
        );
      }

      if (filter.role) {
        filtered_entities = filtered_entities.filter(
          (user) => user.role === filter.role,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (user) => user.status === filter.status,
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
        `Failed to filter system users: ${error_message}`,
      );
    }
  }

  async find_by_email(email: string): PaginatedAsyncResult<SystemUser> {
    try {
      const normalized_email = email.trim().toLowerCase();
      const users = await this.database.system_users
        .where("email")
        .equals(normalized_email)
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
    return this.find_by_filter({ role }, options);
  }

  async find_active_users(
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser> {
    return this.find_by_filter({ status: "active" }, options);
  }

  async find_admins(options?: QueryOptions): PaginatedAsyncResult<SystemUser> {
    try {
      let filtered_entities = await this.database.system_users.toArray();

      filtered_entities = filtered_entities.filter(
        (user) => user.role === "admin" || user.role === "super_admin",
      );

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
        `Failed to find admin users: ${error_message}`,
      );
    }
  }
}

export function create_default_system_users(): SystemUser[] {
  const now = new Date().toISOString();

  return [
    {
      id: "usr_default_1",
      email: "admin@ugandahockey.org",
      first_name: "System",
      last_name: "Administrator",
      role: "super_admin",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr_default_2",
      email: "manager@ugandahockey.org",
      first_name: "Competition",
      last_name: "Manager",
      role: "manager",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr_default_3",
      email: "user@ugandahockey.org",
      first_name: "Regular",
      last_name: "User",
      role: "user",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserSystemUserRepository | null = null;

export function get_system_user_repository(): InBrowserSystemUserRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserSystemUserRepository();
  }
  return singleton_instance;
}

export async function initialize_system_user_repository(): Promise<void> {
  const repository = get_system_user_repository();
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_system_users());
  }
}

export async function reset_system_user_repository(): Promise<void> {
  const repository = get_system_user_repository();
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_system_users());
}
