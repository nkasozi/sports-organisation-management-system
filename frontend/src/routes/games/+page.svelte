<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Fixture } from "$lib/domain/entities/Fixture";
  import type { Competition } from "$lib/domain/entities/Competition";
  import type { Team } from "$lib/domain/entities/Team";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_fixture_use_cases } from "$lib/usecases/FixtureUseCases";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { FIXTURE_STATUS_OPTIONS } from "$lib/domain/entities/Fixture";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const fixture_use_cases = get_fixture_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const team_use_cases = get_team_use_cases();

  let fixtures: Fixture[] = [];
  let competitions: Competition[] = [];
  let teams_map: Map<string, Team> = new Map();
  let competitions_map: Map<string, Competition> = new Map();
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let selected_competition_id: string = "";
  let selected_status: string = "";
  let current_page: number = 1;
  let total_pages: number = 1;
  let total_items: number = 0;
  let items_per_page: number = 10;

  let show_delete_modal: boolean = false;
  let fixture_to_delete: Fixture | null = null;
  let is_deleting: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(async () => {
    await load_reference_data();
    await load_fixtures();
  });

  async function load_reference_data(): Promise<void> {
    const [comp_result, teams_result] = await Promise.all([
      competition_use_cases.list_competitions(undefined, { page_size: 100 }),
      team_use_cases.list_teams(undefined, { page_size: 200 }),
    ]);

    if (comp_result.success) {
      competitions = comp_result.data.items;
      competitions_map = new Map(competitions.map((c) => [c.id, c]));
    }

    if (teams_result.success) {
      teams_map = new Map(teams_result.data.items.map((t) => [t.id, t]));
    }
  }

  async function load_fixtures(): Promise<void> {
    loading_state = "loading";
    error_message = "";

    const filter: Record<string, string | undefined> = {};
    if (selected_competition_id) {
      filter.competition_id = selected_competition_id;
    }
    if (selected_status) {
      filter.status = selected_status;
    }

    const result = await fixture_use_cases.list_fixtures(
      Object.keys(filter).length > 0 ? filter : undefined,
      { page_number: current_page, page_size: items_per_page }
    );

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    fixtures = result.data.items;
    total_items = result.data.total_count;
    total_pages = result.data.total_pages;
    loading_state = "success";
  }

  function get_team_name(team_id: string): string {
    return teams_map.get(team_id)?.name || "Unknown Team";
  }

  function get_competition_name(competition_id: string): string {
    return competitions_map.get(competition_id)?.name || "Unknown Competition";
  }

  function handle_competition_filter_change(event: Event): void {
    const target = event.target as HTMLSelectElement;
    selected_competition_id = target.value;
    current_page = 1;
    load_fixtures();
  }

  function handle_status_filter_change(event: Event): void {
    const target = event.target as HTMLSelectElement;
    selected_status = target.value;
    current_page = 1;
    load_fixtures();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_fixtures();
  }

  function navigate_to_create(): void {
    goto("/games/create");
  }

  function navigate_to_manage(fixture: Fixture): void {
    goto(`/games/${fixture.id}/manage`);
  }

  function request_delete(fixture: Fixture): void {
    fixture_to_delete = fixture;
    show_delete_modal = true;
  }

  async function confirm_delete(): Promise<void> {
    if (!fixture_to_delete) return;

    is_deleting = true;
    const result = await fixture_use_cases.delete_fixture(fixture_to_delete.id);
    is_deleting = false;

    if (!result.success) {
      show_delete_modal = false;
      show_toast(`Failed to delete fixture: ${result.error}`, "error");
      return;
    }

    show_delete_modal = false;
    fixture_to_delete = null;
    show_toast("Fixture deleted successfully", "success");
    load_fixtures();
  }

  function cancel_delete(): void {
    show_delete_modal = false;
    fixture_to_delete = null;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: string): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "scheduled":
        return `${base_classes} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case "in_progress":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "completed":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "postponed":
        return `${base_classes} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case "cancelled":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return base_classes;
    }
  }

  function format_date(date_string: string): string {
    if (!date_string) return "—";
    return new Date(date_string).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function format_time(time_string: string): string {
    if (!time_string) return "—";
    const [hours, minutes] = time_string.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display_hour = hour % 12 || 12;
    return `${display_hour}:${minutes} ${ampm}`;
  }

  function get_score_display(fixture: Fixture): string {
    if (fixture.home_team_score === null || fixture.away_team_score === null) {
      return "vs";
    }
    return `${fixture.home_team_score} - ${fixture.away_team_score}`;
  }
</script>

<svelte:head>
  <title>Fixtures & Games - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Fixtures & Games
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage matches, schedules, and results
      </p>
    </div>

    <button
      type="button"
      class="btn btn-primary w-full sm:w-auto"
      on:click={navigate_to_create}
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
          d="M12 4v16m8-8H4"
        />
      </svg>
      New Fixture
    </button>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1 max-w-xs">
          <label for="competition_filter" class="sr-only"
            >Filter by Competition</label
          >
          <select
            id="competition_filter"
            class="input w-full"
            value={selected_competition_id}
            on:change={handle_competition_filter_change}
          >
            <option value="">All Competitions</option>
            {#each competitions as competition}
              <option value={competition.id}>{competition.name}</option>
            {/each}
          </select>
        </div>

        <div class="w-full sm:w-48">
          <label for="status_filter" class="sr-only">Filter by Status</label>
          <select
            id="status_filter"
            class="input w-full"
            value={selected_status}
            on:change={handle_status_filter_change}
          >
            <option value="">All Statuses</option>
            {#each FIXTURE_STATUS_OPTIONS as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <LoadingStateWrapper
      state={loading_state}
      {error_message}
      loading_text="Loading fixtures..."
    >
      {#if fixtures.length === 0}
        <div class="text-center py-12">
          <svg
            class="mx-auto h-12 w-12 text-accent-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No fixtures found
          </h3>
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            {selected_competition_id || selected_status
              ? "Try adjusting your filters"
              : "Get started by creating a new fixture or generating a schedule"}
          </p>
          {#if !selected_competition_id && !selected_status}
            <button
              type="button"
              class="btn btn-primary mt-4"
              on:click={navigate_to_create}
            >
              Create Fixture
            </button>
          {/if}
        </div>
      {:else}
        <div class="divide-y divide-accent-200 dark:divide-accent-700">
          {#each fixtures as fixture}
            <div class="p-4 hover:bg-accent-50 dark:hover:bg-accent-700/30">
              <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                <div class="flex-1">
                  <div
                    class="flex items-center gap-2 text-xs text-accent-500 dark:text-accent-400 mb-2"
                  >
                    <span>{get_competition_name(fixture.competition_id)}</span>
                    <span>•</span>
                    <span>{fixture.round_name}</span>
                  </div>

                  <div
                    class="flex items-center justify-between lg:justify-start gap-4"
                  >
                    <div
                      class="flex-1 text-right lg:text-right lg:flex-initial lg:w-40"
                    >
                      <div
                        class="font-medium text-accent-900 dark:text-accent-100"
                      >
                        {get_team_name(fixture.home_team_id)}
                      </div>
                      <div class="text-xs text-accent-500 dark:text-accent-400">
                        Home
                      </div>
                    </div>

                    <div
                      class="flex-shrink-0 px-4 py-2 bg-accent-100 dark:bg-accent-700 rounded-lg text-center min-w-[80px]"
                    >
                      <div
                        class="font-bold text-lg text-accent-900 dark:text-accent-100"
                      >
                        {get_score_display(fixture)}
                      </div>
                      <div class="text-xs text-accent-500 dark:text-accent-400">
                        {format_time(fixture.scheduled_time)}
                      </div>
                    </div>

                    <div class="flex-1 text-left lg:flex-initial lg:w-40">
                      <div
                        class="font-medium text-accent-900 dark:text-accent-100"
                      >
                        {get_team_name(fixture.away_team_id)}
                      </div>
                      <div class="text-xs text-accent-500 dark:text-accent-400">
                        Away
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4"
                >
                  <div
                    class="flex items-center gap-2 text-sm text-accent-600 dark:text-accent-400"
                  >
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{format_date(fixture.scheduled_date)}</span>
                  </div>

                  <span class={get_status_badge_classes(fixture.status)}>
                    {FIXTURE_STATUS_OPTIONS.find(
                      (o) => o.value === fixture.status
                    )?.label || fixture.status}
                  </span>

                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn btn-outline text-sm py-1.5 px-3"
                      on:click={() => navigate_to_manage(fixture)}
                    >
                      {fixture.status === "scheduled"
                        ? "Start"
                        : fixture.status === "in_progress"
                          ? "Manage"
                          : "View"}
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      on:click={() => request_delete(fixture)}
                      aria-label="Delete fixture"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {#if fixture.venue}
                <div
                  class="mt-2 flex items-center gap-1 text-xs text-accent-500 dark:text-accent-400"
                >
                  <svg
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{fixture.venue}</span>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <Pagination
          {current_page}
          {total_pages}
          {total_items}
          {items_per_page}
          is_loading={loading_state === "loading"}
          on:page_change={handle_page_change}
        />
      {/if}
    </LoadingStateWrapper>
  </div>
</div>

<ConfirmationModal
  is_visible={show_delete_modal}
  title="Delete Fixture"
  message="Are you sure you want to delete this fixture? This action cannot be undone."
  confirm_text="Delete"
  is_destructive={true}
  is_processing={is_deleting}
  on:confirm={confirm_delete}
  on:cancel={cancel_delete}
/>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
