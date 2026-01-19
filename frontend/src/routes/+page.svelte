<script lang="ts">
  import { onMount } from "svelte";
  import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { reset_all_data } from "$lib/adapters/services/dataResetService";
  import { branding_store } from "$lib/presentation/stores/branding";
  import type { Competition } from "$lib/core/entities/Competition";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import type { Team } from "$lib/core/entities/Team";

  const organization_use_cases = get_organization_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const team_use_cases = get_team_use_cases();
  const player_use_cases = get_player_use_cases();
  const fixture_use_cases = get_fixture_use_cases();

  let loading = true;
  let is_resetting = false;
  let stats = {
    organizations: 0,
    competitions: 0,
    teams: 0,
    players: 0,
  };

  let recent_competitions: Competition[] = [];
  let upcoming_fixtures: Fixture[] = [];
  let teams_map: Map<string, Team> = new Map();

  function get_competition_initials(name: string): string {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function get_status_class(status: string): string {
    switch (status) {
      case "active":
      case "in_progress":
        return "status-active";
      case "upcoming":
      case "scheduled":
        return "status-warning";
      case "completed":
      case "finished":
        return "status-inactive";
      default:
        return "status-inactive";
    }
  }

  function format_fixture_date(scheduled_date: string, scheduled_time: string): string {
    const fixture_date = new Date(scheduled_date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const is_today = fixture_date.toDateString() === today.toDateString();
    const is_tomorrow = fixture_date.toDateString() === tomorrow.toDateString();

    const time_formatted = scheduled_time || "TBD";

    if (is_today) return `Today, ${time_formatted}`;
    if (is_tomorrow) return `Tomorrow, ${time_formatted}`;

    return `${fixture_date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${time_formatted}`;
  }

  function get_team_name(team_id: string): string {
    const team = teams_map.get(team_id);
    return team?.short_name || team?.name || "Unknown";
  }

  onMount(async () => {
    const debug_count = localStorage.getItem("debug_officials_count");
    if (debug_count) {
      console.log("[DEBUG] Officials count after reset:", debug_count);
      const storage_data = localStorage.getItem("sports_org_officials");
      if (storage_data) {
        const officials = JSON.parse(storage_data);
        console.log("[DEBUG] Officials in localStorage:", officials);
      }
      localStorage.removeItem("debug_officials_count");
    }

    const [org_result, comp_result, team_result, player_result, fixture_result] =
      await Promise.all([
        organization_use_cases.list(undefined, { page_number: 1, page_size: 1 }),
        competition_use_cases.list(undefined, { page_number: 1, page_size: 5 }),
        team_use_cases.list(undefined, { page_number: 1, page_size: 100 }),
        player_use_cases.list(undefined, { page_number: 1, page_size: 1 }),
        fixture_use_cases.list({ status: "scheduled" }, { page_number: 1, page_size: 5 }),
      ]);

    stats = {
      organizations: org_result.success ? org_result.total_count : 0,
      competitions: comp_result.success ? comp_result.total_count : 0,
      teams: team_result.success ? team_result.total_count : 0,
      players: player_result.success ? player_result.total_count : 0,
    };

    if (comp_result.success && comp_result.data) {
      recent_competitions = comp_result.data.slice(0, 3);
    }

    if (team_result.success && team_result.data) {
      teams_map = new Map(team_result.data.map((team: Team) => [team.id, team]));
    }

    if (fixture_result.success && fixture_result.data) {
      upcoming_fixtures = fixture_result.data
        .sort((a: Fixture, b: Fixture) =>
          new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        )
        .slice(0, 3);
    }

    loading = false;
  });

  async function handle_reset_data(): Promise<boolean> {
    if (is_resetting) return false;
    is_resetting = true;
    const reset_result = await reset_all_data();
    if (!reset_result) {
      is_resetting = false;
      return false;
    }
    window.location.reload();
    return true;
  }
</script>

<svelte:head>
  <title>Dashboard - Sports Organisation Management</title>
  <meta
    name="description"
    content="Overview of your sports organization management system"
  />
</svelte:head>

<div class="space-y-6">
  <!-- Page header -->
  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
  >
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1
          class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2"
        >
          Welcome to <span class="text-secondary-600">{$branding_store.organization_name}</span>
        </h1>
        <p class="text-accent-600 dark:text-accent-300 text-mobile">
          Track competitions, teams, players, officials and fixtures for your sport all in one place.
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
          class="btn btn-secondary mobile-touch"
          on:click={handle_reset_data}
          disabled={is_resetting}
        >
          {#if is_resetting}
            Resetting...
          {:else}
            Reset Demo Data
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Stats cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Organizations card -->
    <div class="card p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div
            class="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center"
          >
            {#if loading}
              <div class="loading-spinner h-6 w-6"></div>
            {:else}
              <svg
                class="h-6 w-6 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            {/if}
          </div>
        </div>
        <div class="ml-4 flex-1 min-w-0">
          <p
            class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate"
          >
            Organizations
          </p>
          <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
            {loading ? "---" : stats.organizations}
          </p>
        </div>
      </div>
    </div>

    <!-- Competitions card -->
    <div class="card p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div
            class="h-12 w-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center"
          >
            {#if loading}
              <div class="loading-spinner h-6 w-6"></div>
            {:else}
              <svg
                class="h-6 w-6 text-secondary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            {/if}
          </div>
        </div>
        <div class="ml-4 flex-1 min-w-0">
          <p
            class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate"
          >
            Competitions
          </p>
          <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
            {loading ? "---" : stats.competitions}
          </p>
        </div>
      </div>
    </div>

    <!-- Teams card -->
    <div class="card p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div
            class="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"
          >
            {#if loading}
              <div class="loading-spinner h-6 w-6"></div>
            {:else}
              <svg
                class="h-6 w-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            {/if}
          </div>
        </div>
        <div class="ml-4 flex-1 min-w-0">
          <p
            class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate"
          >
            Teams
          </p>
          <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
            {loading ? "---" : stats.teams}
          </p>
        </div>
      </div>
    </div>

    <!-- Players card -->
    <div class="card p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div
            class="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"
          >
            {#if loading}
              <div class="loading-spinner h-6 w-6"></div>
            {:else}
              <svg
                class="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            {/if}
          </div>
        </div>
        <div class="ml-4 flex-1 min-w-0">
          <p
            class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate"
          >
            Players
          </p>
          <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
            {loading ? "---" : stats.players}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent activity -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Recent competitions -->
    <div class="card p-6">
      <h2
        class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
      >
        Recent Competitions
      </h2>
      <div class="space-y-4">
        {#if loading}
          {#each Array(3) as _}
            <div class="animate-pulse">
              <div class="flex items-center space-x-4">
                <div
                  class="h-10 w-10 bg-accent-200 dark:bg-accent-700 rounded-lg"
                ></div>
                <div class="flex-1 space-y-2">
                  <div
                    class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-3/4"
                  ></div>
                  <div
                    class="h-3 bg-accent-200 dark:bg-accent-700 rounded w-1/2"
                  ></div>
                </div>
              </div>
            </div>
          {/each}
        {:else}
          {#if recent_competitions.length === 0}
            <div class="text-center py-4">
              <p class="text-sm text-accent-500 dark:text-accent-400">
                No competitions yet. <a href="/competitions/create" class="text-primary-500 hover:underline">Create one</a>
              </p>
            </div>
          {:else}
            {#each recent_competitions as competition, index}
              <div class="flex items-center space-x-4">
                <div
                  class="h-10 w-10 rounded-lg flex items-center justify-center {index === 0 ? 'bg-primary-100 dark:bg-primary-900' : index === 1 ? 'bg-secondary-100 dark:bg-secondary-900' : 'bg-green-100 dark:bg-green-900'}"
                >
                  <span class="{index === 0 ? 'text-primary-500' : index === 1 ? 'text-secondary-500' : 'text-green-500'} font-semibold text-sm">
                    {get_competition_initials(competition.name)}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                  >
                    {competition.name}
                  </p>
                  <p class="text-xs text-accent-500 dark:text-accent-400">
                    {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)} • {competition.team_ids?.length || 0} teams
                  </p>
                </div>
                <span class="{get_status_class(competition.status)} px-2 py-1 text-xs rounded-full">
                  {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                </span>
              </div>
            {/each}
          {/if}
        {/if}
      </div>
    </div>

    <!-- Upcoming games -->
    <div class="card p-6">
      <h2
        class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
      >
        Upcoming Games
      </h2>
      <div class="space-y-4">
        {#if loading}
          {#each Array(3) as _}
            <div class="animate-pulse">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div
                    class="h-8 w-8 bg-accent-200 dark:bg-accent-700 rounded"
                  ></div>
                  <div class="space-y-1">
                    <div
                      class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-20"
                    ></div>
                    <div
                      class="h-3 bg-accent-200 dark:bg-accent-700 rounded w-16"
                    ></div>
                  </div>
                </div>
                <div
                  class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-16"
                ></div>
              </div>
            </div>
          {/each}
        {:else}
          {#if upcoming_fixtures.length === 0}
            <div class="text-center py-4">
              <p class="text-sm text-accent-500 dark:text-accent-400">
                No upcoming fixtures. <a href="/fixtures?action=create" class="text-primary-500 hover:underline">Schedule one</a>
              </p>
            </div>
          {:else}
            {#each upcoming_fixtures as fixture, index}
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div
                    class="h-8 w-8 rounded flex items-center justify-center {index === 0 ? 'bg-primary-100 dark:bg-primary-900' : index === 1 ? 'bg-secondary-100 dark:bg-secondary-900' : 'bg-green-100 dark:bg-green-900'}"
                  >
                    <svg
                      class="h-4 w-4 {index === 0 ? 'text-primary-500' : index === 1 ? 'text-secondary-500' : 'text-green-500'}"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                      {get_team_name(fixture.home_team_id)} vs {get_team_name(fixture.away_team_id)}
                    </p>
                    <p class="text-xs text-accent-500 dark:text-accent-400">
                      {format_fixture_date(fixture.scheduled_date, fixture.scheduled_time)}
                    </p>
                  </div>
                </div>
                <span class="text-xs text-accent-500 dark:text-accent-400">
                  {fixture.venue || "TBD"}
                </span>
              </div>
            {/each}
          {/if}
        {/if}
      </div>
    </div>
  </div>

  <!-- Quick actions -->
  <div class="card p-6">
    <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4">
      Quick Actions
    </h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <a
        href="/organizations?action=create"
        class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch"
      >
        <div
          class="h-12 w-12 bg-secondary-500 rounded-lg flex items-center justify-center mb-3"
        >
          <svg
            class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <span class="text-sm font-medium text-accent-900 dark:text-accent-100"
          >Add Organization</span
        >
      </a>

      <a
        href="/competitions/create"
        class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch"
      >
        <div
          class="h-12 w-12 bg-secondary-600 rounded-lg flex items-center justify-center mb-3"
        >
          <svg
            class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <span class="text-sm font-medium text-accent-900 dark:text-accent-100"
          >New Competition</span
        >
      </a>

      <a
        href="/teams?action=create"
        class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch"
      >
        <div
          class="h-12 w-12 bg-secondary-700 rounded-lg flex items-center justify-center mb-3"
        >
          <svg
            class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <span class="text-sm font-medium text-accent-900 dark:text-accent-100"
          >Add Team</span
        >
      </a>

      <a
        href="/games/create"
        class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch"
      >
        <div
          class="h-12 w-12 bg-secondary-800 rounded-lg flex items-center justify-center mb-3"
        >
          <svg
            class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <span class="text-sm font-medium text-accent-900 dark:text-accent-100"
          >Schedule Game</span
        >
      </a>
    </div>
  </div>
</div>

<style>
  /* Additional mobile optimizations */
  @media (max-width: 640px) {
    .card {
      padding: 1rem;
    }

    .grid {
      gap: 1rem;
    }
  }

  /* Smooth animations */
  .card {
    transition: all 0.2s ease-in-out;
  }

  .card:hover {
    transform: translateY(-1px);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  /* Loading animation improvements */
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
