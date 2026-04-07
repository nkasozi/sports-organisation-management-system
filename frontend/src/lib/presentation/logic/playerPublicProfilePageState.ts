import type { GameEvent } from "$lib/core/entities/Fixture";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";

const PLAYER_PUBLIC_PROFILE_VIDEO_PLATFORMS = new Set(["youtube", "vimeo"]);
const PLAYER_PUBLIC_PROFILE_WEBSITE_PLATFORMS = new Set(["website"]);

export interface PlayerPublicProfileStats {
  total_matches: number;
  goals: number;
  own_goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  substitutions_in: number;
  substitutions_out: number;
}

export interface PlayerPublicTeamStats {
  team: Team;
  membership: PlayerTeamMembership;
  stats: PlayerPublicProfileStats;
}

export interface PlayerPublicProfileLinkSections {
  social_media_links: ProfileLink[];
  website_links: ProfileLink[];
  video_links: ProfileLink[];
}

export function create_empty_player_public_profile_stats(): PlayerPublicProfileStats {
  return {
    total_matches: 0,
    goals: 0,
    own_goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    substitutions_in: 0,
    substitutions_out: 0,
  };
}

export function calculate_player_public_profile_event_stats(
  events: GameEvent[],
  player_name: string,
): PlayerPublicProfileStats {
  const stats = create_empty_player_public_profile_stats();

  for (const event of events) {
    const normalized_player_name = player_name.toLowerCase();
    const is_primary =
      event.player_name.toLowerCase() === normalized_player_name;
    const is_secondary =
      event.secondary_player_name.toLowerCase() === normalized_player_name;

    switch (event.event_type) {
      case "goal":
        if (is_primary) {
          stats.goals += 1;
        }
        if (is_secondary) {
          stats.assists += 1;
        }
        break;
      case "own_goal":
        if (is_primary) {
          stats.own_goals += 1;
        }
        break;
      case "penalty_scored":
        if (is_primary) {
          stats.goals += 1;
        }
        break;
      case "yellow_card":
        if (is_primary) {
          stats.yellow_cards += 1;
        }
        break;
      case "red_card":
      case "second_yellow":
        if (is_primary) {
          stats.red_cards += 1;
        }
        break;
      case "substitution":
        if (is_primary) {
          stats.substitutions_in += 1;
        }
        if (is_secondary) {
          stats.substitutions_out += 1;
        }
        break;
    }
  }

  return stats;
}

export function merge_player_public_profile_stats(
  target: PlayerPublicProfileStats,
  source: PlayerPublicProfileStats,
): PlayerPublicProfileStats {
  return {
    total_matches: target.total_matches + source.total_matches,
    goals: target.goals + source.goals,
    own_goals: target.own_goals + source.own_goals,
    assists: target.assists + source.assists,
    yellow_cards: target.yellow_cards + source.yellow_cards,
    red_cards: target.red_cards + source.red_cards,
    substitutions_in: target.substitutions_in + source.substitutions_in,
    substitutions_out: target.substitutions_out + source.substitutions_out,
  };
}

export function split_player_public_profile_links(
  profile_links: ProfileLink[],
): PlayerPublicProfileLinkSections {
  return profile_links.reduce<PlayerPublicProfileLinkSections>(
    (sections: PlayerPublicProfileLinkSections, profile_link: ProfileLink) => {
      const normalized_platform = profile_link.platform.toLowerCase();
      if (PLAYER_PUBLIC_PROFILE_WEBSITE_PLATFORMS.has(normalized_platform)) {
        sections.website_links.push(profile_link);
        return sections;
      }

      if (PLAYER_PUBLIC_PROFILE_VIDEO_PLATFORMS.has(normalized_platform)) {
        sections.video_links.push(profile_link);
        return sections;
      }

      sections.social_media_links.push(profile_link);
      return sections;
    },
    {
      social_media_links: [],
      website_links: [],
      video_links: [],
    },
  );
}
