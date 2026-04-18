import {
  USER_ROLE_DISPLAY_NAMES,
  type UserRole,
} from "../../core/interfaces/ports";

const ROLE_CREATION_HIERARCHY: Record<UserRole, UserRole[]> = {
  super_admin: [
    "super_admin",
    "org_admin",
    "officials_manager",
    "team_manager",
    "official",
    "player",
  ],
  org_admin: [
    "org_admin",
    "officials_manager",
    "team_manager",
    "official",
    "player",
  ],
  officials_manager: ["official"],
  team_manager: ["player"],
  official: [],
  player: [],
  public_viewer: [],
};

type ConditionalField =
  | "organization_id"
  | "team_id"
  | "player_id"
  | "official_id";

const FIELD_VISIBILITY_BY_ROLE: Record<UserRole, ConditionalField[]> = {
  super_admin: [],
  org_admin: ["organization_id"],
  officials_manager: ["organization_id"],
  team_manager: ["organization_id", "team_id"],
  official: ["organization_id", "official_id"],
  player: ["organization_id", "player_id"],
  public_viewer: [],
};

const ALWAYS_VISIBLE_FIELDS: Set<string> = new Set([
  "email",
  "first_name",
  "last_name",
  "role",
  "status",
]);

const REQUIRED_FIELDS_BY_ROLE: Record<UserRole, Set<string>> = {
  super_admin: new Set(),
  org_admin: new Set(["organization_id"]),
  officials_manager: new Set(["organization_id"]),
  team_manager: new Set(["organization_id", "team_id"]),
  official: new Set(["organization_id", "official_id"]),
  player: new Set(["organization_id", "player_id"]),
  public_viewer: new Set(),
};

export type UserRoleState =
  | { status: "missing" }
  | { status: "present"; role: UserRole };

type UserRoleInput = UserRoleState | UserRole;

const USER_ROLE_VALUES: Set<UserRole> = new Set(
  Object.keys(USER_ROLE_DISPLAY_NAMES) as UserRole[],
);

function resolve_user_role_state(role: UserRoleInput): UserRoleState {
  return typeof role === "string" ? { status: "present", role } : role;
}

export function build_user_role_state(role?: unknown): UserRoleState {
  if (typeof role !== "string") {
    return { status: "missing" };
  }

  if (!USER_ROLE_VALUES.has(role as UserRole)) {
    return { status: "missing" };
  }

  return { status: "present", role: role as UserRole };
}

export function get_allowed_roles_for_creator(
  creator_role: UserRole,
): UserRole[] {
  return ROLE_CREATION_HIERARCHY[creator_role] ?? [];
}

export function get_visible_fields_for_role(
  selected_role: UserRole,
): ConditionalField[] {
  return FIELD_VISIBILITY_BY_ROLE[selected_role] ?? [];
}

export function is_system_user_field_visible_for_role(
  field_name: string,
  selected_role: UserRoleInput,
): boolean {
  if (ALWAYS_VISIBLE_FIELDS.has(field_name)) return true;

  const selected_role_state = resolve_user_role_state(selected_role);

  if (selected_role_state.status !== "present") return false;

  const visible_conditional_fields =
    FIELD_VISIBILITY_BY_ROLE[selected_role_state.role];
  if (!visible_conditional_fields) return false;

  return visible_conditional_fields.includes(field_name as ConditionalField);
}

export function should_field_be_required_for_role(
  field_name: string,
  selected_role: UserRoleInput,
): boolean {
  const selected_role_state = resolve_user_role_state(selected_role);

  if (selected_role_state.status !== "present") return false;

  const required = REQUIRED_FIELDS_BY_ROLE[selected_role_state.role];
  if (!required) return false;

  return required.has(field_name);
}

export function filter_enum_values_by_creator_role(
  field_name: string,
  all_enum_values: string[],
  creator_role: UserRoleInput,
): string[] {
  if (field_name !== "role") return all_enum_values;

  const creator_role_state = resolve_user_role_state(creator_role);

  if (creator_role_state.status !== "present") return [];

  const allowed_roles = get_allowed_roles_for_creator(creator_role_state.role);
  return all_enum_values.filter((value) =>
    allowed_roles.includes(value as UserRole),
  );
}
