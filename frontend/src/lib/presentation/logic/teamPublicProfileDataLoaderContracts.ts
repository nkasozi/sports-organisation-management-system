import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";
import type { TeamProfile } from "$lib/core/entities/TeamProfile";

import type {
  CompetitionPublicProfileStats,
  TeamPublicProfileStats,
} from "./teamPublicProfilePageState";

export const TEAM_PUBLIC_PROFILE_VISIBILITY_PRIVATE = "private";
export const TEAM_PUBLIC_PROFILE_STATUS_SCHEDULED = "scheduled";

export const TEAM_PUBLIC_PROFILE_MESSAGE = {
  not_found: "Team profile not found",
  restricted: "This profile is private",
  unavailable: "Team information not available",
} as const;

export const TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND = {
  not_found: "not_found",
  restricted: "restricted",
  unavailable: "unavailable",
} as const;

export type TeamPublicProfileLoadErrorKind =
  (typeof TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND)[keyof typeof TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND];

type TeamPublicProfileListResult<TData> = Promise<{
  success: boolean;
  data?: { items?: TData[] };
}>;

type TeamPublicProfileGetResult<TData> = Promise<{
  success: boolean;
  data?: TData;
}>;

export interface TeamPublicProfileLoadError {
  kind: TeamPublicProfileLoadErrorKind;
  message: string;
}

export interface TeamPublicProfileDataDependencies {
  profile_use_cases: {
    get_by_slug(slug: string): TeamPublicProfileGetResult<TeamProfile>;
  };
  team_use_cases: {
    get_by_id(team_id: string): TeamPublicProfileGetResult<Team>;
    list(filter?: Record<string, string>): TeamPublicProfileListResult<Team>;
  };
  fixture_use_cases: {
    list(filter?: Record<string, string>): TeamPublicProfileListResult<Fixture>;
  };
  competition_use_cases: {
    list(
      filter?: Record<string, string>,
    ): TeamPublicProfileListResult<Competition>;
  };
  profile_link_use_cases: {
    list_by_profile(
      profile_id: string,
    ): TeamPublicProfileListResult<ProfileLink>;
  };
}

export interface TeamPublicProfilePageData {
  profile: TeamProfile;
  team: Team;
  overall_stats: TeamPublicProfileStats;
  competition_stats: CompetitionPublicProfileStats[];
  profile_links: ProfileLink[];
  teams_by_id: Map<string, Team>;
}

export interface TeamPublicProfileStatsBundle {
  overall_stats: TeamPublicProfileStats;
  competition_stats: CompetitionPublicProfileStats[];
  teams_by_id: Map<string, Team>;
}

export interface LoadTeamPublicProfilePageDataCommand {
  slug: string;
  dependencies: TeamPublicProfileDataDependencies;
}
