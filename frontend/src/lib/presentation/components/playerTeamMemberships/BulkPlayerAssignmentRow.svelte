<script lang="ts">
    import {
        get_player_avatar,
        get_player_full_name,
    } from "$lib/core/entities/Player";
    import type { PlayerAssignment } from "$lib/presentation/logic/bulkPlayerAssignmentPageState";

    export let assignment: PlayerAssignment;
    export let status_text: string;
    export let status_class: string;
    export let on_toggle_selection: (assignment: PlayerAssignment) => void;
</script>

<div
    class="p-4 flex items-center gap-4 hover:bg-accent-50 dark:hover:bg-accent-700/50 transition-colors"
>
    <input
        type="checkbox"
        checked={assignment.selected}
        on:change={() => on_toggle_selection(assignment)}
        class="w-5 h-5 text-primary-600 rounded border-accent-300"
    />
    <img
        src={get_player_avatar(assignment.player)}
        alt={get_player_full_name(assignment.player)}
        class="w-10 h-10 rounded-full object-cover border-2 border-accent-200 dark:border-accent-600"
    />
    <div class="flex-1 min-w-0">
        <p class="font-medium text-accent-900 dark:text-accent-100 truncate">
            {get_player_full_name(assignment.player)}
        </p>
        <p class={`text-sm ${status_class}`}>{status_text}</p>
    </div>
    {#if assignment.selected}
        <div class="flex items-center gap-3">
            <div>
                <span
                    class="block text-xs text-accent-600 dark:text-accent-400 mb-1"
                    >Jersey #</span
                >
                <input
                    type="number"
                    min="1"
                    max="99"
                    bind:value={assignment.jersey_number}
                    aria-label={`Jersey number for ${get_player_full_name(assignment.player)}`}
                    class="w-16 px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
                />
            </div>
            <div>
                <span
                    class="block text-xs text-accent-600 dark:text-accent-400 mb-1"
                    >Start Date</span
                >
                <input
                    type="date"
                    bind:value={assignment.start_date}
                    aria-label={`Start date for ${get_player_full_name(assignment.player)}`}
                    class="px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
                />
            </div>
        </div>
    {/if}
</div>
