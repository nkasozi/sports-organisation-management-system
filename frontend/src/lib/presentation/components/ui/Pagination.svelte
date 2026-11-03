<script context="module" lang="ts">
    let pagination_instance_count = 0;

    function claim_pagination_instance_number(): number {
        pagination_instance_count += 1;
        return pagination_instance_count;
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import {
        build_visible_page_entries,
        PAGINATION_ENTRY_KIND,
    } from "./paginationLogic";
    import SearchableSelectField from "./SearchableSelectField.svelte";

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
    const page_size_field_name = `pagination_page_size_${claim_pagination_instance_number()}`;

    $: page_size_select_options = page_size_options.map((size: number) => ({
        value: String(size),
        label: String(size),
    }));
    $: visible_page_entries = build_visible_page_entries(
        current_page,
        total_pages,
    );

    function handle_page_size_change(selected_value: string): boolean {
        const new_size = parseInt(selected_value, 10);
        dispatch("page_size_change", { size: new_size });
        return true;
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

            <div class="hidden sm:flex items-center gap-1.5">
                <label
                    class="text-xs"
                    for={`searchable-select-${page_size_field_name}_wide`}
                    >Per page:</label
                >
                <div class="w-20">
                    <SearchableSelectField
                        name={`${page_size_field_name}_wide`}
                        value={String(items_per_page)}
                        options={page_size_select_options}
                        on:change={(event) =>
                            handle_page_size_change(event.detail.value)}
                    />
                </div>
            </div>
        </div>

        <div class="flex items-center gap-1">
            <button
                type="button"
                class="p-1.5 rounded-[0.175rem] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

            {#each visible_page_entries as page_entry}
                {#if page_entry.kind === PAGINATION_ENTRY_KIND.ELLIPSIS}
                    <span
                        class="px-1.5 py-1 text-sm text-gray-400 dark:text-gray-500 select-none"
                        >…</span
                    >
                {:else}
                    <button
                        type="button"
                        class="min-w-[2rem] h-8 px-2 rounded-[0.175rem] text-sm font-medium transition-colors
              {page_entry.page_number === current_page
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
                        on:click={() => go_to_page(page_entry.page_number)}
                    >
                        {page_entry.page_number}
                    </button>
                {/if}
            {/each}

            <button
                type="button"
                class="p-1.5 rounded-[0.175rem] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

        <div
            class="flex sm:hidden items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"
        >
            <label
                class="text-xs"
                for={`searchable-select-${page_size_field_name}_narrow`}
                >Per page:</label
            >
            <div class="w-20">
                <SearchableSelectField
                    name={`${page_size_field_name}_narrow`}
                    value={String(items_per_page)}
                    options={page_size_select_options}
                    on:change={(event) =>
                        handle_page_size_change(event.detail.value)}
                />
            </div>
        </div>
    </div>
{/if}
