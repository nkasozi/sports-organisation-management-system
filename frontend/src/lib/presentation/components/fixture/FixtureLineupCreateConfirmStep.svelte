<script lang="ts">
    import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import { sort_lineup_players } from "$lib/core/services/fixtureLineupWizard";

    export let current_fixture_title: string;
    export let selected_team_name: string;
    export let selected_players: CreateFixtureLineupInput["selected_players"];
    export let starters_count: number;
    export let confirm_lock_understood: boolean;
    export let validation_error: string;
    export let notes: string;
    export let on_confirm_change: (is_checked: boolean) => void;
    export let on_notes_change: (notes: string) => void;

    function sort_selected_players(
        players: CreateFixtureLineupInput["selected_players"],
    ): CreateFixtureLineupInput["selected_players"] {
        return sort_lineup_players(
            players as unknown as LineupPlayer[],
        ) as CreateFixtureLineupInput["selected_players"];
    }
</script>

<div class="space-y-5">
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
        class="p-4 rounded-lg border border-accent-200 dark:border-accent-700 bg-accent-50 dark:bg-accent-900/20"
    >
        <div class="font-semibold text-accent-900 dark:text-accent-100">
            Submission summary
        </div>
        <div class="text-sm text-accent-700 dark:text-accent-300 mt-1">
            {#if current_fixture_title}<div>
                    Fixture: {current_fixture_title}
                </div>{/if}{#if selected_team_name}<div>
                    Team: {selected_team_name}
                </div>{/if}
            <div>
                Squad size: {selected_players.length} ({Math.min(
                    starters_count,
                    selected_players.length,
                )} starters, {Math.max(
                    0,
                    selected_players.length - starters_count,
                )} substitutes)
            </div>
        </div>
    </div>
    {#if selected_players.length > 0}{@const starters = selected_players.slice(
            0,
            starters_count,
        )}{@const substitutes = selected_players.slice(starters_count)}
        <div class="space-y-4">
            <div>
                <h3
                    class="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2"
                >
                    <span class="inline-block w-3 h-3 rounded-full bg-green-500"
                    ></span>Starters ({starters.length})
                </h3>
                <div class="space-y-2">
                    {#each sort_selected_players(starters) as player}<div
                            class="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                        >
                            <div class="flex items-center justify-between">
                                <div
                                    class="font-medium text-accent-900 dark:text-accent-100"
                                >
                                    #{player.jersey_number ?? "?"}
                                    {player.first_name}
                                    {player.last_name}
                                </div>
                                <div
                                    class="text-sm text-accent-600 dark:text-accent-400"
                                >
                                    {player.position || "No position"}
                                </div>
                            </div>
                        </div>{/each}
                </div>
            </div>
            {#if substitutes.length > 0}<div>
                    <h3
                        class="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-2"
                    >
                        <span
                            class="inline-block w-3 h-3 rounded-full bg-violet-500"
                        ></span>Substitutes ({substitutes.length})
                    </h3>
                    <div class="space-y-2">
                        {#each sort_selected_players(substitutes) as player}<div
                                class="p-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20"
                            >
                                <div class="flex items-center justify-between">
                                    <div
                                        class="font-medium text-accent-900 dark:text-accent-100"
                                    >
                                        #{player.jersey_number ?? "?"}
                                        {player.first_name}
                                        {player.last_name}
                                    </div>
                                    <div
                                        class="text-sm text-accent-600 dark:text-accent-400"
                                    >
                                        {player.position || "No position"}
                                    </div>
                                </div>
                            </div>{/each}
                    </div>
                </div>{/if}
        </div>{/if}
    <div
        class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-900 dark:text-blue-100"
    >
        <div class="font-semibold">Warning</div>
        <div class="text-sm mt-1">
            Submitting this lineup will lock it. Editing will only be possible
            in exceptional circumstances.
        </div>
    </div>
    {#if validation_error}<div
            class="whitespace-pre-line text-red-600 dark:text-red-400 text-sm font-semibold"
        >
            {validation_error}
        </div>{/if}<label
        class="flex items-start gap-3 p-4 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 cursor-pointer"
        ><input
            type="checkbox"
            class="mt-1 form-checkbox h-5 w-5 text-secondary-600"
            checked={confirm_lock_understood}
            on:change={(event) =>
                on_confirm_change(
                    (event.currentTarget as HTMLInputElement).checked,
                )}
        />
        <div>
            <div class="font-medium text-accent-900 dark:text-accent-100">
                I understand this lineup will be locked after submission.
            </div>
            <div class="text-sm text-accent-600 dark:text-accent-400">
                If changes are needed later, an admin workflow will be required.
            </div>
        </div></label
    >
    <div>
        <label
            for="notes"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
            >Notes (optional)</label
        ><textarea
            id="notes"
            value={notes}
            rows="3"
            class="input"
            placeholder="Add any notes about this lineup..."
            on:input={(event) =>
                on_notes_change(
                    (event.currentTarget as HTMLTextAreaElement).value,
                )}
        ></textarea>
    </div>
</div>
