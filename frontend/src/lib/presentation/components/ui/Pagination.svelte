<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let current_page: number = 1;
  export let total_pages: number = 1;
  export let total_items: number = 0;
  export let items_per_page: number = 20;
  export let is_loading: boolean = false;

  const dispatch = createEventDispatcher<{
    page_change: { page: number };
  }>();

  $: start_item =
    total_items === 0 ? 0 : (current_page - 1) * items_per_page + 1;
  $: end_item = Math.min(current_page * items_per_page, total_items);
  $: can_go_previous = current_page > 1 && !is_loading;
  $: can_go_next = current_page < total_pages && !is_loading;

  function go_to_page(page: number): void {
    if (page >= 1 && page <= total_pages && page !== current_page) {
      dispatch("page_change", { page });
    }
  }

  function generate_page_numbers(
    current: number,
    total: number
  ): (number | string)[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    pages.push(1);

    if (current > 3) {
      pages.push("...");
    }

    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (current < total - 2) {
      pages.push("...");
    }

    if (!pages.includes(total)) {
      pages.push(total);
    }

    return pages;
  }

  $: page_numbers = generate_page_numbers(current_page, total_pages);
</script>

{#if total_pages > 0}
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-accent-200 dark:border-accent-700"
  >
    <div class="text-sm text-accent-600 dark:text-accent-400">
      Showing <span class="font-medium">{start_item}</span> to
      <span class="font-medium">{end_item}</span>
      of <span class="font-medium">{total_items}</span> results
    </div>

    <nav class="flex items-center gap-1" aria-label="Pagination">
      <button
        type="button"
        class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!can_go_previous}
        on:click={() => go_to_page(current_page - 1)}
        aria-label="Previous page"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {#each page_numbers as page_item}
        {#if page_item === "..."}
          <span class="px-2 text-accent-400">...</span>
        {:else}
          <button
            type="button"
            class="min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors
              {current_page === page_item
              ? 'bg-primary-600 text-white'
              : 'text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-700'}"
            disabled={is_loading}
            on:click={() => go_to_page(page_item as number)}
          >
            {page_item}
          </button>
        {/if}
      {/each}

      <button
        type="button"
        class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!can_go_next}
        on:click={() => go_to_page(current_page + 1)}
        aria-label="Next page"
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </nav>
  </div>
{/if}
