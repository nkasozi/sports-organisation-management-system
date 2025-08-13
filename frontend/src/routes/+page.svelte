<script lang="ts">
  import { onMount } from "svelte";

  let loading = true;
  let stats = {
    organizations: 0,
    competitions: 0,
    teams: 0,
    games: 0,
  };

  onMount(async () => {
    // Simulate loading data
    setTimeout(() => {
      stats = {
        organizations: 12,
        competitions: 8,
        teams: 45,
        games: 23,
      };
      loading = false;
    }, 1000);
  });
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
          Welcome to Sports<span class="text-primary-500">Org</span>
        </h1>
        <p class="text-accent-600 dark:text-accent-300 text-mobile">
          Manage your sports organization with ease. Track competitions, teams,
          and games all in one place.
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button class="btn btn-primary mobile-touch">
          <svg
            class="h-5 w-5 mr-2"
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
          Quick Action
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

    <!-- Games card -->
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            {/if}
          </div>
        </div>
        <div class="ml-4 flex-1 min-w-0">
          <p
            class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate"
          >
            Games
          </p>
          <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
            {loading ? "---" : stats.games}
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
          <div class="flex items-center space-x-4">
            <div
              class="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center"
            >
              <span class="text-primary-500 font-semibold text-sm">FC</span>
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
              >
                Football Championship
              </p>
              <p class="text-xs text-accent-500 dark:text-accent-400">
                Active • 8 teams
              </p>
            </div>
            <span class="status-active px-2 py-1 text-xs rounded-full"
              >Active</span
            >
          </div>

          <div class="flex items-center space-x-4">
            <div
              class="h-10 w-10 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center"
            >
              <span class="text-secondary-500 font-semibold text-sm">BB</span>
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
              >
                Basketball League
              </p>
              <p class="text-xs text-accent-500 dark:text-accent-400">
                Scheduled • 12 teams
              </p>
            </div>
            <span class="status-warning px-2 py-1 text-xs rounded-full"
              >Scheduled</span
            >
          </div>

          <div class="flex items-center space-x-4">
            <div
              class="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"
            >
              <span class="text-green-500 font-semibold text-sm">VB</span>
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
              >
                Volleyball Tournament
              </p>
              <p class="text-xs text-accent-500 dark:text-accent-400">
                Completed • 6 teams
              </p>
            </div>
            <span class="status-inactive px-2 py-1 text-xs rounded-full"
              >Completed</span
            >
          </div>
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
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div
                class="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded flex items-center justify-center"
              >
                <svg
                  class="h-4 w-4 text-primary-500"
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
                  Lions vs Tigers
                </p>
                <p class="text-xs text-accent-500 dark:text-accent-400">
                  Today, 3:00 PM
                </p>
              </div>
            </div>
            <span class="text-xs text-accent-500 dark:text-accent-400"
              >Stadium A</span
            >
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div
                class="h-8 w-8 bg-secondary-100 dark:bg-secondary-900 rounded flex items-center justify-center"
              >
                <svg
                  class="h-4 w-4 text-secondary-500"
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
                  Eagles vs Hawks
                </p>
                <p class="text-xs text-accent-500 dark:text-accent-400">
                  Tomorrow, 2:00 PM
                </p>
              </div>
            </div>
            <span class="text-xs text-accent-500 dark:text-accent-400"
              >Stadium B</span
            >
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div
                class="h-8 w-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center"
              >
                <svg
                  class="h-4 w-4 text-green-500"
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
                  Wolves vs Bears
                </p>
                <p class="text-xs text-accent-500 dark:text-accent-400">
                  Friday, 7:00 PM
                </p>
              </div>
            </div>
            <span class="text-xs text-accent-500 dark:text-accent-400"
              >Main Field</span
            >
          </div>
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
        href="/organizations/create"
        class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch"
      >
        <div
          class="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-3"
        >
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
          class="h-12 w-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center mb-3"
        >
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <span class="text-sm font-medium text-accent-900 dark:text-accent-100"
          >New Competition</span
        >
      </a>

      <a
        href="/teams/create"
        class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch"
      >
        <div
          class="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3"
        >
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
          class="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3"
        >
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
