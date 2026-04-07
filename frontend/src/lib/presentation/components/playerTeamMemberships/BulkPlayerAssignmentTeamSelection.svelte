<script lang="ts">
    import type { Team } from "$lib/core/entities/Team";

    export let teams: Team[];
    export let selected_team_id: string;
    export let selected_count: number;
    export let search_query: string;
    export let on_select_all_unassigned: () => void;
    export let on_deselect_all: () => void;
</script>

<div class="card p-4 sm:p-6">
    <div class="space-y-4">
        <div>
            <label
                for="team_select"
                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                >Select Target Team *</label
            >
            <select
                id="team_select"
                bind:value={selected_team_id}
                class="w-full px-3 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
            >
                <option value="">-- Select a team --</option>
                {#each teams as current_team}
                    <option value={current_team.id}>{current_team.name}</option>
                {/each}
            </select>
        </div>

        {#if selected_team_id}
            <div
                class="flex flex-wrap gap-2 items-center border-t border-accent-200 dark:border-accent-700 pt-4"
            >
                <button
                    type="button"
                    class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    on:click={on_select_all_unassigned}
                    >Select All Unassigned</button
                >
                <span class="text-accent-400">|</span>
                <button
                    type="button"
                    class="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400"
                    on:click={on_deselect_all}>Deselect All</button
                >
                <span class="flex-1"></span>
                <span class="text-sm text-accent-600 dark:text-accent-400"
                    >{selected_count} player(s) selected</span
                >
            </div>
            <div class="relative mt-3">
                <svg
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                </svg>
                <input
                    type="search"
                    placeholder="Search players by name..."
                    bind:value={search_query}
                    class="w-full pl-9 pr-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-sm text-accent-900 dark:text-accent-100 placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
            </div>
        {/if}
    </div>
</div>
