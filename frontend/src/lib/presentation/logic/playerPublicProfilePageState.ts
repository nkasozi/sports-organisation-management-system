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

type PlayerPublicProfileStatKey = keyof PlayerPublicProfileStats;

interface PlayerPublicProfileEventStatTargets {
  primary_stat_keys: PlayerPublicProfileStatKey[];
  secondary_stat_keys: PlayerPublicProfileStatKey[];
}

const EMPTY_PLAYER_PUBLIC_PROFILE_EVENT_STAT_TARGETS: PlayerPublicProfileEventStatTargets =
  { primary_stat_keys: [], secondary_stat_keys: [] };

const PLAYER_PUBLIC_PROFILE_EVENT_STAT_TARGETS = new Map<
  string,
  PlayerPublicProfileEventStatTargets
>([
  ["goal", { primary_stat_keys: ["goals"], secondary_stat_keys: ["assists"] }],
  ["own_goal", { primary_stat_keys: ["own_goals"], secondary_stat_keys: [] }],
  ["penalty_scored", { primary_stat_keys: ["goals"], secondary_stat_keys: [] }],
  [
    "yellow_card",
    { primary_stat_keys: ["yellow_cards"], secondary_stat_keys: [] },
  ],
  ["red_card", { primary_stat_keys: ["red_cards"], secondary_stat_keys: [] }],
  [
    "second_yellow",
    { primary_stat_keys: ["red_cards"], secondary_stat_keys: [] },
  ],
  [
    "substitution",
    {
      primary_stat_keys: ["substitutions_in"],
      secondary_stat_keys: ["substitutions_out"],
    },
  ],
]);

function increment_player_public_profile_stats(
  stats: PlayerPublicProfileStats,
  stat_keys: PlayerPublicProfileStatKey[],
): PlayerPublicProfileStats {
  return stat_keys.reduce<PlayerPublicProfileStats>(
    (current_stats, stat_key) => ({
      ...current_stats,
      [stat_key]: current_stats[stat_key] + 1,
    }),
    stats,
  );
}

function apply_event_to_player_public_profile_stats(
  stats: PlayerPublicProfileStats,
  event: GameEvent,
  normalized_player_name: string,
): PlayerPublicProfileStats {
  const stat_targets =
    PLAYER_PUBLIC_PROFILE_EVENT_STAT_TARGETS.get(event.event_type) ??
    EMPTY_PLAYER_PUBLIC_PROFILE_EVENT_STAT_TARGETS;
  const is_primary = event.player_name.toLowerCase() === normalized_player_name;
  const is_secondary =
    event.secondary_player_name.toLowerCase() === normalized_player_name;
  const primary_applied_stats = is_primary
    ? increment_player_public_profile_stats(
        stats,
        stat_targets.primary_stat_keys,
      )
    : stats;
  return is_secondary
    ? increment_player_public_profile_stats(
        primary_applied_stats,
        stat_targets.secondary_stat_keys,
      )
    : primary_applied_stats;
}

export function calculate_player_public_profile_event_stats(
  events: GameEvent[],
  player_name: string,
): PlayerPublicProfileStats {
  const normalized_player_name = player_name.toLowerCase();
  return events.reduce<PlayerPublicProfileStats>(
    (stats, event) =>
      apply_event_to_player_public_profile_stats(
        stats,
        event,
        normalized_player_name,
      ),
    create_empty_player_public_profile_stats(),
  );
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
