<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let current_page: number;
    export let total_pages: number;
    export let total_items: number;
    export let items_per_page: number;
    export let page_size_options: number[] = [10, 20, 50];

    const dispatch = createEventDispatcher<{
        page_change: { page: number };
        page_size_change: { size: number };
    }>();

    $: display_start =
        total_items === 0 ? 0 : (current_page - 1) * items_per_page + 1;
    $: display_end = Math.min(current_page * items_per_page, total_items);
    $: visible_page_numbers = build_visible_page_numbers(
        current_page,
        total_pages,
    );

    function build_visible_page_numbers(
        page: number,
        total: number,
    ): (number | "...")[] {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

        const pages: (number | "...")[] = [1];

        if (page > 3) pages.push("...");

        const range_start = Math.max(2, page - 1);
        const range_end = Math.min(total - 1, page + 1);
        for (let p = range_start; p <= range_end; p++) {
            pages.push(p);
        }

        if (page < total - 2) pages.push("...");

        pages.push(total);
        return pages;
    }

    function handle_page_size_change(event: Event): void {
        const new_size = parseInt(
            (event.target as HTMLSelectElement).value,
            10,
        );
        dispatch("page_size_change", { size: new_size });
    }

    function go_to_page(page: number): void {
        if (page < 1 || page > total_pages || page === current_page) return;
        dispatch("page_change", { page });
    }
</script>

{#if total_items > 0}
    <div
        class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-700"
    >
        <div
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
            <span>
                Showing <span
                    class="font-medium text-accent-900 dark:text-accent-100"
                    >{display_start}–{display_end}</span
                >
                of
                <span class="font-medium text-accent-900 dark:text-accent-100"
                    >{total_items}</span
                >
                {total_items === 1 ? "item" : "items"}
            </span>

            <span class="hidden sm:inline text-gray-300 dark:text-gray-600"
                >|</span
            >

            <label class="hidden sm:flex items-center gap-1.5">
                <span class="text-xs">Per page:</span>
                <select
                    value={items_per_page}
                    on:change={handle_page_size_change}
                    class="text-xs rounded border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                    {#each page_size_options as size}
                        <option value={size}>{size}</option>
                    {/each}
                </select>
            </label>
        </div>

        <div class="flex items-center gap-1">
            <button
                type="button"
                class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={current_page === 1}
                aria-label="Previous page"
                on:click={() => go_to_page(current_page - 1)}
            >
                <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            {#each visible_page_numbers as page_number}
                {#if page_number === "..."}
                    <span
                        class="px-1.5 py-1 text-sm text-gray-400 dark:text-gray-500 select-none"
                        >…</span
                    >
                {:else}
                    <button
                        type="button"
                        class="min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors
              {page_number === current_page
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
                        on:click={() => go_to_page(page_number as number)}
                    >
                        {page_number}
                    </button>
                {/if}
            {/each}

            <button
                type="button"
                class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={current_page === total_pages || total_pages === 0}
                aria-label="Next page"
                on:click={() => go_to_page(current_page + 1)}
            >
                <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>
        </div>

        <label
            class="flex sm:hidden items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"
        >
            <span class="text-xs">Per page:</span>
            <select
                value={items_per_page}
                on:change={handle_page_size_change}
                class="text-xs rounded border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
                {#each page_size_options as size}
                    <option value={size}>{size}</option>
                {/each}
            </select>
        </label>
    </div>
{/if}
