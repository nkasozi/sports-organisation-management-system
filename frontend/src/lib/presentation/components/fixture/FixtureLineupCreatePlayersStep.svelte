<script lang="ts">
    import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";

    export let current_fixture_title: string;
    export let selected_players: CreateFixtureLineupInput["selected_players"];
    export let max_players: number;
    export let min_players: number;
    export let starters_count: number;
    export let player_search_text: string;
    export let has_selected_team: boolean;
    export let filtered_team_players: TeamPlayer[];
    export let validation_error: string;
    export let on_player_search_change: (search_text: string) => void;
    export let on_select_all: () => void;
    export let on_deselect_all: () => void;
    export let on_toggle_player: (player_id: string) => void;
    export let get_player_role_label: (player_index: number) => string;
</script>

<div class="space-y-4">
    {#if current_fixture_title}<div
            class="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-700"
        >
            <p
                class="text-sm font-medium text-secondary-800 dark:text-secondary-200"
            >
                {current_fixture_title}
            </p>
        </div>{/if}
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
        <div class="text-sm text-accent-700 dark:text-accent-300">
            <span class="font-medium"
                >Selected {selected_players.length} of {max_players} (min {min_players})</span
            ><span
                class="block sm:inline sm:ml-2 text-xs text-accent-500 dark:text-accent-400"
                >• First {starters_count} = Starters, rest = Substitutes</span
            >
        </div>
        <div class="flex gap-2">
            <button
                type="button"
                class="btn btn-sm btn-primary-action"
                on:click={on_select_all}
                disabled={!has_selected_team}>Select First {max_players}</button
            ><button
                type="button"
                class="btn btn-sm btn-outline"
                on:click={on_deselect_all}
                disabled={!has_selected_team}>Clear</button
            >
        </div>
    </div>
    <div>
        <input
            class="input"
            placeholder="Search by name, jersey, or position"
            value={player_search_text}
            on:input={(event) =>
                on_player_search_change(
                    (event.currentTarget as HTMLInputElement).value,
                )}
            disabled={!has_selected_team}
        />
    </div>
    {#if validation_error}<div
            class="whitespace-pre-line text-red-600 dark:text-red-400 text-sm font-semibold"
        >
            {validation_error}
        </div>{/if}{#if !has_selected_team}<div
            class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200"
        >
            Select a team first to load players.
        </div>{:else if filtered_team_players.length === 0}<div
            class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200"
        >
            No players match your search.
        </div>{:else}<div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            {#each filtered_team_players as player}{@const player_selection_index =
                    selected_players.findIndex(
                        (selected_player) => selected_player.id === player.id,
                    )}{@const is_selected =
                    player_selection_index >= 0}{@const player_role =
                    is_selected
                        ? get_player_role_label(player_selection_index)
                        : ""}{@const selection_disabled =
                    !is_selected &&
                    selected_players.length >= max_players}<button
                    type="button"
                    class={`flex items-center p-4 rounded-[0.175rem] border-2 transition-all cursor-pointer select-none text-left ${is_selected ? "border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20" : "border-accent-200 dark:border-accent-700 hover:border-secondary-300"} ${selection_disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    on:click={() =>
                        !selection_disabled && on_toggle_player(player.id)}
                    aria-disabled={selection_disabled}
                    ><div class="flex-1">
                        <div class="flex items-start justify-between gap-2">
                            <div>
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
                                {#if is_selected}<span
                                        class={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${player_role === "Starter" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300"}`}
                                        >{player_role}</span
                                    >{/if}
                            </div>
                            <div
                                class={`h-6 w-6 rounded-full flex items-center justify-center border ${is_selected ? "bg-secondary-600 border-secondary-600 text-white" : "border-accent-300 dark:border-accent-600 text-transparent"}`}
                            >
                                ✓
                            </div>
                        </div>
                    </div></button
                >{/each}
        </div>{/if}
</div>
