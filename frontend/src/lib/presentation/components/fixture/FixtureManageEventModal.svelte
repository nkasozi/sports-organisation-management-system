<script lang="ts">
    import type { QuickEventButton } from "$lib/core/entities/Fixture";
    import {
        filter_team_players,
        format_team_player_option,
        type TeamPlayer,
    } from "$lib/presentation/logic/fixtureManageState";

    export let selected_event_type: QuickEventButton;
    export let selected_team_side: "home" | "away";
    export let home_team_name: string;
    export let away_team_name: string;
    export let event_minute: number;
    export let event_player_name: string;
    export let event_description: string;
    export let game_clock_seconds: number;
    export let is_updating: boolean;
    export let available_players: TeamPlayer[];
    export let on_cancel: () => void;
    export let on_record: () => Promise<void>;

    let filtered_players: TeamPlayer[] = [];
    let show_player_dropdown: boolean = false;

    function update_filtered_players(search_text: string): void {
        filtered_players = filter_team_players(available_players, search_text);
    }

    function select_player(player: TeamPlayer): void {
        event_player_name = format_team_player_option(player);
        filtered_players = [];
        show_player_dropdown = false;
    }

    function handle_player_input(event: Event): void {
        event_player_name = (event.target as HTMLInputElement).value;
        update_filtered_players(event_player_name);
        show_player_dropdown = true;
    }

    function handle_player_focus(): void {
        update_filtered_players(event_player_name);
        show_player_dropdown = true;
    }

    function handle_player_blur(): void {
        setTimeout(() => {
            show_player_dropdown = false;
        }, 200);
    }
</script>

<div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
>
    <div
        class="w-full bg-white shadow-2xl dark:bg-gray-800 sm:max-w-md sm:rounded-xl"
    >
        <div
            class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700"
        >
            <div class="flex items-center gap-3">
                <span class="text-2xl">{selected_event_type.icon}</span>
                <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {selected_event_type.label}
                    </h3>
                    <span
                        class={`text-xs ${selected_team_side === "home" ? "text-blue-600" : "text-red-600"}`}
                        >{selected_team_side === "home"
                            ? `🏠 ${home_team_name}`
                            : `✈️ ${away_team_name}`}</span
                    >
                </div>
            </div>
            <button
                aria-label="Close event form"
                class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                on:click={on_cancel}
            >
                <svg
                    class="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    /></svg
                >
            </button>
        </div>

        <div class="p-4 space-y-4">
            <div>
                <label
                    for="event_minute"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Game Minute</label
                >
                <div class="flex items-center gap-2">
                    <input
                        id="event_minute"
                        type="number"
                        min="0"
                        max="120"
                        bind:value={event_minute}
                        class="w-24 px-3 py-2 text-center text-2xl font-mono font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span class="text-2xl font-bold text-gray-500">'</span>
                    <button
                        type="button"
                        class="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        on:click={() =>
                            (event_minute = Math.floor(game_clock_seconds / 60))}
                        >Reset to {Math.floor(game_clock_seconds / 60)}'</button
                    >
                </div>
            </div>

            {#if selected_event_type.requires_player}
                <div>
                    <label
                        for="event_player"
                        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Player</label
                    >
                    <div class="relative">
                        <input
                            id="event_player"
                            type="text"
                            bind:value={event_player_name}
                            placeholder="Type name, jersey #, or position"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            on:input={handle_player_input}
                            on:focus={handle_player_focus}
                            on:blur={handle_player_blur}
                        />
                        {#if show_player_dropdown && filtered_players.length > 0}
                            <div
                                class="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
                            >
                                {#each filtered_players as player}
                                    <button
                                        type="button"
                                        class="w-full border-b border-gray-200 px-3 py-2 text-left text-gray-900 hover:bg-gray-100 last:border-b-0 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                                        on:click={() => select_player(player)}
                                    >
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <div>
                                                <div class="font-medium">
                                                    #{player.jersey_number ??
                                                        "?"}
                                                    {player.first_name}
                                                    {player.last_name}
                                                </div>
                                                <div
                                                    class="text-xs text-gray-500 dark:text-gray-400"
                                                >
                                                    {player.position ||
                                                        "No position"}
                                                </div>
                                            </div>
                                            <div
                                                class="text-xs text-gray-400 dark:text-gray-500"
                                            >
                                                {player.status}
                                            </div>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <div>
                <label
                    for="event_description"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Description (optional)</label
                >
                <input
                    id="event_description"
                    type="text"
                    bind:value={event_description}
                    placeholder="Add details..."
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>
        </div>

        <div
            class="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-gray-700"
        >
            <button
                class="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                on:click={on_cancel}>Cancel</button
            >
            <button
                class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md disabled:opacity-50"
                disabled={is_updating}
                on:click={() => void on_record()}
            >
                {#if is_updating}
                    Recording...
                {:else}
                    ✓ Record Event
                {/if}
            </button>
        </div>
    </div>
</div>
