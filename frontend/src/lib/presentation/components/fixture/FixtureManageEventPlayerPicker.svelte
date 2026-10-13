<script lang="ts">
    import {
        filter_team_players,
        format_team_player_option,
        type TeamPlayer,
    } from "$lib/presentation/logic/fixtureManageState";

    export let requires_player: boolean;
    export let event_player_name: string;
    export let available_players: TeamPlayer[];

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

{#if requires_player}
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
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium">
                                        #{player.jersey_number ?? "?"}
                                        {player.first_name}
                                        {player.last_name}
                                    </div>
                                    <div
                                        class="text-xs text-gray-500 dark:text-gray-400"
                                    >
                                        {player.position || "No position"}
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
