<script lang="ts">
    import type { QuickEventButton } from "$lib/core/entities/Fixture";

    export let home_team_name: string;
    export let away_team_name: string;
    export let all_event_buttons: QuickEventButton[];
    export let is_clock_running: boolean;
    export let on_open_event_modal: (
        event_button: QuickEventButton,
        team_side: "home" | "away",
    ) => void;
</script>

<div
    class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4"
>
    <div class="max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row">
            <div class="flex-1 md:pr-4">
                <div
                    class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3 text-center uppercase tracking-wider"
                >
                    🏠 {home_team_name}
                </div>
                <div class="grid grid-cols-4 gap-2">
                    {#each all_event_buttons as event_button}<button
                            class={`flex flex-col items-center justify-center p-2 rounded-md text-white transition-all active:scale-95 ${event_button.color}`}
                            on:click={() =>
                                on_open_event_modal(event_button, "home")}
                            disabled={!is_clock_running}
                            ><span class="text-lg">{event_button.icon}</span
                            ><span
                                class="text-xs mt-1 truncate w-full text-center"
                                >{event_button.label}</span
                            ></button
                        >{/each}
                </div>
            </div>
            <div
                class="hidden md:block w-px bg-gray-300 dark:bg-gray-600 mx-2 self-stretch"
            ></div>
            <div
                class="md:hidden h-px bg-gray-300 dark:bg-gray-600 my-4 w-full"
            ></div>
            <div class="flex-1 md:pl-4">
                <div
                    class="text-xs font-medium text-red-600 dark:text-red-400 mb-3 text-center uppercase tracking-wider"
                >
                    ✈️ {away_team_name}
                </div>
                <div class="grid grid-cols-4 gap-2">
                    {#each all_event_buttons as event_button}<button
                            class={`flex flex-col items-center justify-center p-2 rounded-md text-white transition-all active:scale-95 ${event_button.color}`}
                            on:click={() =>
                                on_open_event_modal(event_button, "away")}
                            disabled={!is_clock_running}
                            ><span class="text-lg">{event_button.icon}</span
                            ><span
                                class="text-xs mt-1 truncate w-full text-center"
                                >{event_button.label}</span
                            ></button
                        >{/each}
                </div>
            </div>
        </div>
    </div>
</div>
