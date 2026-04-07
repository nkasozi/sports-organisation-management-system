<script lang="ts">
    import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";

    export let lineup: FixtureLineup;
    export let team_players: TeamPlayer[];
    export let can_modify_lineup: boolean;
    export let selected_player_ids: Set<string>;
    export let saving: boolean;
    export let on_toggle_player_selection: (player_id: string) => void;
    export let on_back: () => void;
    export let on_save: () => void | Promise<void>;
    export let on_submit: () => void | Promise<void>;

    $: can_manage_players = lineup.status !== "locked" && can_modify_lineup;
</script>

<div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
>
    {#if can_manage_players}
        <div class="mb-6">
            <h2
                class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
            >
                Manage Players
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each team_players as player}
                    {@const is_selected = selected_player_ids.has(player.id)}
                    <button
                        type="button"
                        class="p-4 rounded-lg border-2 transition-all {is_selected
                            ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                            : 'border-accent-200 dark:border-accent-700 hover:border-secondary-300'}"
                        on:click={() => on_toggle_player_selection(player.id)}
                    >
                        <div class="flex items-center justify-between">
                            <div class="text-left">
                                <p
                                    class="font-medium text-accent-900 dark:text-accent-100"
                                >
                                    {player.first_name}
                                    {player.last_name}
                                </p>
                                <p
                                    class="text-sm text-accent-600 dark:text-accent-400"
                                >
                                    #{player.jersey_number ?? "?"} • {player.position ||
                                        "No position"}
                                </p>
                            </div>
                            {#if is_selected}
                                <svg
                                    class="h-6 w-6 text-secondary-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            {/if}
                        </div>
                    </button>
                {/each}
            </div>
        </div>
    {:else}
        <div class="mb-6">
            <h2
                class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
            >
                Selected Players
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each lineup.selected_players as player}
                    <div
                        class="p-4 rounded-lg border-2 border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20"
                    >
                        <p
                            class="font-medium text-accent-900 dark:text-accent-100"
                        >
                            {player.first_name}
                            {player.last_name}
                        </p>
                        <p class="text-sm text-accent-600 dark:text-accent-400">
                            #{player.jersey_number ?? "?"} • {player.position ||
                                "No position"}
                        </p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if lineup.notes}
        <div class="mb-6">
            <h3
                class="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
            >
                Notes
            </h3>
            <p class="text-accent-900 dark:text-accent-100">{lineup.notes}</p>
        </div>
    {/if}

    <div class="flex justify-end space-x-4">
        <button type="button" class="btn btn-outline" on:click={on_back}>
            Back to List
        </button>
        {#if lineup.status === "draft" && can_modify_lineup}
            <button
                type="button"
                class="btn btn-outline"
                on:click={on_save}
                disabled={saving}
            >
                {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
                type="button"
                class="btn btn-primary-action"
                on:click={on_submit}
                disabled={saving}
            >
                Submit Lineup
            </button>
        {/if}
    </div>
</div>
