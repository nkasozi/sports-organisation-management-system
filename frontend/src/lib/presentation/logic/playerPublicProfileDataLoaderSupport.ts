import type { Player } from "$lib/core/entities/Player";
import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type LoadPlayerPublicProfilePageDataCommand,
  PLAYER_PUBLIC_PROFILE_EVENT,
  PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  PLAYER_PUBLIC_PROFILE_MESSAGE,
  PLAYER_PUBLIC_PROFILE_VISIBILITY_PRIVATE,
  type PlayerPublicPositionState,
  type PlayerPublicProfileLoadError,
} from "./playerPublicProfileDataLoaderContracts";
import {
  type PlayerPublicProfileLinkSections,
  split_player_public_profile_links,
} from "./playerPublicProfilePageState";
import { PRESENCE_STATUS } from "./presenceStatus";

export { build_public_player_stats_bundle } from "./playerPublicProfileStatsBundle";

function create_player_public_profile_load_error(
  kind: PlayerPublicProfileLoadError["kind"],
  message: string,
): PlayerPublicProfileLoadError {
  return { kind, message };
}

function create_empty_player_public_profile_link_sections(): PlayerPublicProfileLinkSections {
  return { social_media_links: [], website_links: [], video_links: [] };
}

export async function load_public_player_profile(
  command: LoadPlayerPublicProfilePageDataCommand,
): AsyncResult<PlayerProfile, PlayerPublicProfileLoadError> {
  const profile_result =
    await command.dependencies.profile_use_cases.get_by_slug(command.slug);
  if (!profile_result.success || !profile_result.data) {
    console.warn("[PlayerPublicProfile] Profile not found", {
      event: PLAYER_PUBLIC_PROFILE_EVENT.PROFILE_NOT_FOUND,
      slug: command.slug,
    });
    return create_failure_result(
      create_player_public_profile_load_error(
        PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND.not_found,
        PLAYER_PUBLIC_PROFILE_MESSAGE.not_found,
      ),
    );
  }
  if (
    profile_result.data.visibility === PLAYER_PUBLIC_PROFILE_VISIBILITY_PRIVATE
  ) {
    console.info("[PlayerPublicProfile] Profile is private", {
      event: PLAYER_PUBLIC_PROFILE_EVENT.PROFILE_RESTRICTED,
      profile_id: profile_result.data.id,
    });
    return create_failure_result(
      create_player_public_profile_load_error(
        PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND.restricted,
        PLAYER_PUBLIC_PROFILE_MESSAGE.restricted,
      ),
    );
  }
  return create_success_result(profile_result.data);
}

export async function load_public_player(
  command: LoadPlayerPublicProfilePageDataCommand,
  profile: PlayerProfile,
): AsyncResult<Player, PlayerPublicProfileLoadError> {
  const player_result = await command.dependencies.player_use_cases.get_by_id(
    profile.player_id,
  );
  if (!player_result.success || !player_result.data) {
    console.error("[PlayerPublicProfile] Player unavailable", {
      event: PLAYER_PUBLIC_PROFILE_EVENT.PLAYER_UNAVAILABLE,
      profile_id: profile.id,
      player_id: profile.player_id,
    });
    return create_failure_result(
      create_player_public_profile_load_error(
        PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND.unavailable,
        PLAYER_PUBLIC_PROFILE_MESSAGE.unavailable,
      ),
    );
  }
  return create_success_result(player_result.data);
}

export async function load_public_player_position(
  command: LoadPlayerPublicProfilePageDataCommand,
  player: Player,
): Promise<PlayerPublicPositionState> {
  if (!player.position_id) return { status: PRESENCE_STATUS.MISSING };
  const position_result =
    await command.dependencies.position_use_cases.get_by_id(player.position_id);
  if (!position_result.success || !position_result.data) {
    console.warn("[PlayerPublicProfile] Position unavailable", {
      event: PLAYER_PUBLIC_PROFILE_EVENT.POSITION_UNAVAILABLE,
      player_id: player.id,
      position_id: player.position_id,
    });
    return { status: PRESENCE_STATUS.MISSING };
  }
  return { status: PRESENCE_STATUS.PRESENT, position: position_result.data };
}

export async function load_public_player_link_sections(
  command: LoadPlayerPublicProfilePageDataCommand,
  profile: PlayerProfile,
): Promise<PlayerPublicProfileLinkSections> {
  const profile_links_result =
    await command.dependencies.profile_link_use_cases.list_by_profile(
      profile.id,
    );
  if (!profile_links_result.success || !profile_links_result.data?.items) {
    console.warn("[PlayerPublicProfile] Profile links unavailable", {
      event: PLAYER_PUBLIC_PROFILE_EVENT.LINKS_UNAVAILABLE,
      profile_id: profile.id,
    });
    return create_empty_player_public_profile_link_sections();
  }
  return split_player_public_profile_links(profile_links_result.data.items);
}
