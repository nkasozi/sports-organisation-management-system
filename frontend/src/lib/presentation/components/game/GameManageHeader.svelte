<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";

    export let status: Fixture["status"];
    export let scheduled_time: string;
    export let home_team_name: string;
    export let away_team_name: string;
    export let home_score: number;
    export let away_score: number;
    export let current_period_label: string;
    export let clock_display: string;
    export let is_clock_running: boolean;
    export let is_game_active: boolean;
    export let on_back: () => void;
    export let on_start: () => void;
    export let on_toggle_clock: () => void;
    export let on_end: () => void;
</script>

<div class="bg-gray-900 text-white px-4 py-3 sticky top-0 z-40">
    <div class="flex items-center justify-between max-w-4xl mx-auto">
        <button
            type="button"
            class="p-2 hover:bg-gray-800 rounded-lg"
            aria-label="Go back"
            on:click={on_back}
        >
            <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                /></svg
            >
        </button>

        <div class="flex items-center gap-6 flex-1 justify-center">
            <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">{home_team_name}</div>
                <div class="text-4xl font-bold tabular-nums">{home_score}</div>
            </div>

            <div class="text-center min-w-32">
                <div class="text-xs text-gray-400 mb-1">
                    {#if status === "in_progress"}
                        {current_period_label}
                    {:else if status === "completed"}
                        Full Time
                    {:else}
                        {scheduled_time}
                    {/if}
                </div>

                {#if status === "in_progress"}
                    <div class="text-2xl font-mono font-bold text-primary-400">
                        {clock_display}
                    </div>
                    {#if is_clock_running}
                        <div
                            class="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1 animate-pulse"
                        ></div>
                    {/if}
                {:else}
                    <div class="text-xl font-semibold text-gray-400">VS</div>
                {/if}
            </div>

            <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">{away_team_name}</div>
                <div class="text-4xl font-bold tabular-nums">{away_score}</div>
            </div>
        </div>

        <div class="flex gap-2">
            {#if status === "scheduled"}
                <button
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium"
                    on:click={on_start}
                >
                    ▶️ Start
                </button>
            {:else if is_game_active}
                <button
                    class={`px-3 py-2 rounded-md text-sm font-medium ${is_clock_running ? "bg-yellow-500 text-black" : "bg-green-500 text-white"}`}
                    on:click={on_toggle_clock}
                >
                    {is_clock_running ? "⏸️ Pause" : "▶️ Resume"}
                </button>
                <button
                    class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium"
                    on:click={on_end}
                >
                    🏁 End
                </button>
            {/if}
        </div>
    </div>
</div>
