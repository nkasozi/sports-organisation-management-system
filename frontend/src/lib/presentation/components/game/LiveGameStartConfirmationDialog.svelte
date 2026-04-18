<script lang="ts">
    import type { LiveGamesPendingStartFixtureState } from "$lib/presentation/logic/liveGamesPageState";
    import {
        format_fixture_scheduled_date_label,
        is_fixture_scheduled_for_different_date,
    } from "$lib/presentation/logic/liveGameStartConfirmation";
    import { get_live_game_matchup_label } from "$lib/presentation/logic/liveGamesViewLogic";

    export let pending_start_fixture_state: LiveGamesPendingStartFixtureState = {
        status: "idle",
    };
    export let team_names: Record<string, string> = {};
    export let on_cancel: () => void;
    export let on_confirm: () => void;

    function should_show_date_warning(current_fixture: LiveGamesPendingStartFixtureState): boolean {
        if (current_fixture.status === "idle") {
            return false;
        }

        return is_fixture_scheduled_for_different_date(
            current_fixture.fixture.scheduled_date,
            new Date(),
        );
    }
</script>

{#if pending_start_fixture_state.status === "confirming"}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-game-confirmation-title"
    >
        <div
            class="w-full max-w-md rounded-xl border border-accent-200 bg-white p-6 shadow-2xl dark:border-accent-700 dark:bg-accent-900"
        >
            <div class="space-y-2">
                <h2
                    id="start-game-confirmation-title"
                    class="text-xl font-semibold text-accent-900 dark:text-white"
                >
                    Start Game
                </h2>
                <p class="text-sm text-accent-600 dark:text-accent-300">
                    You are about to start {get_live_game_matchup_label(
                        pending_start_fixture_state.fixture,
                        team_names,
                    )}.
                </p>
            </div>

            {#if should_show_date_warning(pending_start_fixture_state)}
                <div
                    class="mt-4 rounded-lg border border-purple-300 bg-purple-50 px-4 py-3 dark:border-purple-700 dark:bg-purple-950/40"
                >
                    <div class="flex items-start gap-3">
                        <svg
                            class="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 9v3.75m0 3.75h.007v.008H12v-.008zm8.25-3.008c0 4.556-3.694 8.25-8.25 8.25S3.75 18.056 3.75 13.5 7.444 5.25 12 5.25s8.25 3.694 8.25 8.25z"
                            />
                        </svg>
                        <div class="space-y-1">
                            <p
                                class="text-sm font-semibold text-purple-800 dark:text-purple-300"
                            >
                                Date mismatch
                            </p>
                            <p
                                class="text-sm text-purple-700 dark:text-purple-400"
                            >
                                This fixture is scheduled for {format_fixture_scheduled_date_label(
                                    pending_start_fixture_state.fixture
                                        .scheduled_date,
                                )}, which is different from today.
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    on:click={on_cancel}
                    class="rounded-md border border-accent-300 px-4 py-2 text-sm font-medium text-accent-700 transition-colors hover:bg-accent-100 dark:border-accent-600 dark:text-accent-200 dark:hover:bg-accent-800"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    on:click={on_confirm}
                    class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                    Confirm Start
                </button>
            </div>
        </div>
    </div>
{/if}
