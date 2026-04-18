<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";

    export let fixture: Fixture;
    export let can_start_games: boolean;
    export let is_starting: boolean;
    export let on_start_click: (fixture: Fixture) => void;
</script>

{#if fixture.status === "in_progress"}
    <div class="pt-4 border-t border-accent-200 dark:border-accent-700">
        <div
            class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4"
        >
            <div class="hidden sm:block sm:flex-1"></div>
            <div class="sm:flex-1 flex justify-center">
                <a
                    href="/live-games/{fixture.id}"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                    <svg
                        class="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    Go to Game
                </a>
            </div>
            <div class="hidden sm:block sm:flex-1"></div>
        </div>
    </div>
{:else if can_start_games}
    <div class="pt-4 border-t border-accent-200 dark:border-accent-700">
        <div
            class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4"
        >
            <div class="hidden sm:block sm:flex-1"></div>
            <div class="sm:flex-1 flex justify-center">
                <button
                    type="button"
                    on:click={() => on_start_click(fixture)}
                    disabled={is_starting}
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-[0.175rem] hover:bg-emerald-700 disabled:bg-accent-400 dark:disabled:bg-accent-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {#if is_starting}
                        <svg
                            class="h-5 w-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Starting...
                    {:else}
                        <svg
                            class="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Start Game
                    {/if}
                </button>
            </div>
            <div class="hidden sm:block sm:flex-1"></div>
        </div>
    </div>
{/if}
