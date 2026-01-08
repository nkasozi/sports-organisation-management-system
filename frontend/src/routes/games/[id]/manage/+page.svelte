<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type { Fixture } from "$lib/domain/entities/Fixture";
  import type { Team } from "$lib/domain/entities/Team";
  import { get_fixture_use_cases } from "$lib/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import Toast from "$lib/components/ui/Toast.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";

  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();

  let fixture: Fixture | null = null;
  let home_team: Team | null = null;
  let away_team: Team | null = null;
  let is_loading: boolean = true;
  let error_message: string = "";
  let is_updating: boolean = false;

  let home_score: number = 0;
  let away_score: number = 0;

  let show_start_modal: boolean = false;
  let show_end_modal: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: fixture_id = $page.params.id ?? "";

  onMount(async () => {
    if (!fixture_id) {
      error_message = "No fixture ID provided";
      is_loading = false;
      return;
    }
    await load_fixture();
  });

  async function load_fixture(): Promise<void> {
    is_loading = true;
    error_message = "";

    const result = await fixture_use_cases.get_fixture(fixture_id);

    if (!result.success) {
      error_message = result.error;
      is_loading = false;
      return;
    }

    fixture = result.data;
    home_score = fixture.home_team_score ?? 0;
    away_score = fixture.away_team_score ?? 0;

    const [home_result, away_result] = await Promise.all([
      team_use_cases.get_team(fixture.home_team_id),
      team_use_cases.get_team(fixture.away_team_id),
    ]);

    if (home_result.success) home_team = home_result.data;
    if (away_result.success) away_team = away_result.data;

    is_loading = false;
  }

  async function update_score(): Promise<void> {
    if (!fixture) return;

    is_updating = true;

    const result = await fixture_use_cases.update_fixture_score(
      fixture.id,
      home_score,
      away_score
    );

    is_updating = false;

    if (!result.success) {
      show_toast(`Failed to update score: ${result.error}`, "error");
      return;
    }

    fixture = result.data;
    show_toast("Score updated!", "success");
  }

  function increment_home_score(): void {
    home_score++;
    update_score();
  }

  function decrement_home_score(): void {
    if (home_score > 0) {
      home_score--;
      update_score();
    }
  }

  function increment_away_score(): void {
    away_score++;
    update_score();
  }

  function decrement_away_score(): void {
    if (away_score > 0) {
      away_score--;
      update_score();
    }
  }

  async function start_game(): Promise<void> {
    if (!fixture) return;

    is_updating = true;

    const result = await fixture_use_cases.update_fixture(fixture.id, {
      status: "in_progress",
    });

    is_updating = false;
    show_start_modal = false;

    if (!result.success) {
      show_toast(`Failed to start game: ${result.error}`, "error");
      return;
    }

    fixture = result.data;
    show_toast("Game started!", "success");
  }

  async function end_game(): Promise<void> {
    if (!fixture) return;

    is_updating = true;

    const result = await fixture_use_cases.update_fixture(fixture.id, {
      status: "completed",
      home_team_score: home_score,
      away_team_score: away_score,
    });

    is_updating = false;
    show_end_modal = false;

    if (!result.success) {
      show_toast(`Failed to end game: ${result.error}`, "error");
      return;
    }

    fixture = result.data;
    show_toast("Game completed!", "success");
  }

  function navigate_back(): void {
    goto("/games");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_display(status: string): string {
    switch (status) {
      case "scheduled":
        return "Not Started";
      case "in_progress":
        return "Live";
      case "completed":
        return "Final";
      case "postponed":
        return "Postponed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  }

  function get_status_classes(status: string): string {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "in_progress":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 animate-pulse";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "postponed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
</script>

<svelte:head>
  <title>
    {fixture
      ? `${home_team?.name ?? "Home"} vs ${away_team?.name ?? "Away"}`
      : "Game Management"} - Sports Management
  </title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
      on:click={navigate_back}
      aria-label="Go back"
    >
      <svg
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Game Management
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Live scoring and game controls
      </p>
    </div>
  </div>

  {#if is_loading}
    <div class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
      ></div>
    </div>
  {:else if error_message}
    <div
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
    >
      <svg
        class="h-12 w-12 text-red-400 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
        Error Loading Game
      </h3>
      <p class="text-red-600 dark:text-red-400">{error_message}</p>
      <button
        type="button"
        class="btn btn-outline mt-4"
        on:click={navigate_back}
      >
        Back to Games
      </button>
    </div>
  {:else if fixture}
    <div
      class="bg-white dark:bg-accent-800 rounded-xl shadow-lg border border-accent-200 dark:border-accent-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-accent-50 dark:bg-accent-900/50 border-b border-accent-200 dark:border-accent-700 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <span
            class="px-3 py-1 rounded-full text-sm font-medium {get_status_classes(
              fixture.status
            )}"
          >
            {get_status_display(fixture.status)}
          </span>
          {#if fixture.round_name}
            <span class="text-accent-600 dark:text-accent-400">
              {fixture.round_name}
            </span>
          {/if}
        </div>
        <div class="text-sm text-accent-600 dark:text-accent-400">
          {fixture.venue || "Venue TBD"}
        </div>
      </div>

      <div class="p-8">
        <div class="grid grid-cols-3 gap-8 items-center">
          <div class="text-center">
            <div
              class="w-20 h-20 mx-auto bg-accent-100 dark:bg-accent-700 rounded-full flex items-center justify-center mb-4"
            >
              <span
                class="text-2xl font-bold text-accent-600 dark:text-accent-300"
              >
                {home_team?.name?.charAt(0) ?? "H"}
              </span>
            </div>
            <h3
              class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
              {home_team?.name ?? "Home Team"}
            </h3>
            <p class="text-sm text-accent-500 dark:text-accent-400">Home</p>
          </div>

          <div class="text-center">
            <div
              class="flex items-center justify-center gap-4 text-5xl font-bold text-accent-900 dark:text-accent-100"
            >
              <span>{home_score}</span>
              <span class="text-accent-400">-</span>
              <span>{away_score}</span>
            </div>
            {#if fixture.scheduled_date}
              <p class="text-sm text-accent-500 dark:text-accent-400 mt-2">
                {new Date(fixture.scheduled_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                {#if fixture.scheduled_time}
                  at {fixture.scheduled_time}
                {/if}
              </p>
            {/if}
          </div>

          <div class="text-center">
            <div
              class="w-20 h-20 mx-auto bg-accent-100 dark:bg-accent-700 rounded-full flex items-center justify-center mb-4"
            >
              <span
                class="text-2xl font-bold text-accent-600 dark:text-accent-300"
              >
                {away_team?.name?.charAt(0) ?? "A"}
              </span>
            </div>
            <h3
              class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
              {away_team?.name ?? "Away Team"}
            </h3>
            <p class="text-sm text-accent-500 dark:text-accent-400">Away</p>
          </div>
        </div>

        {#if fixture.status === "in_progress"}
          <div
            class="mt-8 pt-8 border-t border-accent-200 dark:border-accent-700"
          >
            <h4
              class="text-center text-sm font-medium text-accent-700 dark:text-accent-300 mb-6"
            >
              Score Controls
            </h4>
            <div class="grid grid-cols-2 gap-8">
              <div class="flex items-center justify-center gap-4">
                <button
                  type="button"
                  class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors disabled:opacity-50"
                  on:click={decrement_home_score}
                  disabled={is_updating || home_score === 0}
                  aria-label="Decrease home score"
                >
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <span
                  class="text-xl font-medium text-accent-700 dark:text-accent-300"
                >
                  {home_team?.name ?? "Home"}
                </span>
                <button
                  type="button"
                  class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center justify-center transition-colors disabled:opacity-50"
                  on:click={increment_home_score}
                  disabled={is_updating}
                  aria-label="Increase home score"
                >
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>

              <div class="flex items-center justify-center gap-4">
                <button
                  type="button"
                  class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors disabled:opacity-50"
                  on:click={decrement_away_score}
                  disabled={is_updating || away_score === 0}
                  aria-label="Decrease away score"
                >
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <span
                  class="text-xl font-medium text-accent-700 dark:text-accent-300"
                >
                  {away_team?.name ?? "Away"}
                </span>
                <button
                  type="button"
                  class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center justify-center transition-colors disabled:opacity-50"
                  on:click={increment_away_score}
                  disabled={is_updating}
                  aria-label="Increase away score"
                >
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div
        class="px-6 py-4 bg-accent-50 dark:bg-accent-900/50 border-t border-accent-200 dark:border-accent-700"
      >
        <div class="flex flex-col sm:flex-row justify-center gap-3">
          {#if fixture.status === "scheduled"}
            <button
              type="button"
              class="btn bg-green-600 hover:bg-green-700 text-white"
              on:click={() => (show_start_modal = true)}
              disabled={is_updating}
            >
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Start Game
            </button>
          {:else if fixture.status === "in_progress"}
            <button
              type="button"
              class="btn bg-red-600 hover:bg-red-700 text-white"
              on:click={() => (show_end_modal = true)}
              disabled={is_updating}
            >
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
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              End Game
            </button>
          {:else if fixture.status === "completed"}
            <div class="text-center text-accent-600 dark:text-accent-400 py-2">
              This game has been completed
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<ConfirmationModal
  is_visible={show_start_modal}
  title="Start Game"
  message="Are you sure you want to start this game? The status will change to 'In Progress'."
  confirm_text="Start Game"
  is_processing={is_updating}
  on:confirm={start_game}
  on:cancel={() => (show_start_modal = false)}
/>

<ConfirmationModal
  is_visible={show_end_modal}
  title="End Game"
  message="Are you sure you want to end this game with the current score of {home_score} - {away_score}?"
  confirm_text="End Game"
  is_destructive
  is_processing={is_updating}
  on:confirm={end_game}
  on:cancel={() => (show_end_modal = false)}
/>

<Toast
  bind:is_visible={toast_visible}
  message={toast_message}
  type={toast_type}
  on:dismiss={() => (toast_visible = false)}
/>
