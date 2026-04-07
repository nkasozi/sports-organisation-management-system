<script lang="ts">
    import type { Team } from "$lib/core/entities/Team";

    import CompetitionEditTeamCard from "./CompetitionEditTeamCard.svelte";

    export let teams_in_competition: Team[];
    export let available_teams: Team[];
    export let max_teams: number;
    export let can_edit_competition: boolean;
    export let on_cancel: () => void;
    export let on_done: () => void;
    export let on_add_team: (team: Team) => Promise<void>;
    export let on_remove_team: (team: Team) => Promise<void>;
</script>

<div class="space-y-6">
    <div>
        <h3
            class="text-lg font-medium text-accent-900 dark:text-accent-100 mb-4"
        >
            Teams in Competition ({teams_in_competition.length})
        </h3>
        {#if teams_in_competition.length === 0}
            <div
                class="text-center py-8 border-2 border-dashed border-accent-200 dark:border-accent-700 rounded-lg"
            >
                <svg
                    class="mx-auto h-10 w-10 text-accent-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    /></svg
                >
                <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
                    No teams registered yet
                </p>
            </div>
        {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each teams_in_competition as team}
                    <CompetitionEditTeamCard
                        {team}
                        action_label="Remove"
                        action_icon="remove"
                        action_button_classes="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                        container_classes="flex items-center justify-between p-3 bg-accent-50 dark:bg-accent-700/50 rounded-lg"
                        on_action={on_remove_team}
                    />
                {/each}
            </div>
        {/if}
    </div>

    <div class="border-t border-accent-200 dark:border-accent-700 pt-6">
        <h3
            class="text-lg font-medium text-accent-900 dark:text-accent-100 mb-4"
        >
            Available Teams ({available_teams.length})
        </h3>
        {#if available_teams.length === 0}
            <p class="text-sm text-accent-500 dark:text-accent-400">
                No available teams from this organization. Create teams first.
            </p>
        {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each available_teams as team}
                    <CompetitionEditTeamCard
                        {team}
                        action_label="Add"
                        action_icon="add"
                        action_button_classes="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-1"
                        container_classes="flex items-center justify-between p-3 border border-accent-200 dark:border-accent-600 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-700/30"
                        disabled={teams_in_competition.length >= max_teams}
                        on_action={on_add_team}
                    />
                {/each}
            </div>
        {/if}
    </div>

    {#if can_edit_competition}
        <div
            class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-accent-200 dark:border-accent-700 pt-6"
        >
            <button
                type="button"
                class="btn btn-outline w-full sm:w-auto"
                on:click={on_cancel}>Cancel</button
            >
            <button
                type="button"
                class="btn btn-primary-action w-full sm:w-auto"
                on:click={on_done}>Done</button
            >
        </div>
    {/if}
</div>
