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
} from "../../core/interfaces/ports";
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
const ALL_ORGANIZATIONS_SCOPE = "*";

export function resolve_organization_id_for_role(
  organization_id: string,
  role: SystemUserRole,
): string {
  if (role === "super_admin") return ALL_ORGANIZATIONS_SCOPE;
  return organization_id || "";
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
    console.debug("[SystemUserRepo] create called with input:", {
      email: input.email,
      role: input.role,
      status: input.status,
      organization_id: input.organization_id,
    });

    const result = await super.create(input);

    if (!result.success) {
      console.error("[SystemUserRepo] create failed:", result.error);
      return result;
    }

    console.debug("[SystemUserRepo] create succeeded:", {
      id: result.data.id,
      email: result.data.email,
      role: result.data.role,
      status: result.data.status,
      organization_id: result.data.organization_id,
    });

    const verification = await this.find_by_id(result.data.id);
    if (verification.success && verification.data) {
      console.debug("[SystemUserRepo] verification read-back confirmed:", {
        id: verification.data.id,
        status: verification.data.status,
      });
    } else {
      console.error(
        "[SystemUserRepo] VERIFICATION FAILED - entity not found after create!",
        result.data.id,
      );
    }

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
      email: input.email.trim().toLowerCase(),
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      role: input.role,
      status: input.status || "active",
      organization_id,
      team_id: input.team_id,
      player_id: input.player_id,
      official_id: input.official_id,
      profile_picture_base64: input.profile_picture_base64,
    };
  }

  protected apply_updates_to_entity(
    entity: SystemUser,
    updates: UpdateSystemUserInput,
  ): SystemUser {
    const updated_role = updates.role ?? entity.role;
    const updated_organization_id = resolve_organization_id_for_role(
      updates.organization_id ?? entity.organization_id,
      updated_role,
    );

    return {
      ...entity,
      email: updates.email?.trim().toLowerCase() ?? entity.email,
      first_name: updates.first_name?.trim() ?? entity.first_name,
      last_name: updates.last_name?.trim() ?? entity.last_name,
      role: updated_role,
      status: updates.status ?? entity.status,
      organization_id: updated_organization_id,
      team_id: updates.team_id ?? entity.team_id,
      player_id: updates.player_id ?? entity.player_id,
      official_id: updates.official_id ?? entity.official_id,
      profile_picture_base64:
        updates.profile_picture_base64 ?? entity.profile_picture_base64,
    };
  }

  protected apply_entity_filter(
    entities: SystemUser[],
    filter: SystemUserFilter,
  ): SystemUser[] {
    let filtered = entities;

    if (filter.email_contains) {
      const search_term = filter.email_contains.toLowerCase();
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(search_term),
      );
    }

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.first_name.toLowerCase().includes(search_term) ||
          user.last_name.toLowerCase().includes(search_term),
      );
    }

    if (filter.role) {
      filtered = filtered.filter((user) => user.role === filter.role);
    }

    if (filter.status) {
      filtered = filtered.filter((user) => user.status === filter.status);
    }

    if (filter.organization_id) {
      filtered = filtered.filter(
        (user) => user.organization_id === filter.organization_id,
      );
    }

    return filtered;
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
    return this.find_all({ role }, options);
  }

  async find_active_users(
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser> {
    const all_users_result = await this.find_all(undefined, options);
    if (all_users_result.success) {
      const all_users = all_users_result.data.items;
      const active_users = all_users.filter((u) => u.status === "active");
      console.debug(
        `[SystemUserRepo] find_active_users: ${all_users.length} total, ${active_users.length} active`,
        all_users.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          status: u.status,
        })),
      );
    }
    return this.find_all({ status: "active" }, options);
  }

  async find_admins(options?: QueryOptions): PaginatedAsyncResult<SystemUser> {
    try {
      let filtered_entities = await this.database.system_users.toArray();

      filtered_entities = filtered_entities.filter(
        (user) => user.role === "org_admin" || user.role === "super_admin",
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
      organization_id: "*",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr_default_2",
      email: "manager@ugandahockey.org",
      first_name: "Organisation",
      last_name: "Admin",
      role: "org_admin",
      organization_id: "org_default_1",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "usr_default_3",
      email: "official@ugandahockey.org",
      first_name: "Officials",
      last_name: "Manager",
      role: "officials_manager",
      organization_id: "org_default_1",
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
