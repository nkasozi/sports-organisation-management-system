import type { Id } from "../_generated/dataModel";

export type DataAction = "create" | "read" | "update" | "delete";
export type UserRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player";
export type DataCategory =
  | "root_level"
  | "org_administrator_level"
  | "organisation_level"
  | "team_level"
  | "player_level";

interface UserProfileRecord {
  _id: Id<"user_profiles">;
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  is_active: boolean;
}

interface PermissionRecord {
  role: string;
  data_category: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface EntityCategoryRecord {
  entity_type: string;
  data_category: string;
}

interface ConvexContext {
  db: {
    query(table: string): {
      withIndex(
        name: string,
        predicate?: (q: any) => any,
      ): { first(): Promise<any>; collect(): Promise<any[]> };
    };
  };
  auth: {
    getUserIdentity(): Promise<{ subject: string } | null>;
  };
}

export class AuthenticationError extends Error {
  constructor(message: string = "Not authenticated") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string = "Not authorized",
    public readonly entity_type?: string,
    public readonly action?: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function require_auth(
  ctx: ConvexContext,
): Promise<UserProfileRecord> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new AuthenticationError("Not authenticated");
  }

  const user_profile = (await ctx.db
    .query("user_profiles")
    .withIndex("by_clerk_user_id", (q: any) =>
      q.eq("clerk_user_id", identity.subject),
    )
    .first()) as UserProfileRecord | null;

  if (!user_profile) {
    throw new AuthenticationError("User profile not found");
  }

  if (!user_profile.is_active) {
    throw new AuthenticationError("User account is deactivated");
  }

  return user_profile;
}

export async function get_entity_data_category(
  ctx: ConvexContext,
  entity_type: string,
): Promise<DataCategory> {
  const normalized = entity_type.toLowerCase().replace(/[\s_-]/g, "");
  const category_record = (await ctx.db
    .query("entity_data_categories")
    .withIndex("by_entity_type", (q: any) => q.eq("entity_type", normalized))
    .first()) as EntityCategoryRecord | null;

  return (
    (category_record?.data_category as DataCategory) || "organisation_level"
  );
}

export async function check_permission(
  ctx: ConvexContext,
  role: UserRole,
  data_category: DataCategory,
  action: DataAction,
): Promise<boolean> {
  const permission = (await ctx.db
    .query("role_permissions")
    .withIndex("by_role_category", (q: any) =>
      q.eq("role", role).eq("data_category", data_category),
    )
    .first()) as PermissionRecord | null;

  if (!permission) return false;

  switch (action) {
    case "create":
      return permission.can_create;
    case "read":
      return permission.can_read;
    case "update":
      return permission.can_update;
    case "delete":
      return permission.can_delete;
    default:
      return false;
  }
}

export async function require_permission(
  ctx: ConvexContext,
  entity_type: string,
  action: DataAction,
): Promise<UserProfileRecord> {
  const user = await require_auth(ctx);
  const data_category = await get_entity_data_category(ctx, entity_type);
  const is_authorized = await check_permission(
    ctx,
    user.role as UserRole,
    data_category,
    action,
  );

  if (!is_authorized) {
    throw new AuthorizationError(
      `Role "${user.role}" does not have "${action}" permission for "${entity_type}" (${data_category})`,
      entity_type,
      action,
    );
  }

  return user;
}

export function build_scope_filter(
  user: UserProfileRecord,
  entity_type: string,
): Record<string, string | undefined> {
  const role = user.role as UserRole;
  const normalized_entity = entity_type.toLowerCase().replace(/[\s_-]/g, "");

  if (role === "super_admin") {
    return {};
  }

  if (role === "org_admin" || role === "officials_manager") {
    return { organization_id: user.organization_id };
  }

  if (role === "team_manager") {
    return {
      organization_id: user.organization_id,
      team_id: user.team_id,
    };
  }

  if (role === "official") {
    if (
      normalized_entity === "official" ||
      normalized_entity === "officialprofile"
    ) {
      return { id: user.official_id };
    }
    return { organization_id: user.organization_id };
  }

  if (role === "player") {
    if (
      normalized_entity === "player" ||
      normalized_entity === "playerprofile"
    ) {
      return { id: user.player_id };
    }
    return { organization_id: user.organization_id };
  }

  return { organization_id: user.organization_id };
}

export async function try_auth(
  ctx: ConvexContext,
): Promise<UserProfileRecord | null> {
  try {
    return await require_auth(ctx);
  } catch {
    return null;
  }
}
