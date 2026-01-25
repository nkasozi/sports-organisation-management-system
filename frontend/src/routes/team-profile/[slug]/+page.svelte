<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import type { TeamProfile } from "$lib/core/entities/TeamProfile";
  import type { Team } from "$lib/core/entities/Team";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import type { Competition } from "$lib/core/entities/Competition";
  import type { ProfileLink } from "$lib/core/entities/ProfileLink";
  import { get_team_profile_use_cases } from "$lib/core/usecases/TeamProfileUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_profile_link_use_cases } from "$lib/core/usecases/ProfileLinkUseCases";
  import {
    get_team_logo,
    get_team_initials,
    DEFAULT_TEAM_LOGO,
  } from "$lib/core/entities/Team";
  import { get_platform_icon } from "$lib/core/entities/ProfileLink";

  interface TeamStats {
    total_matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    yellow_cards: number;
    red_cards: number;
  }

  interface CompetitionStats {
    competition: Competition;
    stats: TeamStats;
    upcoming_fixtures: Fixture[];
  }

  let profile: TeamProfile | null = null;
  let team: Team | null = null;
  let competition_stats: CompetitionStats[] = [];
  let overall_stats: TeamStats = create_empty_stats();
  let profile_links: ProfileLink[] = [];
  let teams_map = new Map<string, Team>();
  let loading = true;
  let error_message = "";
  let not_found = false;

  const profile_use_cases = get_team_profile_use_cases();
  const team_use_cases = get_team_use_cases();
  const fixture_use_cases = get_fixture_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const profile_link_use_cases = get_profile_link_use_cases();

  $: slug = $page.params.slug;

  function create_empty_stats(): TeamStats {
    return {
      total_matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      yellow_cards: 0,
      red_cards: 0,
    };
  }

  onMount(async () => {
    if (!browser) return;
    await load_profile();
  });

  async function load_profile(): Promise<boolean> {
    if (!slug) {
      not_found = true;
      loading = false;
      return false;
    }

    loading = true;
    error_message = "";

    const profile_result = await profile_use_cases.get_by_slug(slug);
    if (!profile_result.success || !profile_result.data) {
      not_found = true;
      loading = false;
      return false;
    }

    profile = profile_result.data;

    if (profile.visibility === "private") {
      error_message = "This profile is private";
      loading = false;
      return false;
    }

    const team_result = await team_use_cases.get_by_id(profile.team_id);
    if (team_result.success && team_result.data) {
      team = team_result.data;
    }

    await load_profile_links();
    await load_team_stats();

    loading = false;
    return true;
  }

  async function load_profile_links(): Promise<void> {
    if (!profile) return;

    const result = await profile_link_use_cases.list_by_profile(profile.id);
    if (result.success) {
      profile_links = result.data;
    }
  }

  async function load_team_stats(): Promise<void> {
    if (!team) return;

    const teams_result = await team_use_cases.list();
    if (teams_result.success) {
      for (const t of teams_result.data) {
        teams_map.set(t.id, t);
      }
    }

    const fixtures_result = await fixture_use_cases.list();
    if (!fixtures_result.success) return;

    const team_fixtures = fixtures_result.data.filter(
      (f: Fixture) =>
        f.home_team_id === team!.id || f.away_team_id === team!.id,
    );

    const competitions_result = await competition_use_cases.list();
    if (!competitions_result.success) return;

    const competition_map = new Map<string, Competition>();
    for (const comp of competitions_result.data) {
      competition_map.set(comp.id, comp);
    }

    const stats_by_competition = new Map<string, CompetitionStats>();

    for (const fixture of team_fixtures) {
      const competition = competition_map.get(fixture.competition_id);
      if (!competition) continue;

      if (!stats_by_competition.has(competition.id)) {
        stats_by_competition.set(competition.id, {
          competition,
          stats: create_empty_stats(),
          upcoming_fixtures: [],
        });
      }

      const comp_stats = stats_by_competition.get(competition.id)!;

      if (fixture.status === "scheduled") {
        comp_stats.upcoming_fixtures.push(fixture);
      }

      if (
        fixture.status === "completed" &&
        fixture.home_team_score !== null &&
        fixture.away_team_score !== null
      ) {
        comp_stats.stats.total_matches++;
        overall_stats.total_matches++;

        const is_home = fixture.home_team_id === team!.id;
        const team_score = is_home
          ? fixture.home_team_score
          : fixture.away_team_score;
        const opponent_score = is_home
          ? fixture.away_team_score
          : fixture.home_team_score;

        comp_stats.stats.goals_for += team_score;
        comp_stats.stats.goals_against += opponent_score;
        overall_stats.goals_for += team_score;
        overall_stats.goals_against += opponent_score;

        if (team_score > opponent_score) {
          comp_stats.stats.wins++;
          overall_stats.wins++;
        } else if (team_score === opponent_score) {
          comp_stats.stats.draws++;
          overall_stats.draws++;
        } else {
          comp_stats.stats.losses++;
          overall_stats.losses++;
        }

        if (fixture.game_events) {
          for (const event of fixture.game_events) {
            if (event.event_type === "yellow_card") {
              const event_team_id = is_home
                ? event.team_side === "home"
                  ? team!.id
                  : null
                : event.team_side === "away"
                  ? team!.id
                  : null;

              if (event_team_id === team!.id) {
                comp_stats.stats.yellow_cards++;
                overall_stats.yellow_cards++;
              }
            } else if (event.event_type === "red_card") {
              const event_team_id = is_home
                ? event.team_side === "home"
                  ? team!.id
                  : null
                : event.team_side === "away"
                  ? team!.id
                  : null;

              if (event_team_id === team!.id) {
                comp_stats.stats.red_cards++;
                overall_stats.red_cards++;
              }
            }
          }
        }
      }
    }

    competition_stats = Array.from(stats_by_competition.values()).sort(
      (a, b) => b.stats.total_matches - a.stats.total_matches,
    );

    for (const comp_stat of competition_stats) {
      comp_stat.upcoming_fixtures.sort(
        (a, b) =>
          new Date(a.scheduled_date).getTime() -
          new Date(b.scheduled_date).getTime(),
      );
      comp_stat.upcoming_fixtures = comp_stat.upcoming_fixtures.slice(0, 5);
    }
  }

  function format_date(date_string: string): string {
    const date = new Date(date_string);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function get_opponent_team_name(
    fixture: Fixture,
    current_team_id: string,
  ): string {
    const opponent_id =
      fixture.home_team_id === current_team_id
        ? fixture.away_team_id
        : fixture.home_team_id;
    const opponent_team = teams_map.get(opponent_id);
    return opponent_team?.name || opponent_id;
  }

  function get_full_fixture_display(fixture: Fixture): string {
    const home_team = teams_map.get(fixture.home_team_id);
    const away_team = teams_map.get(fixture.away_team_id);
    const home_name = home_team?.name || fixture.home_team_id;
    const away_name = away_team?.name || fixture.away_team_id;
    return `${home_name} vs ${away_name}`;
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
      website:
        "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z",
      other:
        "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    };
    return icons[platform.toLowerCase()] || icons.other;
  }
</script>

<svelte:head>
  <title>{team?.name || "Team Profile"} - Public Profile</title>
</svelte:head>

<div class="min-h-screen bg-accent-50 dark:bg-accent-900">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"
      ></div>
    </div>
  {:else if not_found}
    <div class="max-w-2xl mx-auto px-4 py-16 text-center">
      <div class="text-6xl mb-4">🔍</div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100 mb-2">
        Team Profile Not Found
      </h1>
      <p class="text-accent-600 dark:text-accent-400">
        The team profile you're looking for doesn't exist or has been removed.
      </p>
    </div>
  {:else if error_message}
    <div class="max-w-2xl mx-auto px-4 py-16 text-center">
      <div class="text-6xl mb-4">🔒</div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100 mb-2">
        Private Profile
      </h1>
      <p class="text-accent-600 dark:text-accent-400">{error_message}</p>
    </div>
  {:else if profile && team}
    <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <!-- Header Section -->
      <section
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8"
      >
        <div class="h-32 sm:h-40 bg-indigo-600 dark:bg-indigo-700"></div>

        <div class="relative px-6 pb-6">
          <div
            class="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-20 mb-6"
          >
            <div class="relative">
              {#if team.logo_url}
                <img
                  src={get_team_logo(team)}
                  alt={team.name}
                  class="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-gray-100"
                />
              {:else}
                <div
                  class="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shadow-lg"
                >
                  <span
                    class="text-4xl sm:text-5xl font-bold text-indigo-600 dark:text-indigo-300"
                  >
                    {get_team_initials(team)}
                  </span>
                </div>
              {/if}
            </div>

            <div class="mt-4 sm:mt-0 sm:ml-6 sm:mb-2 flex-1">
              <div class="flex items-baseline gap-3">
                <h1
                  class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                >
                  {team.name}
                </h1>
                {#if team.founded_year}
                  <span
                    class="text-sm text-gray-500 dark:text-gray-400 font-medium"
                  >
                    Est. {team.founded_year}
                  </span>
                {/if}
              </div>
              {#if team.short_name}
                <p
                  class="text-lg text-indigo-600 dark:text-indigo-400 font-medium mt-1"
                >
                  {team.short_name}
                </p>
              {/if}
            </div>
          </div>

          {#if profile.profile_summary}
            <div class="mt-6">
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.profile_summary}
              </p>
            </div>
          {/if}

          <!-- Profile Links -->
          {#if profile_links.length > 0}
            <div class="mt-6 flex flex-wrap gap-3">
              {#each profile_links as link (link.id)}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={get_platform_icon_svg(link.platform || "")} />
                  </svg>
                  <span class="font-medium">{link.title || link.platform}</span>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <!-- Overall Stats -->
      {#if overall_stats.total_matches > 0}
        <section
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Overall Statistics
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {overall_stats.total_matches}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Matches
              </div>
            </div>
            <div
              class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-green-900 dark:text-white">
                {overall_stats.wins}
              </div>
              <div class="text-sm text-green-600 dark:text-green-400">Wins</div>
            </div>
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-yellow-900 dark:text-white">
                {overall_stats.draws}
              </div>
              <div class="text-sm text-yellow-600 dark:text-yellow-400">
                Draws
              </div>
            </div>
            <div
              class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-red-900 dark:text-white">
                {overall_stats.losses}
              </div>
              <div class="text-sm text-red-600 dark:text-red-400">Losses</div>
            </div>
            <div
              class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {overall_stats.goals_for}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Goals For
              </div>
            </div>
            <div
              class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {overall_stats.goals_against}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Goals Against
              </div>
            </div>
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-yellow-900 dark:text-white">
                {overall_stats.yellow_cards}
              </div>
              <div class="text-sm text-yellow-600 dark:text-yellow-400">
                Yellow Cards
              </div>
            </div>
            <div
              class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-red-900 dark:text-white">
                {overall_stats.red_cards}
              </div>
              <div class="text-sm text-red-600 dark:text-red-400">
                Red Cards
              </div>
            </div>
          </div>
        </section>
      {/if}

      <!-- Competition Stats and Fixtures -->
      {#if competition_stats.length > 0}
        {#each competition_stats as comp_stat (comp_stat.competition.id)}
          <section
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {comp_stat.competition.name}
            </h2>

            <!-- Competition Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div
                class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {comp_stat.stats.total_matches}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Matches
                </div>
              </div>
              <div
                class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-green-900 dark:text-white">
                  {comp_stat.stats.wins}
                </div>
                <div class="text-sm text-green-600 dark:text-green-400">
                  Wins
                </div>
              </div>
              <div
                class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-yellow-900 dark:text-white">
                  {comp_stat.stats.draws}
                </div>
                <div class="text-sm text-yellow-600 dark:text-yellow-400">
                  Draws
                </div>
              </div>
              <div
                class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-red-900 dark:text-white">
                  {comp_stat.stats.losses}
                </div>
                <div class="text-sm text-red-600 dark:text-red-400">Losses</div>
              </div>
            </div>

            <!-- Upcoming Fixtures -->
            {#if comp_stat.upcoming_fixtures.length > 0}
              <div>
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
                >
                  Upcoming Fixtures
                </h3>
                <div class="space-y-3">
                  {#each comp_stat.upcoming_fixtures as fixture (fixture.id)}
                    <div
                      class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div class="flex-1">
                        <div
                          class="text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {get_full_fixture_display(fixture)}
                        </div>
                        <div
                          class="text-xs text-gray-600 dark:text-gray-400 mt-1"
                        >
                          {format_date(fixture.scheduled_date)}
                          {#if fixture.venue}
                            • {fixture.venue}
                          {/if}
                        </div>
                      </div>
                      <div
                        class="text-xs px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      >
                        {fixture.status}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </section>
        {/each}
      {/if}

      <!-- Empty State -->
      {#if overall_stats.total_matches === 0}
        <section
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-12 text-center"
        >
          <div class="text-6xl mb-4">📊</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Statistics Yet
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Statistics will appear here once the team starts playing matches.
          </p>
        </section>
      {/if}
    </div>
  {/if}
</div>
