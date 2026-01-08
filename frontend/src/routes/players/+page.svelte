<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Player } from "$lib/domain/entities/Player";
  import type { Team } from "$lib/domain/entities/Team";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_player_use_cases } from "$lib/usecases/PlayerUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const player_use_cases = get_player_use_cases();
  const team_use_cases = get_team_use_cases();

  let players: Player[] = [];
  let teams_map: Map<string, Team> = new Map();
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let search_query: string = "";
  let current_page: number = 1;
  let total_pages: number = 1;
  let total_items: number = 0;
  let items_per_page: number = 10;

  let show_delete_modal: boolean = false;
  let player_to_delete: Player | null = null;
  let is_deleting: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(async () => {
    await load_teams();
    await load_players();
  });

  async function load_teams(): Promise<void> {
    const result = await team_use_cases.list_teams(undefined, {
      page_size: 100,
    });
    if (result.success) {
      teams_map = new Map(result.data.items.map((team) => [team.id, team]));
    }
  }

  async function load_players(): Promise<void> {
    loading_state = "loading";
    error_message = "";

    const filter = search_query ? { name_contains: search_query } : undefined;
    const result = await player_use_cases.list_players(filter, {
      page_number: current_page,
      page_size: items_per_page,
    });

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    players = result.data.items;
    total_items = result.data.total_count;
    total_pages = result.data.total_pages;
    loading_state = "success";
  }

  function get_team_name(team_id: string | null): string {
    if (!team_id) return "Unassigned";
    return teams_map.get(team_id)?.name || "Unknown";
  }

  function format_date(date_string: string): string {
    return new Date(date_string).toLocaleDateString();
  }

  function calculate_age(date_of_birth: string): number {
    const today = new Date();
    const birth_date = new Date(date_of_birth);
    let age = today.getFullYear() - birth_date.getFullYear();
    const month_diff = today.getMonth() - birth_date.getMonth();
    if (
      month_diff < 0 ||
      (month_diff === 0 && today.getDate() < birth_date.getDate())
    ) {
      age--;
    }
    return age;
  }

  function handle_search(event: CustomEvent<{ query: string }>): void {
    search_query = event.detail.query;
    current_page = 1;
    load_players();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_players();
  }

  function navigate_to_create(): void {
    goto("/players/create");
  }

  function navigate_to_edit(player: Player): void {
    goto(`/players/${player.id}`);
  }

  function request_delete(player: Player): void {
    player_to_delete = player;
    show_delete_modal = true;
  }

  async function confirm_delete(): Promise<void> {
    if (!player_to_delete) return;

    is_deleting = true;
    const result = await player_use_cases.delete_player(player_to_delete.id);
    is_deleting = false;

    if (!result.success) {
      show_delete_modal = false;
      show_toast(`Failed to delete player: ${result.error}`, "error");
      return;
    }

    show_delete_modal = false;
    player_to_delete = null;
    show_toast("Player deleted successfully", "success");
    load_players();
  }

  function cancel_delete(): void {
    show_delete_modal = false;
    player_to_delete = null;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: Player["status"]): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "active":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "inactive":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "injured":
        return `${base_classes} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`;
      case "suspended":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return base_classes;
    }
  }
</script>

<svelte:head>
  <title>Players - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Players
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage players across all teams
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
      New Player
    </button>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
      <div class="max-w-md">
        <SearchInput
          placeholder="Search players..."
          value={search_query}
          is_loading={loading_state === "loading"}
          on:search={handle_search}
        />
      </div>
    </div>

    <LoadingStateWrapper
      state={loading_state}
      {error_message}
      loading_text="Loading players..."
    >
      {#if players.length === 0}
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No players found
          </h3>
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            {search_query
              ? "Try adjusting your search criteria"
              : "Get started by adding a new player"}
          </p>
          {#if !search_query}
            <button
              type="button"
              class="btn btn-primary mt-4"
              on:click={navigate_to_create}
            >
              Add Player
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
                  >Player</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Team</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Position</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Age</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Jersey</th
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
              {#each players as player}
                <tr class="hover:bg-accent-50 dark:hover:bg-accent-700/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                      >
                        <span
                          class="text-sm font-medium text-primary-600 dark:text-primary-400"
                        >
                          {player.first_name.charAt(0)}{player.last_name.charAt(
                            0
                          )}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div
                          class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          {player.first_name}
                          {player.last_name}
                        </div>
                        <div
                          class="text-sm text-accent-500 dark:text-accent-400"
                        >
                          {player.nationality}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {get_team_name(player.team_id)}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {player.position}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {calculate_age(player.date_of_birth)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if player.jersey_number}
                      <span
                        class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent-200 dark:bg-accent-700 text-sm font-bold text-accent-700 dark:text-accent-300"
                      >
                        {player.jersey_number}
                      </span>
                    {:else}
                      <span class="text-accent-400">—</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={get_status_badge_classes(player.status)}>
                      {player.status}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      on:click={() => navigate_to_edit(player)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => request_delete(player)}
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
          {#each players as player}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"
                  >
                    <span
                      class="text-sm font-medium text-primary-600 dark:text-primary-400"
                    >
                      {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div
                      class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                      {player.first_name}
                      {player.last_name}
                    </div>
                    <div class="text-xs text-accent-500 dark:text-accent-400">
                      {player.position}
                    </div>
                  </div>
                </div>
                <span class={get_status_badge_classes(player.status)}>
                  {player.status}
                </span>
              </div>

              <div
                class="mt-2 grid grid-cols-3 gap-2 text-sm text-accent-600 dark:text-accent-400"
              >
                <div>
                  <span class="text-xs text-accent-500">Team</span>
                  <div class="truncate">{get_team_name(player.team_id)}</div>
                </div>
                <div>
                  <span class="text-xs text-accent-500">Age</span>
                  <div>{calculate_age(player.date_of_birth)}</div>
                </div>
                <div>
                  <span class="text-xs text-accent-500">Jersey</span>
                  <div>{player.jersey_number || "—"}</div>
                </div>
              </div>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="flex-1 btn btn-outline text-sm py-1.5"
                  on:click={() => navigate_to_edit(player)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="flex-1 btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 text-sm py-1.5"
                  on:click={() => request_delete(player)}
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
  title="Delete Player"
  message="Are you sure you want to delete '{player_to_delete?.first_name} {player_to_delete?.last_name}'? This action cannot be undone."
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
