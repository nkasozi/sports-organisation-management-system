import type { SystemUser } from "$lib/core/entities/SystemUser";
import type {
  OrganizationRepository,
  SystemUserRepository,
  TeamRepository,
} from "$lib/core/interfaces/ports";

import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import type { UserProfile } from "./auth";
import {
  ALL_TEAMS_SCOPE_NAME,
  PROFILE_LOADER_CONVERTED_PROFILES_EVENT,
  PROFILE_LOADER_CONVERTED_PROFILES_MESSAGE,
  PROFILE_LOADER_CORRELATION_ID,
  PROFILE_LOADER_FOUND_SYSTEM_USERS_EVENT,
  PROFILE_LOADER_FOUND_SYSTEM_USERS_MESSAGE,
  PROFILE_LOADER_LOAD_FAILED_EVENT,
  PROFILE_LOADER_LOAD_FAILED_MESSAGE,
  PROFILE_LOADER_NO_SYSTEM_USERS_EVENT,
  PROFILE_LOADER_NO_SYSTEM_USERS_MESSAGE,
  PROFILE_LOADER_ORGANIZATION_NAME_RESOLUTION_FAILED_EVENT,
  PROFILE_LOADER_ORGANIZATION_NAME_RESOLUTION_FAILED_MESSAGE,
  PROFILE_LOADER_TEAM_NAME_RESOLUTION_FAILED_EVENT,
  PROFILE_LOADER_TEAM_NAME_RESOLUTION_FAILED_MESSAGE,
} from "./profileLoaderLogMessages";

export function convert_system_user_to_profile(
  system_user: SystemUser,
  organization_name: string,
  team_name: string,
): UserProfile {
  return {
    id: system_user.id,
    display_name: `${system_user.first_name} ${system_user.last_name}`.trim(),
    email: system_user.email,
    role: system_user.role,
    organization_id: system_user.organization_id,
    organization_name,
    team_id: system_user.team_id ?? "",
    team_name,
    player_id: system_user.player_id,
    official_id: system_user.official_id,
  };
}

export function convert_system_users_to_profiles(
  system_users: SystemUser[],
  organization_name_map: Map<string, string>,
  team_name_map: Map<string, string>,
): UserProfile[] {
  return system_users.map((user) => {
    const team_id = user.team_id ?? "";

    return convert_system_user_to_profile(
      user,
      organization_name_map.get(user.organization_id) ?? user.organization_id,
      team_name_map.get(team_id) ?? "",
    );
  });
}

export async function resolve_organization_names(
  organization_ids: string[],
  organization_repository: OrganizationRepository,
): Promise<Map<string, string>> {
  const name_map = new Map<string, string>();
  name_map.set("*", "All Organisations");

  const unique_ids = [...new Set(organization_ids)].filter(
    (id) => id !== WILDCARD_SCOPE && id.trim().length > 0,
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
    console.warn(PROFILE_LOADER_ORGANIZATION_NAME_RESOLUTION_FAILED_MESSAGE, {
      event: PROFILE_LOADER_ORGANIZATION_NAME_RESOLUTION_FAILED_EVENT,
      correlation_id: PROFILE_LOADER_CORRELATION_ID,
      error: result.error,
    });
  }

  return name_map;
}

async function resolve_team_names(
  team_ids: string[],
  team_repository: TeamRepository,
): Promise<Map<string, string>> {
  const name_map = new Map<string, string>();
  name_map.set("*", ALL_TEAMS_SCOPE_NAME);

  const unique_ids = [...new Set(team_ids)].filter(
    (id) => id !== WILDCARD_SCOPE && id.trim().length > 0,
  );

  if (unique_ids.length === 0) {
    return name_map;
  }

  const result = await team_repository.find_by_ids(unique_ids);

  if (result.success) {
    for (const team of result.data) {
      name_map.set(team.id, team.name);
    }
    return name_map;
  }

  console.warn(PROFILE_LOADER_TEAM_NAME_RESOLUTION_FAILED_MESSAGE, {
    event: PROFILE_LOADER_TEAM_NAME_RESOLUTION_FAILED_EVENT,
    correlation_id: PROFILE_LOADER_CORRELATION_ID,
    error: result.error,
  });

  return name_map;
}

async function build_profiles_with_resolved_names(
  system_users: SystemUser[],
  organization_repository: OrganizationRepository,
  team_repository: TeamRepository,
): Promise<UserProfile[]> {
  const organization_ids = system_users.map((u) => u.organization_id);
  const team_ids = system_users.map((user) => user.team_id ?? "");
  const [organization_name_map, team_name_map] = await Promise.all([
    resolve_organization_names(organization_ids, organization_repository),
    resolve_team_names(team_ids, team_repository),
  ]);

  const profiles = convert_system_users_to_profiles(
    system_users,
    organization_name_map,
    team_name_map,
  );

  console.debug(PROFILE_LOADER_CONVERTED_PROFILES_MESSAGE, {
    event: PROFILE_LOADER_CONVERTED_PROFILES_EVENT,
    correlation_id: PROFILE_LOADER_CORRELATION_ID,
    profile_count: profiles.length,
    profile_ids: profiles.map((profile) => profile.id),
  });

  return profiles;
}

export async function load_profiles_from_repository(
  repository: SystemUserRepository,
  organization_repository: OrganizationRepository,
  team_repository: TeamRepository,
): Promise<UserProfile[]> {
  const result = await repository.find_all();

  if (!result.success) {
    console.error(PROFILE_LOADER_LOAD_FAILED_MESSAGE, {
      event: PROFILE_LOADER_LOAD_FAILED_EVENT,
      correlation_id: PROFILE_LOADER_CORRELATION_ID,
      error: result.error,
    });
    return [];
  }

  const system_users = result.data.items;

  console.debug(PROFILE_LOADER_FOUND_SYSTEM_USERS_MESSAGE, {
    event: PROFILE_LOADER_FOUND_SYSTEM_USERS_EVENT,
    correlation_id: PROFILE_LOADER_CORRELATION_ID,
    user_count: system_users.length,
    user_ids: system_users.map((user) => user.id),
  });

  if (system_users.length === 0) {
    console.warn(PROFILE_LOADER_NO_SYSTEM_USERS_MESSAGE, {
      event: PROFILE_LOADER_NO_SYSTEM_USERS_EVENT,
      correlation_id: PROFILE_LOADER_CORRELATION_ID,
    });
    return [];
  }

  return build_profiles_with_resolved_names(
    system_users,
    organization_repository,
    team_repository,
  );
}
