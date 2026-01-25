<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
  import type { Player } from "$lib/core/entities/Player";
  import type { Team } from "$lib/core/entities/Team";
  import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
  import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
  import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
  import type { ProfileLink } from "$lib/core/entities/ProfileLink";
  import { get_player_profile_use_cases } from "$lib/core/usecases/PlayerProfileUseCases";
  import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
  import { get_profile_link_use_cases } from "$lib/core/usecases/ProfileLinkUseCases";
  import {
    get_player_avatar,
    get_player_full_name,
    get_player_initials,
    DEFAULT_PLAYER_AVATAR,
  } from "$lib/core/entities/Player";
  import { get_platform_icon } from "$lib/core/entities/ProfileLink";

  interface PlayerStats {
    total_matches: number;
    goals: number;
    own_goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    substitutions_in: number;
    substitutions_out: number;
  }

  interface TeamStats {
    team: Team;
    membership: PlayerTeamMembership;
    stats: PlayerStats;
  }

  let profile: PlayerProfile | null = null;
  let player: Player | null = null;
  let position: PlayerPosition | null = null;
  let team_stats: TeamStats[] = [];
  let overall_stats: PlayerStats = create_empty_stats();
  let social_media_links: ProfileLink[] = [];
  let website_links: ProfileLink[] = [];
  let video_links: ProfileLink[] = [];
  let loading = true;
  let error_message = "";
  let not_found = false;

  const profile_use_cases = get_player_profile_use_cases();
  const player_use_cases = get_player_use_cases();
  const team_use_cases = get_team_use_cases();
  const membership_use_cases = get_player_team_membership_use_cases();
  const fixture_use_cases = get_fixture_use_cases();
  const position_use_cases = get_player_position_use_cases();
  const profile_link_use_cases = get_profile_link_use_cases();

  function create_empty_stats(): PlayerStats {
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

  function calculate_player_stats_from_events(
    events: GameEvent[],
    player_name: string,
  ): PlayerStats {
    const stats = create_empty_stats();

    for (const event of events) {
      const is_primary =
        event.player_name.toLowerCase() === player_name.toLowerCase();
      const is_secondary =
        event.secondary_player_name?.toLowerCase() ===
        player_name.toLowerCase();

      switch (event.event_type) {
        case "goal":
          if (is_primary) stats.goals++;
          if (is_secondary) stats.assists++;
          break;
        case "own_goal":
          if (is_primary) stats.own_goals++;
          break;
        case "penalty_scored":
          if (is_primary) stats.goals++;
          break;
        case "yellow_card":
          if (is_primary) stats.yellow_cards++;
          break;
        case "red_card":
        case "second_yellow":
          if (is_primary) stats.red_cards++;
          break;
        case "substitution":
          if (is_primary) stats.substitutions_in++;
          if (is_secondary) stats.substitutions_out++;
          break;
      }
    }

    return stats;
  }

  function merge_stats(target: PlayerStats, source: PlayerStats): PlayerStats {
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

  async function load_profile_data(): Promise<boolean> {
    if (!browser) return false;

    const slug = $page.params.slug;

    if (!slug) {
      not_found = true;
      return false;
    }

    const profile_result = await profile_use_cases.get_by_slug(slug);

    if (!profile_result.success || !profile_result.data) {
      not_found = true;
      return false;
    }

    profile = profile_result.data;

    if (profile.visibility === "private") {
      error_message = "This profile is private";
      return false;
    }

    const player_result = await player_use_cases.get_by_id(profile.player_id);

    if (!player_result.success || !player_result.data) {
      error_message = "Player information not available";
      return false;
    }

    player = player_result.data;

    if (player.position_id) {
      const position_result = await position_use_cases.get_by_id(
        player.position_id,
      );
      if (position_result.success && position_result.data) {
        position = position_result.data;
      }
    }

    await load_profile_links();
    await load_player_stats();

    return true;
  }

  async function load_profile_links(): Promise<void> {
    if (!profile) return;

    const result = await profile_link_use_cases.list_by_profile(profile.id);
    if (result.success) {
      social_media_links = result.data;
      website_links = [];
      video_links = [];
    }
  }

  async function load_player_stats(): Promise<void> {
    if (!player) return;

    const player_full_name = get_player_full_name(player);

    const memberships_result = await membership_use_cases.list();
    if (!memberships_result.success) return;

    const player_memberships = memberships_result.data.filter(
      (m: PlayerTeamMembership) => m.player_id === player!.id,
    );

    const teams_result = await team_use_cases.list();
    const teams_map = new Map<string, Team>();
    if (teams_result.success) {
      for (const team of teams_result.data) {
        teams_map.set(team.id, team);
      }
    }

    const fixtures_result = await fixture_use_cases.list();
    if (!fixtures_result.success) return;

    const all_fixtures = fixtures_result.data;

    const new_team_stats: TeamStats[] = [];
    let cumulative_overall = create_empty_stats();

    for (const membership of player_memberships) {
      const team = teams_map.get(membership.team_id);
      if (!team) continue;

      const team_fixtures = all_fixtures.filter(
        (f: Fixture) =>
          (f.home_team_id === team.id || f.away_team_id === team.id) &&
          f.status === "completed",
      );

      let team_player_stats = create_empty_stats();
      team_player_stats.total_matches = team_fixtures.length;

      for (const fixture of team_fixtures) {
        const events = fixture.game_events || [];
        const event_stats = calculate_player_stats_from_events(
          events,
          player_full_name,
        );
        team_player_stats = merge_stats(team_player_stats, event_stats);
      }

      team_player_stats.total_matches = team_fixtures.length;

      new_team_stats.push({
        team,
        membership,
        stats: team_player_stats,
      });

      cumulative_overall = merge_stats(cumulative_overall, team_player_stats);
    }

    team_stats = new_team_stats;
    overall_stats = cumulative_overall;
  }

  function get_platform_icon_svg(platform: string): string {
    const icons: Record<string, string> = {
      twitter:
        "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
      instagram:
        "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
      facebook:
        "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
      linkedin:
        "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
      youtube:
        "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
      tiktok:
        "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    };
    return icons[platform.toLowerCase()] || "";
  }

  onMount(() => {
    load_profile_data().finally(() => {
      loading = false;
    });
  });
</script>

<svelte:head>
  <title
    >{player
      ? `${get_player_full_name(player)} - Player Profile`
      : "Player Profile"}</title
  >
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-gray-600 dark:text-gray-300">Loading profile...</p>
      </div>
    </div>
  {:else if not_found}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center px-4">
        <div class="text-6xl mb-4">🔍</div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Profile Not Found
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          The player profile you're looking for doesn't exist or has been
          removed.
        </p>
        <a
          href="/"
          class="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  {:else if error_message}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center px-4">
        <div class="text-6xl mb-4">🔒</div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Access Restricted
        </h1>
        <p class="text-gray-600 dark:text-gray-400">{error_message}</p>
        <a
          href="/"
          class="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  {:else if player && profile}
    <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <section
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8"
      >
        <div class="h-32 sm:h-40 bg-indigo-600 dark:bg-indigo-700"></div>

        <div class="relative px-6 pb-6">
          <div
            class="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-20 mb-6"
          >
            <div class="relative">
              {#if player.profile_image_url}
                <img
                  src={get_player_avatar(player)}
                  alt={get_player_full_name(player)}
                  class="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-gray-100"
                />
              {:else}
                <div
                  class="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shadow-lg"
                >
                  <span
                    class="text-4xl sm:text-5xl font-bold text-indigo-600 dark:text-indigo-300"
                  >
                    {get_player_initials(player)}
                  </span>
                </div>
              {/if}
            </div>

            <div class="mt-4 sm:mt-0 sm:ml-6 sm:mb-2">
              <h1
                class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
              >
                {get_player_full_name(player)}
              </h1>
              {#if position}
                <p
                  class="text-lg text-indigo-600 dark:text-indigo-400 font-medium mt-1"
                >
                  {position.name}
                </p>
              {/if}
            </div>
          </div>

          {#if profile.profile_summary}
            <div class="mb-6">
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.profile_summary}
              </p>
            </div>
          {/if}

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {#if player.nationality}
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p
                  class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                  Nationality
                </p>
                <p
                  class="text-sm font-semibold text-gray-900 dark:text-white mt-1"
                >
                  {player.nationality}
                </p>
              </div>
            {/if}
            {#if player.height_cm}
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p
                  class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                  Height
                </p>
                <p
                  class="text-sm font-semibold text-gray-900 dark:text-white mt-1"
                >
                  {player.height_cm} cm
                </p>
              </div>
            {/if}
            {#if player.weight_kg}
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p
                  class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                  Weight
                </p>
                <p
                  class="text-sm font-semibold text-gray-900 dark:text-white mt-1"
                >
                  {player.weight_kg} kg
                </p>
              </div>
            {/if}
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p
                class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                Status
              </p>
              <p
                class="text-sm font-semibold text-gray-900 dark:text-white mt-1 capitalize"
              >
                {player.status}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
      >
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Career Statistics
        </h2>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div
            class="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-center"
          >
            <p
              class="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400"
            >
              {overall_stats.total_matches}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Matches</p>
          </div>
          <div
            class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center"
          >
            <p
              class="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400"
            >
              {overall_stats.goals}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Goals</p>
          </div>
          <div
            class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center"
          >
            <p
              class="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400"
            >
              {overall_stats.assists}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Assists</p>
          </div>
          <div
            class="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 text-center"
          >
            <p
              class="text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400"
            >
              {overall_stats.yellow_cards}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Yellow Cards
            </p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div
            class="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <p class="text-xl font-bold text-red-600 dark:text-red-400">
              {overall_stats.red_cards}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Red Cards</p>
          </div>
          <div
            class="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <p class="text-xl font-bold text-gray-700 dark:text-gray-300">
              {overall_stats.own_goals}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Own Goals</p>
          </div>
          <div
            class="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <p class="text-xl font-bold text-purple-600 dark:text-purple-400">
              {overall_stats.substitutions_in}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Sub Appearances
            </p>
          </div>
        </div>
      </section>

      {#if team_stats.length > 0}
        <section
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Team Statistics
          </h2>

          <div class="space-y-4">
            {#each team_stats as team_stat}
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
              >
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      {team_stat.team.name}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      #{team_stat.membership.jersey_number} • Since {new Date(
                        team_stat.membership.start_date,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    class="px-3 py-1 text-xs font-medium rounded-full {team_stat
                      .membership.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
                  >
                    {team_stat.membership.status}
                  </span>
                </div>

                <div class="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <p class="font-bold text-gray-900 dark:text-white">
                      {team_stat.stats.total_matches}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Matches
                    </p>
                  </div>
                  <div>
                    <p class="font-bold text-green-600 dark:text-green-400">
                      {team_stat.stats.goals}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Goals
                    </p>
                  </div>
                  <div>
                    <p class="font-bold text-blue-600 dark:text-blue-400">
                      {team_stat.stats.assists}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Assists
                    </p>
                  </div>
                  <div>
                    <p class="font-bold text-amber-600 dark:text-amber-400">
                      {team_stat.stats.yellow_cards}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Cards
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      {#if social_media_links.length > 0 || website_links.length > 0 || video_links.length > 0}
        <section
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-6"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Links & Media
          </h2>

          {#if social_media_links.length > 0}
            <div class="mb-6">
              <h3
                class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"
              >
                Social Media
              </h3>
              <div class="flex flex-wrap gap-3">
                {#each social_media_links as link}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg
                      class="w-5 h-5 text-gray-700 dark:text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={get_platform_icon_svg(link.platform || "")} />
                    </svg>
                    <span
                      class="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >{link.title || link.platform}</span
                    >
                  </a>
                {/each}
              </div>
            </div>
          {/if}

          {#if website_links.length > 0}
            <div class="mb-6">
              <h3
                class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"
              >
                Websites
              </h3>
              <div class="space-y-2">
                {#each website_links as link}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      class="w-5 h-5 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <span
                      class="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >{link.title}</span
                    >
                    <svg
                      class="w-4 h-4 text-gray-400 ml-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                {/each}
              </div>
            </div>
          {/if}

          {#if video_links.length > 0}
            <div>
              <h3
                class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"
              >
                Videos
              </h3>
              <div class="space-y-2">
                {#each video_links as link}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <svg
                      class="w-5 h-5 text-red-600 dark:text-red-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                      />
                    </svg>
                    <span
                      class="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >{link.title}</span
                    >
                    <svg
                      class="w-4 h-4 text-gray-400 ml-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </section>
      {/if}

      <footer
        class="text-center mt-8 py-4 text-sm text-gray-500 dark:text-gray-400"
      >
        <p>Powered by Sports Organization Management System</p>
      </footer>
    </div>
  {/if}
</div>
