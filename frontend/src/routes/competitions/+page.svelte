<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Competition } from "$lib/domain/entities/Competition";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const competition_use_cases = get_competition_use_cases();
  const organization_use_cases = get_organization_use_cases();

  let competitions: Competition[] = [];
  let organizations_map: Map<string, Organization> = new Map();
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let search_query: string = "";
  let current_page: number = 1;
  let total_pages: number = 1;
  let total_items: number = 0;
  let items_per_page: number = 10;

  let show_delete_modal: boolean = false;
  let competition_to_delete: Competition | null = null;
  let is_deleting: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(async () => {
    await load_organizations();
    await load_competitions();
  });

  async function load_organizations(): Promise<void> {
    const result = await organization_use_cases.list_organizations(undefined, {
      page_size: 100,
    });
    if (result.success) {
      organizations_map = new Map(
        result.data.items.map((org) => [org.id, org])
      );
    }
  }

  async function load_competitions(): Promise<void> {
    loading_state = "loading";
    error_message = "";

    const filter = search_query ? { name_contains: search_query } : undefined;
    const result = await competition_use_cases.list_competitions(filter, {
      page_number: current_page,
      page_size: items_per_page,
    });

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    competitions = result.data.items;
    total_items = result.data.total_count;
    total_pages = result.data.total_pages;
    loading_state = "success";
  }

  function get_organization_name(organization_id: string): string {
    return organizations_map.get(organization_id)?.name || "Unknown";
  }

  function handle_search(event: CustomEvent<{ query: string }>): void {
    search_query = event.detail.query;
    current_page = 1;
    load_competitions();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_competitions();
  }

  function navigate_to_create(): void {
    goto("/competitions/create");
  }

  function navigate_to_edit(competition: Competition): void {
    goto(`/competitions/${competition.id}`);
  }

  function request_delete(competition: Competition): void {
    competition_to_delete = competition;
    show_delete_modal = true;
  }

  async function confirm_delete(): Promise<void> {
    if (!competition_to_delete) return;

    is_deleting = true;
    const result = await competition_use_cases.delete_competition(
      competition_to_delete.id
    );
    is_deleting = false;

    if (!result.success) {
      show_delete_modal = false;
      show_toast(`Failed to delete competition: ${result.error}`, "error");
      return;
    }

    show_delete_modal = false;
    competition_to_delete = null;
    show_toast("Competition deleted successfully", "success");
    load_competitions();
  }

  function cancel_delete(): void {
    show_delete_modal = false;
    competition_to_delete = null;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: Competition["status"]): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "active":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "upcoming":
        return `${base_classes} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case "completed":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "cancelled":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return base_classes;
    }
  }

  function format_date(date_string: string): string {
    if (!date_string) return "—";
    return new Date(date_string).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<svelte:head>
  <title>Competitions - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Competitions
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage tournaments, leagues, and championships
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
      New Competition
    </button>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
      <div class="max-w-md">
        <SearchInput
          placeholder="Search competitions..."
          value={search_query}
          is_loading={loading_state === "loading"}
          on:search={handle_search}
        />
      </div>
    </div>

    <LoadingStateWrapper
      state={loading_state}
      {error_message}
      loading_text="Loading competitions..."
    >
      {#if competitions.length === 0}
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No competitions found
          </h3>
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            {search_query
              ? "Try adjusting your search criteria"
              : "Get started by creating a new competition"}
          </p>
          {#if !search_query}
            <button
              type="button"
              class="btn btn-primary mt-4"
              on:click={navigate_to_create}
            >
              Create Competition
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
                  >Competition</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Organization</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Dates</th
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
              {#each competitions as competition}
                <tr class="hover:bg-accent-50 dark:hover:bg-accent-700/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-10 w-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center"
                      >
                        <svg
                          class="h-5 w-5 text-secondary-600 dark:text-secondary-400"
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
                      </div>
                      <div class="ml-4">
                        <div
                          class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          {competition.name}
                        </div>
                        <div
                          class="text-sm text-accent-500 dark:text-accent-400"
                        >
                          {competition.competition_type} • {competition.sport_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {get_organization_name(competition.organization_id)}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {format_date(competition.start_date)} — {format_date(
                      competition.end_date
                    )}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={get_status_badge_classes(competition.status)}>
                      {competition.status}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      on:click={() => navigate_to_edit(competition)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => request_delete(competition)}
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
          {#each competitions as competition}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div>
                  <div
                    class="text-sm font-medium text-accent-900 dark:text-accent-100"
                  >
                    {competition.name}
                  </div>
                  <div
                    class="text-xs text-accent-500 dark:text-accent-400 mt-1"
                  >
                    {competition.competition_type} • {competition.sport_type}
                  </div>
                </div>
                <span class={get_status_badge_classes(competition.status)}>
                  {competition.status}
                </span>
              </div>

              <div class="mt-2 text-sm text-accent-600 dark:text-accent-400">
                <div>{get_organization_name(competition.organization_id)}</div>
                <div class="text-xs mt-1">
                  {format_date(competition.start_date)} — {format_date(
                    competition.end_date
                  )}
                </div>
              </div>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="flex-1 btn btn-outline text-sm py-1.5"
                  on:click={() => navigate_to_edit(competition)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="flex-1 btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 text-sm py-1.5"
                  on:click={() => request_delete(competition)}
                >
                  Delete
                </button>
              </div>
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
  title="Delete Competition"
  message="Are you sure you want to delete '{competition_to_delete?.name}'? This action cannot be undone."
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
