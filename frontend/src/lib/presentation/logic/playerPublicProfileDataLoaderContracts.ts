import type { Fixture } from "$lib/core/entities/Fixture";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";

import type {
  PlayerPublicProfileLinkSections,
  PlayerPublicProfileStats,
  PlayerPublicTeamStats,
} from "./playerPublicProfilePageState";

export const PLAYER_PUBLIC_PROFILE_VISIBILITY_PRIVATE = "private";
export const PLAYER_PUBLIC_PROFILE_STATUS_COMPLETED = "completed";

export const PLAYER_PUBLIC_PROFILE_MESSAGE = {
  not_found: "Player profile not found",
  restricted: "This profile is private",
  unavailable: "Player information not available",
} as const;

export const PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND = {
  not_found: "not_found",
  restricted: "restricted",
  unavailable: "unavailable",
} as const;

export type PlayerPublicProfileLoadErrorKind =
  (typeof PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND)[keyof typeof PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND];

type PlayerPublicProfileListResult<TData> = Promise<{
  success: boolean;
  data?: { items?: TData[] };
}>;

type PlayerPublicProfileGetResult<TData> = Promise<{
  success: boolean;
  data?: TData;
}>;

export interface PlayerPublicProfileLoadError {
  kind: PlayerPublicProfileLoadErrorKind;
  message: string;
}

export interface PlayerPublicProfileDataDependencies {
  profile_use_cases: {
    get_by_slug(slug: string): PlayerPublicProfileGetResult<PlayerProfile>;
  };
  player_use_cases: {
    get_by_id(player_id: string): PlayerPublicProfileGetResult<Player>;
  };
  team_use_cases: {
    list(filter?: Record<string, string>): PlayerPublicProfileListResult<Team>;
  };
  membership_use_cases: {
    list(
      filter?: Record<string, string>,
    ): PlayerPublicProfileListResult<PlayerTeamMembership>;
  };
  fixture_use_cases: {
    list(
      filter?: Record<string, string>,
    ): PlayerPublicProfileListResult<Fixture>;
  };
  position_use_cases: {
    get_by_id(
      position_id: string,
    ): PlayerPublicProfileGetResult<PlayerPosition>;
  };
  profile_link_use_cases: {
    list_by_profile(
      profile_id: string,
    ): PlayerPublicProfileListResult<ProfileLink>;
  };
}

export interface PlayerPublicProfilePageData {
  profile: PlayerProfile;
  player: Player;
  position: PlayerPosition | null;
  overall_stats: PlayerPublicProfileStats;
  team_stats: PlayerPublicTeamStats[];
  link_sections: PlayerPublicProfileLinkSections;
}

export interface PlayerPublicProfileStatsBundle {
  overall_stats: PlayerPublicProfileStats;
  team_stats: PlayerPublicTeamStats[];
}

export interface LoadPlayerPublicProfilePageDataCommand {
  slug: string;
  dependencies: PlayerPublicProfileDataDependencies;
}
