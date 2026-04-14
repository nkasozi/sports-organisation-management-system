import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateSystemUserInput,
  SystemUser,
  SystemUserRole,
  UpdateSystemUserInput,
} from "../../core/entities/SystemUser";
import type { SystemUserFilter, UserRole } from "../../core/interfaces/ports";
import { ANY_VALUE, check_data_permission } from "../../core/interfaces/ports";

const ALL_ORGANIZATIONS_SCOPE = ANY_VALUE;
const ACTIVE_SYSTEM_USER_STATUS = "active";

export function resolve_organization_id_for_role(
  organization_id:
    | CreateSystemUserInput["organization_id"]
    | SystemUser["organization_id"],
  role: SystemUserRole,
): SystemUser["organization_id"] {
  const has_platform_wide_scope = check_data_permission(
    role as UserRole,
    "root_level",
    "delete",
  );
  return has_platform_wide_scope
    ? (ALL_ORGANIZATIONS_SCOPE as SystemUser["organization_id"])
    : ((organization_id || "") as SystemUser["organization_id"]);
}

export function create_system_user_from_input(
  input: CreateSystemUserInput,
  id: SystemUser["id"],
  timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
): SystemUser {
  return {
    id,
    ...timestamps,
    ...input,
    email: input.email.trim().toLowerCase(),
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    status: input.status || ACTIVE_SYSTEM_USER_STATUS,
    organization_id: resolve_organization_id_for_role(
      input.organization_id,
      input.role,
    ),
  } as SystemUser;
}

export function apply_system_user_updates(
  entity: SystemUser,
  updates: UpdateSystemUserInput,
): SystemUser {
  const updated_role = updates.role ?? entity.role;
  return {
    ...entity,
    ...updates,
    email: updates.email?.trim().toLowerCase() ?? entity.email,
    first_name: updates.first_name?.trim() ?? entity.first_name,
    last_name: updates.last_name?.trim() ?? entity.last_name,
    role: updated_role,
    organization_id: resolve_organization_id_for_role(
      updates.organization_id ?? entity.organization_id,
      updated_role,
    ),
  } as SystemUser;
}

export function apply_system_user_filter(
  entities: SystemUser[],
  filter: SystemUserFilter,
): SystemUser[] {
  let filtered_entities = entities;
  if (filter.email_contains) {
    const normalized_email_value = filter.email_contains.toLowerCase();
    filtered_entities = filtered_entities.filter((user) =>
      user.email.toLowerCase().includes(normalized_email_value),
    );
  }
  if (filter.name_contains) {
    const normalized_name_value = filter.name_contains.toLowerCase();
    filtered_entities = filtered_entities.filter(
      (user) =>
        user.first_name.toLowerCase().includes(normalized_name_value) ||
        user.last_name.toLowerCase().includes(normalized_name_value),
    );
  }
  if (filter.role)
    filtered_entities = filtered_entities.filter(
      (user) => user.role === filter.role,
    );
  if (filter.status)
    filtered_entities = filtered_entities.filter(
      (user) => user.status === filter.status,
    );
  if (filter.organization_id) {
    filtered_entities = filtered_entities.filter(
      (user) => user.organization_id === filter.organization_id,
    );
  }
  return filtered_entities;
}
