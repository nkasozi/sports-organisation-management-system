<script lang="ts">
    import type {
        GamePeriod,
        QuickEventButton,
    } from "$lib/core/entities/Fixture";

    export let current_period: GamePeriod;
    export let is_clock_running: boolean;
    export let primary_events: QuickEventButton[];
    export let secondary_events: QuickEventButton[];
    export let home_team_name: string;
    export let away_team_name: string;
    export let on_end_current_period: () => Promise<void>;
    export let on_change_period: (period: GamePeriod) => Promise<void>;
    export let on_open_event_modal: (
        event_button: QuickEventButton,
        team_side: "home" | "away",
    ) => void;
</script>

<div>
    <div class="bg-gray-800 text-white px-4 py-2 border-b border-gray-700">
        <div class="flex justify-center gap-3 max-w-4xl mx-auto flex-wrap">
            {#if current_period === "first_half" && !is_clock_running}
                <button
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium"
                    on:click={() => void on_end_current_period()}
                >
                    ⏹️ End 1st Half
                </button>
            {:else if current_period === "half_time"}
                <button
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium"
                    on:click={() => void on_change_period("second_half")}
                >
                    ▶️ Start 2nd Half
                </button>
            {:else if current_period === "second_half" && !is_clock_running}
                <button
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium"
                    on:click={() => void on_end_current_period()}
                >
                    ⏹️ End 2nd Half
                </button>
                <button
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium"
                    on:click={() => void on_change_period("extra_time_first")}
                >
                    ⚡ Extra Time
                </button>
            {/if}
        </div>
    </div>

    <div
        class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4"
    >
        <div class="max-w-4xl mx-auto">
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <div
                        class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3 text-center uppercase tracking-wider"
                    >
                        🏠 {home_team_name}
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        {#each primary_events as event_button}
                            <button
                                class={`flex flex-col items-center justify-center p-2 rounded-md text-white transition-all active:scale-95 ${event_button.color}`}
                                disabled={!is_clock_running}
                                on:click={() =>
                                    on_open_event_modal(event_button, "home")}
                            >
                                <span class="text-lg">{event_button.icon}</span>
                                <span class="text-xs mt-1"
                                    >{event_button.label}</span
                                >
                            </button>
                        {/each}
                    </div>
                </div>

                <div>
                    <div
                        class="text-xs font-medium text-red-600 dark:text-red-400 mb-3 text-center uppercase tracking-wider"
                    >
                        ✈️ {away_team_name}
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        {#each primary_events as event_button}
                            <button
                                class={`flex flex-col items-center justify-center p-2 rounded-md text-white transition-all active:scale-95 ${event_button.color}`}
                                disabled={!is_clock_running}
                                on:click={() =>
                                    on_open_event_modal(event_button, "away")}
                            >
                                <span class="text-lg">{event_button.icon}</span>
                                <span class="text-xs mt-1"
                                    >{event_button.label}</span
                                >
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            {#if secondary_events.length > 0}
                <div
                    class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                    <div
                        class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center"
                    >
                        More Events
                    </div>
                    <div class="flex flex-wrap justify-center gap-2">
                        {#each secondary_events as event_button}
                            <button
                                class={`px-3 py-1.5 rounded-md text-xs font-medium text-white flex items-center gap-1 ${event_button.color}`}
                                disabled={!is_clock_running}
                                on:click={() =>
                                    on_open_event_modal(event_button, "home")}
                            >
                                {event_button.icon}
                                {event_button.label}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
