import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";
import type { TeamProfile } from "$lib/core/entities/TeamProfile";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type LoadTeamPublicProfilePageDataCommand,
  TEAM_PUBLIC_PROFILE_EVENT,
  TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  TEAM_PUBLIC_PROFILE_MESSAGE,
  TEAM_PUBLIC_PROFILE_VISIBILITY_PRIVATE,
  type TeamPublicProfileLoadError,
} from "./teamPublicProfileDataLoaderContracts";

export { build_public_team_stats_bundle } from "./teamPublicProfileStatsBundle";

function create_team_public_profile_load_error(
  kind: TeamPublicProfileLoadError["kind"],
  message: string,
): TeamPublicProfileLoadError {
  return { kind, message };
}

export async function load_public_team_profile(
  command: LoadTeamPublicProfilePageDataCommand,
): AsyncResult<TeamProfile, TeamPublicProfileLoadError> {
  const profile_result =
    await command.dependencies.profile_use_cases.get_by_slug(command.slug);
  if (!profile_result.success || !profile_result.data) {
    console.warn("[TeamPublicProfile] Profile not found", {
      event: TEAM_PUBLIC_PROFILE_EVENT.PROFILE_NOT_FOUND,
      slug: command.slug,
    });
    return create_failure_result(
      create_team_public_profile_load_error(
        TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.not_found,
        TEAM_PUBLIC_PROFILE_MESSAGE.not_found,
      ),
    );
  }
  if (
    profile_result.data.visibility === TEAM_PUBLIC_PROFILE_VISIBILITY_PRIVATE
  ) {
    console.info("[TeamPublicProfile] Profile is private", {
      event: TEAM_PUBLIC_PROFILE_EVENT.PROFILE_RESTRICTED,
      profile_id: profile_result.data.id,
    });
    return create_failure_result(
      create_team_public_profile_load_error(
        TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.restricted,
        TEAM_PUBLIC_PROFILE_MESSAGE.restricted,
      ),
    );
  }
  return create_success_result(profile_result.data);
}

export async function load_public_team(
  command: LoadTeamPublicProfilePageDataCommand,
  profile: TeamProfile,
): AsyncResult<Team, TeamPublicProfileLoadError> {
  const team_result = await command.dependencies.team_use_cases.get_by_id(
    profile.team_id,
  );
  if (!team_result.success || !team_result.data) {
    console.error("[TeamPublicProfile] Team unavailable", {
      event: TEAM_PUBLIC_PROFILE_EVENT.TEAM_UNAVAILABLE,
      profile_id: profile.id,
      team_id: profile.team_id,
    });
    return create_failure_result(
      create_team_public_profile_load_error(
        TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.unavailable,
        TEAM_PUBLIC_PROFILE_MESSAGE.unavailable,
      ),
    );
  }
  return create_success_result(team_result.data);
}

export async function load_public_team_profile_links(
  command: LoadTeamPublicProfilePageDataCommand,
  profile: TeamProfile,
): Promise<ProfileLink[]> {
  const profile_links_result =
    await command.dependencies.profile_link_use_cases.list_by_profile(
      profile.id,
    );
  if (!profile_links_result.success || !profile_links_result.data?.items) {
    console.warn("[TeamPublicProfile] Profile links unavailable", {
      event: TEAM_PUBLIC_PROFILE_EVENT.LINKS_UNAVAILABLE,
      profile_id: profile.id,
    });
    return [];
  }
  return profile_links_result.data.items;
}
