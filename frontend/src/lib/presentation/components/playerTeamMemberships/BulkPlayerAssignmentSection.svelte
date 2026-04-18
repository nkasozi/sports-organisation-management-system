<script lang="ts">
    import type { PlayerAssignment } from "$lib/presentation/logic/bulkPlayerAssignmentPageState";

    import BulkPlayerAssignmentRow from "./BulkPlayerAssignmentRow.svelte";

    export let title: string;
    export let total_count: number;
    export let description: string;
    export let players: PlayerAssignment[];
    export let search_query: string;
    export let empty_search_message: string;
    export let empty_default_message: string;
    export let gender_filter_active: boolean;
    export let target_gender_label: string;
    export let status_variant: "available" | "assigned";
    export let on_toggle_selection: (assignment: PlayerAssignment) => void;

    function get_status_text(assignment: PlayerAssignment): string {
        return status_variant === "available"
            ? "Available"
            : `Currently on: ${assignment.current_team_state.status === "assigned" ? assignment.current_team_state.team_name : ""}`;
    }

    function get_status_class(): string {
        return status_variant === "available"
            ? "text-green-600 dark:text-green-400"
            : "text-violet-600 dark:text-violet-400";
    }
</script>

<div class="card">
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
        <div class="flex items-center gap-2 flex-wrap">
            <h2
                class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
                {title} ({total_count})
            </h2>
            {#if gender_filter_active}
                <span
                    class="inline-flex items-center px-2 py-0.5 rounded-[0.175rem] text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    >{target_gender_label}</span
                >
            {/if}
        </div>
        <p class="text-sm text-accent-600 dark:text-accent-400">
            {description}
        </p>
    </div>
    <div class="divide-y divide-accent-200 dark:divide-accent-700">
        {#if players.length === 0}
            <div
                class="p-6 text-center text-accent-500 dark:text-accent-400 text-sm"
            >
                {search_query ? empty_search_message : empty_default_message}
            </div>
        {:else}
            {#each players as current_assignment}
                <BulkPlayerAssignmentRow
                    assignment={current_assignment}
                    status_text={get_status_text(current_assignment)}
                    status_class={get_status_class()}
                    {on_toggle_selection}
                />
            {/each}
        {/if}
    </div>
</div>
