<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { GameEventType } from "$lib/domain/entities/GameEventType";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_game_event_type_use_cases } from "$lib/usecases/GameEventTypeUseCases";
  import { get_category_label } from "$lib/domain/entities/GameEventType";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_game_event_type_use_cases();

  let event_types: GameEventType[] = [];
  let loading_state: LoadingState = "loading";
  let error_message: string = "";
  let current_page: number = 1;
  let total_pages: number = 1;
  let total_count: number = 0;
  let search_query: string = "";

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const page_size = 20;

  onMount(async () => {
    await load_event_types();
  });

  async function load_event_types(): Promise<void> {
    loading_state = "loading";

    const filter = search_query ? { name_contains: search_query } : undefined;
    const result = await use_cases.list_event_types(filter, {
      page_number: current_page,
      page_size,
    });

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    event_types = result.data.items;
    total_pages = result.data.total_pages;
    total_count = result.data.total_count;
    loading_state = "success";
  }

  async function handle_delete(event_type: GameEventType): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to delete "${event_type.name}"?`
    );
    if (!confirmed) return;

    const result = await use_cases.delete_event_type(event_type.id);

    if (!result.success) {
      show_toast(result.error, "error");
      return;
    }

    show_toast("Event type deleted successfully", "success");
    await load_event_types();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_event_types();
  }

  function handle_search(): void {
    current_page = 1;
    load_event_types();
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_category_badge_class(category: string): string {
    switch (category) {
      case "score":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      case "discipline":
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
      case "play":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      case "match_control":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300";
    }
  }
</script>

<svelte:head>
  <title>Event Types - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Game Event Types
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage event types that can be recorded during live games
      </p>
    </div>

    <button
      type="button"
      class="btn btn-primary"
      on:click={() => goto("/event-types/create")}
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
      Add Event Type
    </button>
  </div>

  <div class="flex flex-col sm:flex-row gap-4">
    <div class="flex-1">
      <div class="relative">
        <input
          type="text"
          placeholder="Search event types..."
          bind:value={search_query}
          on:keydown={(e) => e.key === "Enter" && handle_search()}
          class="w-full pl-10 pr-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 placeholder-accent-500"
        />
        <svg
          class="absolute left-3 top-2.5 h-5 w-5 text-accent-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
    <button type="button" class="btn btn-outline" on:click={handle_search}>
      Search
    </button>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading event types..."
    {error_message}
  >
    {#if event_types.length === 0}
      <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-12 text-center"
      >
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h3
          class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
          No event types found
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">
          Get started by creating your first event type.
        </p>
        <button
          type="button"
          class="btn btn-primary mt-4"
          on:click={() => goto("/event-types/create")}
        >
          Add Event Type
        </button>
      </div>
    {:else}
      <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-accent-200 dark:divide-accent-700"
          >
            <thead class="bg-accent-50 dark:bg-accent-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-300 uppercase tracking-wider"
                >
                  Event Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-300 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-300 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-300 uppercase tracking-wider"
                >
                  Attributes
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-accent-500 dark:text-accent-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-accent-200 dark:divide-accent-700">
              {#each event_types as event_type}
                <tr class="hover:bg-accent-50 dark:hover:bg-accent-700/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <span
                        class="text-2xl w-10 h-10 rounded-lg flex items-center justify-center {event_type.color.split(
                          ' '
                        )[0]}"
                      >
                        {event_type.icon}
                      </span>
                      <div>
                        <div
                          class="font-medium text-accent-900 dark:text-accent-100"
                        >
                          {event_type.name}
                        </div>
                        <div
                          class="text-sm text-accent-500 dark:text-accent-400 truncate max-w-xs"
                        >
                          {event_type.description || "No description"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-mono bg-accent-100 dark:bg-accent-700 rounded"
                    >
                      {event_type.code}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full {get_category_badge_class(
                        event_type.category
                      )}"
                    >
                      {get_category_label(event_type.category)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex gap-2">
                      {#if event_type.affects_score}
                        <span
                          class="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded"
                        >
                          Scoring
                        </span>
                      {/if}
                      {#if event_type.requires_player}
                        <span
                          class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded"
                        >
                          Player
                        </span>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full {event_type.status ===
                      'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}"
                    >
                      {event_type.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      on:click={() => goto(`/event-types/${event_type.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-700 dark:text-red-400"
                      on:click={() => handle_delete(event_type)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if total_pages > 1}
          <div
            class="px-6 py-4 border-t border-accent-200 dark:border-accent-700"
          >
            <Pagination
              {current_page}
              {total_pages}
              total_items={total_count}
              items_per_page={page_size}
              on:page-change={handle_page_change}
            />
          </div>
        {/if}
      </div>
    {/if}
  </LoadingStateWrapper>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
