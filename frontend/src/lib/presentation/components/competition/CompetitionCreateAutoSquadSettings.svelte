<script lang="ts">
    import type {
        CreateCompetitionInput,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import InfoTooltip from "$lib/presentation/components/ui/InfoTooltip.svelte";

    export let form_data: CreateCompetitionInput | UpdateCompetitionInput;
    export let on_toggle_auto_squad_submission: (enabled: boolean) => void;
</script>

<div class="border-t border-accent-200 dark:border-accent-700 pt-6 space-y-4">
    <label class="flex items-center gap-3 cursor-pointer">
        <input
            type="checkbox"
            checked={form_data.allow_auto_squad_submission}
            on:change={(event) =>
                on_toggle_auto_squad_submission(event.currentTarget.checked)}
            class="w-5 h-5 text-primary-600 rounded border-accent-300"
        />
        <div>
            <span
                class="text-sm font-medium text-accent-900 dark:text-accent-100"
                >Allow auto squad submission</span
            >
            <p class="text-xs text-accent-500">
                When enabled, starting a live game will automatically generate
                squads from team rosters. When disabled, teams must submit their
                squads before starting a game.
            </p>
        </div>
    </label>

    {#if form_data.allow_auto_squad_submission}
        <div class="pl-8 space-y-4">
            <div>
                <label
                    class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                    for="squad_generation_strategy"
                >
                    Squad Generation Strategy
                    <InfoTooltip
                        tooltip_text="How to select players for auto-generated squads: 'First Available' picks the first X team members alphabetically. 'Previous Match' uses the team's squad from their last match in this competition."
                        position="right"
                    />
                </label>
                <select
                    id="squad_generation_strategy"
                    bind:value={form_data.squad_generation_strategy}
                    class="block w-full sm:w-64 px-3 py-2 border border-accent-300 rounded-[0.175rem] shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                >
                    <option value="first_available"
                        >First Available Players</option
                    >
                    <option value="previous_match">Previous Match Squad</option>
                </select>
                <p class="text-xs text-accent-500 mt-1">
                    {#if form_data.squad_generation_strategy === "first_available"}
                        Selects the first X players from the team roster
                        alphabetically
                    {:else}
                        Uses the team's squad from their previous match in this
                        competition. Falls back to first available if no
                        previous match exists.
                    {/if}
                </p>
            </div>

            <div>
                <label
                    class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                    for="lineup_submission_deadline_hours"
                >
                    Lineup Submission Deadline (hours before match)
                    <InfoTooltip
                        tooltip_text="How many hours before match start time teams must submit their lineups. When set > 0, auto-submission must remain enabled to prevent soft locks where no lineup can be submitted after deadline."
                        position="right"
                    />
                </label>
                <input
                    id="lineup_submission_deadline_hours"
                    type="number"
                    bind:value={form_data.lineup_submission_deadline_hours}
                    min={0}
                    max={72}
                    class="block w-full sm:w-32 px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                />
                <p class="text-xs text-accent-500 mt-1">
                    Teams must submit lineups at least {form_data.lineup_submission_deadline_hours ??
                        0} hour{(form_data.lineup_submission_deadline_hours ??
                        0) !== 1
                        ? "s"
                        : ""} before match time.
                    {#if (form_data.lineup_submission_deadline_hours ?? 0) > 0}
                        <span class="text-violet-600 dark:text-violet-400"
                            >Auto-submission is required when deadline is set.</span
                        >
                    {/if}
                </p>
            </div>
        </div>
    {/if}

    <label class="flex items-center gap-3 cursor-pointer">
        <input
            type="checkbox"
            bind:checked={form_data.allow_auto_fixture_details_setup}
            class="w-5 h-5 text-primary-600 rounded border-accent-300"
        />
        <div>
            <span
                class="text-sm font-medium text-accent-900 dark:text-accent-100"
                >Allow auto fixture details setup</span
            >
            <p class="text-xs text-accent-500">
                When enabled, starting a live game without fixture details will
                redirect to auto-create them with pre-filled officials and
                jersey colors.
            </p>
        </div>
    </label>
</div>
