import type { Fixture } from "$lib/core/entities/Fixture";
import type { Player } from "$lib/core/entities/Player";
import { get_player_full_name } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type LoadPlayerPublicProfilePageDataCommand,
  PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  PLAYER_PUBLIC_PROFILE_MESSAGE,
  PLAYER_PUBLIC_PROFILE_STATUS_COMPLETED,
  PLAYER_PUBLIC_PROFILE_VISIBILITY_PRIVATE,
  type PlayerPublicProfileLoadError,
  type PlayerPublicProfileStatsBundle,
} from "./playerPublicProfileDataLoaderContracts";
import {
  calculate_player_public_profile_event_stats,
  create_empty_player_public_profile_stats,
  merge_player_public_profile_stats,
  type PlayerPublicProfileLinkSections,
  type PlayerPublicProfileStats,
  type PlayerPublicTeamStats,
  split_player_public_profile_links,
} from "./playerPublicProfilePageState";

function create_player_public_profile_load_error(
  kind: PlayerPublicProfileLoadError["kind"],
  message: string,
): PlayerPublicProfileLoadError {
  return { kind, message };
}

function create_empty_player_public_profile_link_sections(): PlayerPublicProfileLinkSections {
  return { social_media_links: [], website_links: [], video_links: [] };
}
function create_empty_player_public_profile_stats_bundle(): PlayerPublicProfileStatsBundle {
  return {
    overall_stats: create_empty_player_public_profile_stats(),
    team_stats: [],
  };
}

export async function load_public_player_profile(
  command: LoadPlayerPublicProfilePageDataCommand,
): AsyncResult<PlayerProfile, PlayerPublicProfileLoadError> {
  const profile_result =
    await command.dependencies.profile_use_cases.get_by_slug(command.slug);
  if (!profile_result.success || !profile_result.data) {
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
): Promise<PlayerPosition | null> {
  if (!player.position_id) {
    return null;
  }
  const position_result =
    await command.dependencies.position_use_cases.get_by_id(player.position_id);
  if (!position_result.success || !position_result.data) {
    return null;
  }
  return position_result.data;
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
    return create_empty_player_public_profile_link_sections();
  }
  return split_player_public_profile_links(profile_links_result.data.items);
}

function build_player_public_team_stats(
  membership: PlayerTeamMembership,
  teams_by_id: Map<string, Team>,
  fixtures: Fixture[],
  player_full_name: string,
): PlayerPublicTeamStats | null {
  const team = teams_by_id.get(membership.team_id);
  if (!team) {
    return null;
  }
  const relevant_fixtures = fixtures.filter(
    (fixture: Fixture) =>
      fixture.status === PLAYER_PUBLIC_PROFILE_STATUS_COMPLETED &&
      (fixture.home_team_id === team.id || fixture.away_team_id === team.id),
  );
  let team_stats = create_empty_player_public_profile_stats();
  for (const fixture of relevant_fixtures) {
    team_stats = merge_player_public_profile_stats(
      team_stats,
      calculate_player_public_profile_event_stats(
        fixture.game_events || [],
        player_full_name,
      ),
    );
  }
  team_stats.total_matches = relevant_fixtures.length;
  return { membership, team, stats: team_stats };
}

function build_player_public_overall_stats(
  team_stats: PlayerPublicTeamStats[],
): PlayerPublicProfileStats {
  return team_stats.reduce(
    (
      current_stats: PlayerPublicProfileStats,
      current_team_stat: PlayerPublicTeamStats,
    ) =>
      merge_player_public_profile_stats(current_stats, current_team_stat.stats),
    create_empty_player_public_profile_stats(),
  );
}

export async function build_public_player_stats_bundle(
  command: LoadPlayerPublicProfilePageDataCommand,
  player: Player,
): Promise<PlayerPublicProfileStatsBundle> {
  const [memberships_result, teams_result, fixtures_result] = await Promise.all(
    [
      command.dependencies.membership_use_cases.list(),
      command.dependencies.team_use_cases.list(),
      command.dependencies.fixture_use_cases.list(),
    ],
  );
  if (!memberships_result.success || !fixtures_result.success) {
    return create_empty_player_public_profile_stats_bundle();
  }
  const teams_by_id = new Map<string, Team>();
  for (const team of teams_result.data?.items || []) {
    teams_by_id.set(team.id, team);
  }
  const player_memberships = (memberships_result.data?.items || []).filter(
    (membership: PlayerTeamMembership) => membership.player_id === player.id,
  );
  const player_full_name = get_player_full_name(player);
  const player_fixtures = fixtures_result.data?.items || [];
  const team_stats = player_memberships
    .map((membership: PlayerTeamMembership) =>
      build_player_public_team_stats(
        membership,
        teams_by_id,
        player_fixtures,
        player_full_name,
      ),
    )
    .filter(
      (team_stat): team_stat is PlayerPublicTeamStats => team_stat !== null,
    );
  return {
    overall_stats: build_player_public_overall_stats(team_stats),
    team_stats,
  };
}
