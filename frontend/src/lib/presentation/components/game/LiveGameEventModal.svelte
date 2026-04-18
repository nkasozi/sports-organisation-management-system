<script lang="ts">
    import type { QuickEventButton } from "$lib/core/entities/Fixture";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";

    export let is_visible: boolean;
    export let selected_event_type: QuickEventButton | undefined;
    export let selected_team_side: "home" | "away";
    export let home_team_name: string;
    export let away_team_name: string;
    export let event_minute: number;
    export let game_clock_seconds: number;
    export let is_updating: boolean;
    export let player_select_options: Array<{ value: string; label: string }>;
    export let players_on_field_options: Array<{
        value: string;
        label: string;
    }>;
    export let selected_player_id: string;
    export let secondary_player_id: string;
    export let event_description: string;
    export let is_substitution_event: boolean;
    export let on_cancel: () => void;
    export let on_record: () => Promise<void>;
    export let on_select_player: (player_id: string) => void;
    export let on_select_secondary_player: (player_id: string) => void;
    export let on_event_minute_change: (minute: number) => void;
    export let on_event_description_change: (description: string) => void;
</script>

{#if is_visible && selected_event_type}<div
        class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    >
        <div
            class="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl shadow-2xl"
        >
            <div
                class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
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
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    on:click={on_cancel}
                    ><svg
                        class="w-5 h-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        /></svg
                    ></button
                >
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
                            value={event_minute}
                            on:input={(event) =>
                                on_event_minute_change(
                                    Number(
                                        (
                                            event.currentTarget as HTMLInputElement
                                        ).value,
                                    ),
                                )}
                            class="w-24 px-3 py-2 text-center text-2xl font-mono font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        /><span class="text-2xl font-bold text-gray-500">'</span
                        ><button
                            type="button"
                            class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-[0.175rem] text-gray-700 dark:text-gray-300"
                            on:click={() =>
                                on_event_minute_change(
                                    Math.floor(game_clock_seconds / 60),
                                )}
                            >Reset to {Math.floor(
                                game_clock_seconds / 60,
                            )}'</button
                        >
                    </div>
                </div>
                {#if selected_event_type.requires_player}<SearchableSelectField
                        label={is_substitution_event
                            ? "Player Coming ON"
                            : "Player"}
                        name="event_player"
                        value={selected_player_id}
                        options={player_select_options}
                        placeholder="Search for a player..."
                        on:change={(event) =>
                            on_select_player(event.detail.value)}
                    />{/if}{#if is_substitution_event}<SearchableSelectField
                        label="Player Coming OFF"
                        name="secondary_player"
                        value={secondary_player_id}
                        options={players_on_field_options}
                        placeholder="Select player coming off..."
                        on:change={(event) =>
                            on_select_secondary_player(event.detail.value)}
                    />{/if}
                <div>
                    <label
                        for="event_description"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >Description (optional)</label
                    ><input
                        id="event_description"
                        type="text"
                        value={event_description}
                        on:input={(event) =>
                            on_event_description_change(
                                (event.currentTarget as HTMLInputElement).value,
                            )}
                        placeholder="Add details..."
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
            </div>
            <div
                class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
            >
                <button
                    class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    on:click={on_cancel}>Cancel</button
                ><button
                    class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-[0.175rem] disabled:opacity-50"
                    disabled={is_updating}
                    on:click={() => void on_record()}
                    >{is_updating ? "Recording..." : "✓ Record Event"}</button
                >
            </div>
        </div>
    </div>{/if}
