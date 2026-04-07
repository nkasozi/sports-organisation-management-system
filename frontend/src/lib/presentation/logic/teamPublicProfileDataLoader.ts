import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import type {
  LoadTeamPublicProfilePageDataCommand,
  TeamPublicProfileLoadError,
  TeamPublicProfilePageData,
} from "./teamPublicProfileDataLoaderContracts";
import {
  build_public_team_stats_bundle,
  load_public_team,
  load_public_team_profile,
  load_public_team_profile_links,
} from "./teamPublicProfileDataLoaderSupport";

export {
  TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  type TeamPublicProfileDataDependencies,
  type TeamPublicProfileLoadError,
  type TeamPublicProfilePageData,
} from "./teamPublicProfileDataLoaderContracts";

export async function load_team_public_profile_page_data(
  command: LoadTeamPublicProfilePageDataCommand,
): AsyncResult<TeamPublicProfilePageData, TeamPublicProfileLoadError> {
  const profile_result = await load_public_team_profile(command);
  if (!profile_result.success) {
    return profile_result;
  }
  const team_result = await load_public_team(command, profile_result.data);
  if (!team_result.success) {
    return team_result;
  }
  const [profile_links, stats_bundle] = await Promise.all([
    load_public_team_profile_links(command, profile_result.data),
    build_public_team_stats_bundle(command, team_result.data),
  ]);
  return create_success_result({
    profile: profile_result.data,
    team: team_result.data,
    overall_stats: stats_bundle.overall_stats,
    competition_stats: stats_bundle.competition_stats,
    profile_links,
    teams_by_id: stats_bundle.teams_by_id,
  });
}
