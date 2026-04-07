import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import type {
  LoadPlayerPublicProfilePageDataCommand,
  PlayerPublicProfileLoadError,
  PlayerPublicProfilePageData,
} from "./playerPublicProfileDataLoaderContracts";
import {
  build_public_player_stats_bundle,
  load_public_player,
  load_public_player_link_sections,
  load_public_player_position,
  load_public_player_profile,
} from "./playerPublicProfileDataLoaderSupport";

export {
  PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  type PlayerPublicProfileDataDependencies,
  type PlayerPublicProfileLoadError,
  type PlayerPublicProfilePageData,
} from "./playerPublicProfileDataLoaderContracts";

export async function load_player_public_profile_page_data(
  command: LoadPlayerPublicProfilePageDataCommand,
): AsyncResult<PlayerPublicProfilePageData, PlayerPublicProfileLoadError> {
  const profile_result = await load_public_player_profile(command);
  if (!profile_result.success) {
    return profile_result;
  }
  const player_result = await load_public_player(command, profile_result.data);
  if (!player_result.success) {
    return player_result;
  }
  const [position, link_sections, stats_bundle] = await Promise.all([
    load_public_player_position(command, player_result.data),
    load_public_player_link_sections(command, profile_result.data),
    build_public_player_stats_bundle(command, player_result.data),
  ]);
  return create_success_result({
    profile: profile_result.data,
    player: player_result.data,
    position,
    overall_stats: stats_bundle.overall_stats,
    team_stats: stats_bundle.team_stats,
    link_sections,
  });
}
