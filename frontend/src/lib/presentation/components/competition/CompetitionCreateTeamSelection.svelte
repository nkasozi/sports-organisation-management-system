<script lang="ts">
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

    export let organization_id: string;
    export let is_loading_teams: boolean;
    export let team_options: SelectOption[];
    export let selected_team_ids: Set<string>;
    export let format_team_requirements: string;
    export let is_team_count_valid: boolean;
    export let on_toggle_team: (team_id: string) => boolean;
</script>

<div class="border-t border-accent-200 dark:border-accent-700 pt-6">
    <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4">
        Select Teams
    </h3>
    {#if format_team_requirements}
        <p
            class:text-red-600={!is_team_count_valid}
            class:dark:text-red-400={!is_team_count_valid}
            class="text-sm text-accent-600 dark:text-accent-400 mb-4"
        >
            {format_team_requirements} • {selected_team_ids.size} selected
        </p>
    {/if}

    {#if !organization_id}
        <div
            class="flex items-start gap-2 rounded-md border border-accent-300 bg-accent-50 dark:bg-accent-800 dark:border-accent-600 px-3 py-3 text-accent-700 dark:text-accent-300"
        >
            <svg
                class="h-5 w-5 flex-shrink-0 text-accent-400 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                /></svg
            >
            <p class="text-sm">
                Select an organisation above to load available teams.
            </p>
        </div>
    {:else if is_loading_teams}
        <div class="text-center py-8 text-accent-500">Loading teams...</div>
    {:else if team_options.length === 0}
        <div
            class="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900"
        >
            <svg
                class="h-5 w-5 flex-shrink-0 text-yellow-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                ><path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.336-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.669-1.743-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                /></svg
            >
            <div>
                <p class="text-sm font-medium">
                    No teams available for the selected organisation.
                </p>
                <p class="text-sm text-yellow-800">
                    Create teams under the organisation to add them here.
                </p>
            </div>
        </div>
    {:else}
        <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-accent-50 dark:bg-accent-900/30 rounded-lg"
        >
            {#each team_options as current_team_option}
                <label
                    class="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors"
                >
                    <input
                        type="checkbox"
                        checked={selected_team_ids.has(
                            current_team_option.value,
                        )}
                        on:change={() =>
                            on_toggle_team(current_team_option.value)}
                        class="w-4 h-4 text-primary-600 rounded border-accent-300"
                    />
                    <span class="text-sm text-accent-700 dark:text-accent-300"
                        >{current_team_option.label}</span
                    >
                </label>
            {/each}
        </div>
    {/if}
</div>
