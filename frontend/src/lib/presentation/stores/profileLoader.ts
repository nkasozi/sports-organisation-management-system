import type { SystemUser } from "$lib/core/entities/SystemUser";
import type {
  SystemUserRepository,
  OrganizationRepository,
} from "$lib/core/interfaces/ports";
import type { UserProfile } from "./auth";

export function convert_system_user_to_profile(
  system_user: SystemUser,
  organization_name: string,
): UserProfile {
  return {
    id: system_user.id,
    display_name: `${system_user.first_name} ${system_user.last_name}`.trim(),
    email: system_user.email,
    role: system_user.role,
    organization_id: system_user.organization_id,
    organization_name,
    team_id: system_user.team_id ?? "",
    player_id: system_user.player_id,
    official_id: system_user.official_id,
  };
}

export function convert_system_users_to_profiles(
  system_users: SystemUser[],
  organization_name_map: Map<string, string>,
): UserProfile[] {
  return system_users
    .map((user) =>
      convert_system_user_to_profile(
        user,
        organization_name_map.get(user.organization_id) ?? user.organization_id,
      ),
    );
}

export async function resolve_organization_names(
  organization_ids: string[],
  organization_repository: OrganizationRepository,
): Promise<Map<string, string>> {
  const name_map = new Map<string, string>();
  name_map.set("*", "All Organisations");

  const unique_ids = [...new Set(organization_ids)].filter(
    (id) => id !== "*" && id.trim().length > 0,
  );

  if (unique_ids.length === 0) {
    return name_map;
  }

  const result = await organization_repository.find_by_ids(unique_ids);

  if (result.success) {
    for (const org of result.data) {
      name_map.set(org.id, org.name);
    }
  } else {
    console.warn(
      `[ProfileLoader] Failed to resolve organization names: ${result.error}`,
    );
  }

  return name_map;
}

export async function load_profiles_from_repository(
  repository: SystemUserRepository,
  organization_repository: OrganizationRepository,
): Promise<UserProfile[]> {
  const result = await repository.find_all();

  if (!result.success) {
    console.error(
      `[ProfileLoader] Failed to load system users: ${result.error}`,
    );
    return [];
  }

  const system_users = result.data.items;

  console.debug(
    `[ProfileLoader] Found ${system_users.length} system user(s):`,
    system_users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      organization_id: u.organization_id,
    })),
  );

  if (system_users.length === 0) {
    console.warn("[ProfileLoader] No system users found in repository");
    return [];
  }

  const organization_ids = system_users.map((u) => u.organization_id);
  const organization_name_map = await resolve_organization_names(
    organization_ids,
    organization_repository,
  );

  const profiles = convert_system_users_to_profiles(
    system_users,
    organization_name_map,
  );

  console.debug(
    `[ProfileLoader] Converted to ${profiles.length} profile(s):`,
    profiles.map((p) => ({
      id: p.id,
      display_name: p.display_name,
      role: p.role,
      organization_name: p.organization_name,
    })),
  );

  return profiles;
}
