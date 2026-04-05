import type {
  AuthenticationPort,
  UserRole,
  SystemUserRepository,
  ProfilePermissions,
  AuthorizationFailure,
  DataCategory,
  CategoryPermissions,
} from "$lib/core/interfaces/ports";
import { get_role_permissions } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";

export async function get_role_for_email(
  system_user_repository: SystemUserRepository,
  email: string,
): Promise<Result<UserRole>> {
  const user_result = await system_user_repository.find_by_email(email);

  if (!user_result.success || user_result.data.items.length === 0) {
    console.warn(
      `[LocalAuthorizationAdapter] User not found for email: ${email}`,
    );
    return create_failure_result(`User not found for email: ${email}`);
  }

  const system_user = user_result.data.items[0];

  if (system_user.status === "inactive") {
    console.warn(
      `[LocalAuthorizationAdapter] User account is inactive: ${email}`,
    );
    return create_failure_result(`User account is inactive: ${email}`);
  }

  return create_success_result(system_user.role as UserRole);
}

export async function get_profile_permissions_impl(
  auth_port: AuthenticationPort,
  system_user_repository: SystemUserRepository,
  authorization_cache: AuthCache<unknown>,
  raw_token: string,
): Promise<Result<ProfilePermissions, AuthorizationFailure>> {
  const cache_key = `profile_permissions:${raw_token}`;
  const cached = authorization_cache.get_or_miss(cache_key);
  if (cached.is_hit && cached.value) {
    console.log(
      "[LocalAuthorizationAdapter] Cache HIT for profile permissions",
    );
    return cached.value as Result<ProfilePermissions, AuthorizationFailure>;
  }

  const verification_result = await auth_port.verify_token(raw_token);

  if (!verification_result.success) {
    return create_failure_result({
      failure_type: "token_invalid",
      message: verification_result.error,
    });
  }

  const verification = verification_result.data;

  if (!verification.is_valid || !verification.payload) {
    const is_expired = verification.error_message?.includes("expired");
    return create_failure_result({
      failure_type: is_expired ? "token_expired" : "token_invalid",
      message: verification.error_message || "Token verification failed",
    });
  }

  const role_result = await get_role_for_email(
    system_user_repository,
    verification.payload.email,
  );
  if (!role_result.success) {
    return create_failure_result({
      failure_type: "token_invalid",
      message: role_result.error,
    });
  }

  const role = role_result.data;
  const role_permissions = get_role_permissions(role);

  const categories: DataCategory[] = [
    "root_level",
    "org_administrator_level",
    "organisation_level",
    "team_level",
    "player_level",
    "public_level",
  ];

  const permissions: Record<DataCategory, CategoryPermissions> = {} as Record<
    DataCategory,
    CategoryPermissions
  >;
  for (const category of categories) {
    permissions[category] = role_permissions[category];
  }

  console.log(
    `[LocalAuthorizationAdapter] Retrieved permissions for role: ${role}`,
  );

  const result = create_success_result({ role, permissions });
  authorization_cache.set(cache_key, result);
  return result;
}
