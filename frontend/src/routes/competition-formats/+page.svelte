<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { CompetitionFormat } from "$lib/domain/entities/CompetitionFormat";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_competition_format_use_cases } from "$lib/usecases/CompetitionFormatUseCases";
  import { get_format_type_label } from "$lib/domain/entities/CompetitionFormat";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_competition_format_use_cases();

  let formats: CompetitionFormat[] = [];
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
    await load_formats();
  });

  async function load_formats(): Promise<void> {
    loading_state = "loading";

    const filter = search_query ? { name_contains: search_query } : undefined;
    const result = await use_cases.list_formats(filter, {
      page_number: current_page,
      page_size,
    });

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    formats = result.data.items;
    total_pages = result.data.total_pages;
    total_count = result.data.total_count;
    loading_state = "success";
  }

  async function handle_delete(format: CompetitionFormat): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to delete "${format.name}"?`
    );
    if (!confirmed) return;

    const result = await use_cases.delete_format(format.id);

    if (!result.success) {
      show_toast(result.error, "error");
      return;
    }

    show_toast("Format deleted successfully", "success");
    await load_formats();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_formats();
  }

  function handle_search(): void {
    current_page = 1;
    load_formats();
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_format_type_badge_class(format_type: string): string {
    switch (format_type) {
      case "league":
      case "round_robin":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      case "groups_knockout":
      case "straight_knockout":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      case "groups_playoffs":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
      case "double_elimination":
      case "swiss":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300";
    }
  }

  function get_format_icon(format_type: string): string {
    switch (format_type) {
      case "league":
        return "🏆";
      case "round_robin":
        return "🔄";
      case "groups_knockout":
        return "⚔️";
      case "straight_knockout":
        return "🥊";
      case "groups_playoffs":
        return "🎯";
      case "double_elimination":
        return "🔁";
      case "swiss":
        return "🇨🇭";
      default:
        return "📋";
    }
  }
</script>

<svelte:head>
  <title>Competition Formats - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Competition Formats
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Define tournament structures like leagues, knockouts, and groups
      </p>
    </div>

    <button
      type="button"
      class="btn btn-primary"
      on:click={() => goto("/competition-formats/create")}
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
      Add Format
    </button>
  </div>

  <div class="flex flex-col sm:flex-row gap-4">
    <div class="flex-1">
      <div class="relative">
        <input
          type="text"
          placeholder="Search formats..."
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
    loading_text="Loading formats..."
    {error_message}
  >
    {#if formats.length === 0}
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3
          class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
          No competition formats found
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">
          Get started by creating your first competition format.
        </p>
        <button
          type="button"
          class="btn btn-primary mt-4"
          on:click={() => goto("/competition-formats/create")}
        >
          Add Format
        </button>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each formats as format}
          <div
            class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <span class="text-3xl"
                  >{get_format_icon(format.format_type)}</span
                >
                <div>
                  <h3
                    class="font-semibold text-accent-900 dark:text-accent-100"
                  >
                    {format.name}
                  </h3>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full {get_format_type_badge_class(
                      format.format_type
                    )}"
                  >
                    {get_format_type_label(format.format_type)}
                  </span>
                </div>
              </div>
              <span
                class="px-2 py-1 text-xs font-medium rounded-full {format.status ===
                'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}"
              >
                {format.status}
              </span>
            </div>

            <p
              class="mt-2 text-sm text-accent-600 dark:text-accent-400 line-clamp-2"
            >
              {format.description || "No description"}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                class="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 rounded"
              >
                {format.min_teams_required}-{format.max_teams_allowed} teams
              </span>
            </div>

            <div
              class="mt-4 flex items-center justify-between pt-3 border-t border-accent-200 dark:border-accent-700"
            >
              <span
                class="text-xs font-mono text-accent-500 dark:text-accent-400"
              >
                {format.code}
              </span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  on:click={() => goto(`/competition-formats/${format.id}`)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  on:click={() => handle_delete(format)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if total_pages > 1}
        <div class="mt-6">
          <Pagination
            {current_page}
            {total_pages}
            total_items={total_count}
            items_per_page={page_size}
            on:page-change={handle_page_change}
          />
        </div>
      {/if}
    {/if}
  </LoadingStateWrapper>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
