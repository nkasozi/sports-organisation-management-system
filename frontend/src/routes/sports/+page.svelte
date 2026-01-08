<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Sport } from "$lib/domain/entities/Sport";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { sportService } from "$lib/services/sportService";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  let sports: Sport[] = [];
  let filtered_sports: Sport[] = [];
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let search_query: string = "";

  let show_delete_modal: boolean = false;
  let sport_to_delete: Sport | null = null;
  let is_deleting: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(() => {
    load_sports();
  });

  async function load_sports(): Promise<void> {
    loading_state = "loading";
    error_message = "";

    const result = await sportService.get_all();

    if (!result.success) {
      loading_state = "error";
      error_message = result.error || "Failed to load sports";
      return;
    }

    sports = result.data || [];
    filtered_sports = filter_sports_by_query(sports, search_query);
    loading_state = "success";
  }

  function filter_sports_by_query(all_sports: Sport[], query: string): Sport[] {
    if (!query.trim()) return all_sports;

    const lower_query = query.toLowerCase();
    return all_sports.filter(
      (sport) =>
        sport.name.toLowerCase().includes(lower_query) ||
        sport.code.toLowerCase().includes(lower_query)
    );
  }

  function handle_search(event: CustomEvent<{ query: string }>): void {
    search_query = event.detail.query;
    filtered_sports = filter_sports_by_query(sports, search_query);
  }

  function navigate_to_create(): void {
    goto("/sports/create");
  }

  function navigate_to_edit(sport: Sport): void {
    goto(`/sports/${sport.id}`);
  }

  function request_delete(sport: Sport): void {
    sport_to_delete = sport;
    show_delete_modal = true;
  }

  async function confirm_delete(): Promise<void> {
    if (!sport_to_delete) return;

    is_deleting = true;
    const result = await sportService.delete(sport_to_delete.id);
    is_deleting = false;

    if (!result.success) {
      show_delete_modal = false;
      show_toast(`Failed to delete sport: ${result.error}`, "error");
      return;
    }

    show_delete_modal = false;
    sport_to_delete = null;
    show_toast("Sport deleted successfully", "success");
    load_sports();
  }

  function cancel_delete(): void {
    show_delete_modal = false;
    sport_to_delete = null;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: Sport["status"]): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "active":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "inactive":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      default:
        return base_classes;
    }
  }

  function format_period_info(sport: Sport): string {
    const period_count = sport.periods.length;
    const total_minutes = sport.periods.reduce(
      (sum, p) => sum + p.duration_minutes,
      0
    );
    return `${period_count} periods, ${total_minutes} min`;
  }

  function format_official_count(sport: Sport): string {
    const total = sport.official_requirements.reduce(
      (sum, r) => sum + r.maximum_count,
      0
    );
    const required = sport.official_requirements
      .filter((r) => r.is_mandatory)
      .reduce((sum, r) => sum + r.minimum_count, 0);
    return `${required} required / ${total} total`;
  }
</script>

<svelte:head>
  <title>Sports - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Sports
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage sports and their game rules
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
      New Sport
    </button>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
      <div class="max-w-md">
        <SearchInput
          placeholder="Search sports..."
          value={search_query}
          is_loading={loading_state === "loading"}
          on:search={handle_search}
        />
      </div>
    </div>

    <LoadingStateWrapper
      state={loading_state}
      {error_message}
      loading_text="Loading sports..."
    >
      {#if filtered_sports.length === 0}
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
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No sports found
          </h3>
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            {search_query
              ? "Try adjusting your search criteria"
              : "Get started by creating a new sport"}
          </p>
          {#if !search_query}
            <button
              type="button"
              class="btn btn-primary mt-4"
              on:click={navigate_to_create}
            >
              Create Sport
            </button>
          {/if}
        </div>
      {:else}
        <div class="hidden md:block overflow-x-auto">
          <table
            class="min-w-full divide-y divide-accent-200 dark:divide-accent-700"
          >
            <thead class="bg-accent-50 dark:bg-accent-900/50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Sport</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Code</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Game Duration</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Officials</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Status</th
                >
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Actions</th
                >
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-accent-800 divide-y divide-accent-200 dark:divide-accent-700"
            >
              {#each filtered_sports as sport}
                <tr class="hover:bg-accent-50 dark:hover:bg-accent-700/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-10 w-10 rounded-lg bg-theme-primary-100 dark:bg-theme-primary-900/30 flex items-center justify-center"
                      >
                        <span
                          class="text-sm font-medium text-theme-primary-700 dark:text-theme-primary-400"
                        >
                          {sport.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div
                          class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          {sport.name}
                        </div>
                        <div
                          class="text-sm text-accent-500 dark:text-accent-400 truncate max-w-xs"
                        >
                          {sport.card_types.length} card types, {sport
                            .foul_categories.length} foul categories
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    <code
                      class="bg-accent-100 dark:bg-accent-700 px-2 py-0.5 rounded"
                      >{sport.code}</code
                    >
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {format_period_info(sport)}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {format_official_count(sport)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={get_status_badge_classes(sport.status)}>
                      {sport.status}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      type="button"
                      class="text-theme-primary-600 hover:text-theme-primary-900 dark:text-theme-primary-400 dark:hover:text-theme-primary-300 mr-4"
                      on:click={() => navigate_to_edit(sport)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => request_delete(sport)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div
          class="md:hidden divide-y divide-accent-200 dark:divide-accent-700"
        >
          {#each filtered_sports as sport}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 rounded-lg bg-theme-primary-100 dark:bg-theme-primary-900/30 flex items-center justify-center flex-shrink-0"
                  >
                    <span
                      class="text-sm font-medium text-theme-primary-700 dark:text-theme-primary-400"
                    >
                      {sport.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div
                      class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                      {sport.name}
                    </div>
                    <div class="text-sm text-accent-500 dark:text-accent-400">
                      <code
                        class="bg-accent-100 dark:bg-accent-700 px-1 py-0.5 rounded text-xs"
                        >{sport.code}</code
                      >
                    </div>
                  </div>
                </div>
                <span class={get_status_badge_classes(sport.status)}>
                  {sport.status}
                </span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div class="text-accent-500 dark:text-accent-400">
                  <span class="font-medium">Duration:</span>
                  {format_period_info(sport)}
                </div>
                <div class="text-accent-500 dark:text-accent-400">
                  <span class="font-medium">Officials:</span>
                  {format_official_count(sport)}
                </div>
              </div>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="flex-1 btn btn-outline text-sm py-1.5"
                  on:click={() => navigate_to_edit(sport)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="flex-1 btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 text-sm py-1.5"
                  on:click={() => request_delete(sport)}
                >
                  Delete
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </LoadingStateWrapper>
  </div>
</div>

<ConfirmationModal
  is_visible={show_delete_modal}
  title="Delete Sport"
  message="Are you sure you want to delete '{sport_to_delete?.name}'? This action cannot be undone and may affect competitions using this sport."
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
