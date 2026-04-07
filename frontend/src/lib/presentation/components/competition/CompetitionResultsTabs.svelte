<script lang="ts">
    export let active_tab: "standings" | "fixtures" | "results" | "stats";
    export let upcoming_count: number;
    export let results_count: number;

    function get_tab_classes(tab_key: typeof active_tab): string {
        const active_classes =
            "border-primary-500 text-primary-600 dark:text-primary-400";
        const inactive_classes =
            "border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300";
        return `flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${active_tab === tab_key ? active_classes : inactive_classes}`;
    }
</script>

<div
    class="border-b border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 px-4 sm:px-6"
>
    <nav class="flex overflow-x-auto -mb-px scrollbar-hide" aria-label="Tabs">
        <button
            type="button"
            class={get_tab_classes("standings")}
            on:click={() => (active_tab = "standings")}
        >
            <span class="hidden sm:inline">📊 </span> Standings
        </button>
        <button
            type="button"
            class={get_tab_classes("fixtures")}
            on:click={() => (active_tab = "fixtures")}
        >
            <span class="hidden sm:inline">📅 </span> Upcoming<span
                class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full"
                >{upcoming_count}</span
            >
        </button>
        <button
            type="button"
            class={get_tab_classes("results")}
            on:click={() => (active_tab = "results")}
        >
            <span class="hidden sm:inline">✅ </span> Results<span
                class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full"
                >{results_count}</span
            >
        </button>
        <button
            type="button"
            class={get_tab_classes("stats")}
            on:click={() => (active_tab = "stats")}
        >
            <span class="hidden sm:inline">⚽ </span> Stats
        </button>
    </nav>
</div>
