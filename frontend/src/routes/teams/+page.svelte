<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Team } from "$lib/domain/entities/Team";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { Competition } from "$lib/domain/entities/Competition";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const team_use_cases = get_team_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const competition_use_cases = get_competition_use_cases();

  let teams: Team[] = [];
  let organizations_map: Map<string, Organization> = new Map();
  let competitions_map: Map<string, Competition> = new Map();
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let search_query: string = "";
  let current_page: number = 1;
  let total_pages: number = 1;
  let total_items: number = 0;
  let items_per_page: number = 10;

  let show_delete_modal: boolean = false;
  let team_to_delete: Team | null = null;
  let is_deleting: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(async () => {
    await Promise.all([load_organizations(), load_competitions()]);
    await load_teams();
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
    const result = await competition_use_cases.list_competitions(undefined, {
      page_size: 100,
    });
    if (result.success) {
      competitions_map = new Map(
        result.data.items.map((comp) => [comp.id, comp])
      );
    }
  }

  async function load_teams(): Promise<void> {
    loading_state = "loading";
    error_message = "";

    const filter = search_query ? { name_contains: search_query } : undefined;
    const result = await team_use_cases.list_teams(filter, {
      page_number: current_page,
      page_size: items_per_page,
    });

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    teams = result.data.items;
    total_items = result.data.total_count;
    total_pages = result.data.total_pages;
    loading_state = "success";
  }

  function get_organization_name(organization_id: string): string {
    return organizations_map.get(organization_id)?.name || "Unknown";
  }

  function get_competition_name(competition_id: string | null): string {
    if (!competition_id) return "—";
    return competitions_map.get(competition_id)?.name || "Unknown";
  }

  function handle_search(event: CustomEvent<{ query: string }>): void {
    search_query = event.detail.query;
    current_page = 1;
    load_teams();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_teams();
  }

  function navigate_to_create(): void {
    goto("/teams/create");
  }

  function navigate_to_edit(team: Team): void {
    goto(`/teams/${team.id}`);
  }

  function request_delete(team: Team): void {
    team_to_delete = team;
    show_delete_modal = true;
  }

  async function confirm_delete(): Promise<void> {
    if (!team_to_delete) return;

    is_deleting = true;
    const result = await team_use_cases.delete_team(team_to_delete.id);
    is_deleting = false;

    if (!result.success) {
      show_delete_modal = false;
      show_toast(`Failed to delete team: ${result.error}`, "error");
      return;
    }

    show_delete_modal = false;
    team_to_delete = null;
    show_toast("Team deleted successfully", "success");
    load_teams();
  }

  function cancel_delete(): void {
    show_delete_modal = false;
    team_to_delete = null;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: Team["status"]): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "active":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "inactive":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "suspended":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return base_classes;
    }
  }
</script>

<svelte:head>
  <title>Teams - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Teams
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage teams across your organizations
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
      New Team
    </button>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
      <div class="max-w-md">
        <SearchInput
          placeholder="Search teams..."
          value={search_query}
          is_loading={loading_state === "loading"}
          on:search={handle_search}
        />
      </div>
    </div>

    <LoadingStateWrapper
      state={loading_state}
      {error_message}
      loading_text="Loading teams..."
    >
      {#if teams.length === 0}
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No teams found
          </h3>
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            {search_query
              ? "Try adjusting your search criteria"
              : "Get started by creating a new team"}
          </p>
          {#if !search_query}
            <button
              type="button"
              class="btn btn-primary mt-4"
              on:click={navigate_to_create}
            >
              Create Team
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
                  >Team</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Organization</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Competition</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Coach</th
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
              {#each teams as team}
                <tr class="hover:bg-accent-50 dark:hover:bg-accent-700/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-10 w-10 rounded-lg flex items-center justify-center"
                        style="background-color: {team.team_color}20;"
                      >
                        <span
                          class="text-sm font-bold"
                          style="color: {team.team_color};"
                        >
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div
                          class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          {team.name}
                        </div>
                        <div
                          class="text-sm text-accent-500 dark:text-accent-400"
                        >
                          {team.sport_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {get_organization_name(team.organization_id)}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {get_competition_name(team.competition_id)}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {team.coach_name || "—"}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={get_status_badge_classes(team.status)}>
                      {team.status}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      on:click={() => navigate_to_edit(team)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => request_delete(team)}
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
          {#each teams as team}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style="background-color: {team.team_color}20;"
                  >
                    <span
                      class="text-sm font-bold"
                      style="color: {team.team_color};"
                    >
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div
                      class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                      {team.name}
                    </div>
                    <div class="text-xs text-accent-500 dark:text-accent-400">
                      {team.sport_type}
                    </div>
                  </div>
                </div>
                <span class={get_status_badge_classes(team.status)}>
                  {team.status}
                </span>
              </div>

              <div class="mt-2 text-sm text-accent-600 dark:text-accent-400">
                <div>{get_organization_name(team.organization_id)}</div>
                <div class="text-xs mt-1">Coach: {team.coach_name || "—"}</div>
              </div>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="flex-1 btn btn-outline text-sm py-1.5"
                  on:click={() => navigate_to_edit(team)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="flex-1 btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 text-sm py-1.5"
                  on:click={() => request_delete(team)}
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
  title="Delete Team"
  message="Are you sure you want to delete '{team_to_delete?.name}'? This action cannot be undone."
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
