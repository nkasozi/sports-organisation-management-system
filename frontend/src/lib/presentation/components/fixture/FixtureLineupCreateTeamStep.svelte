<script lang="ts">
    import SelectField from "$lib/presentation/components/ui/SelectField.svelte";

    export let current_fixture_title: string;
    export let existing_lineup_team_names: string[];
    export let available_teams_count: number;
    export let has_selected_fixture: boolean;
    export let selected_team_id: string;
    export let team_is_restricted: boolean;
    export let validation_error: string;
    export let team_select_options: Array<{ value: string; label: string }>;
    export let saving: boolean;
    export let on_change: (team_id: string) => void;
</script>

<div class="space-y-4">
    <div class="mb-4">
        <div class="text-sm text-accent-600 dark:text-accent-300">
            {current_fixture_title || "Select a fixture first."}
        </div>
    </div>
    {#if existing_lineup_team_names.length > 0}<div
            class="mb-4 p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700"
        >
            <div class="flex items-start gap-3">
                <svg
                    class="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    ><path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    /></svg
                >
                <div>
                    <p class="font-medium text-violet-800 dark:text-violet-200">
                        Some teams have already submitted lineups
                    </p>
                    <p
                        class="mt-1 text-sm text-violet-700 dark:text-violet-300"
                    >
                        The following teams already have a lineup for this
                        fixture and are not shown below:
                    </p>
                    <ul
                        class="mt-2 text-sm text-violet-700 dark:text-violet-300 list-disc list-inside"
                    >
                        {#each existing_lineup_team_names as team_name}<li>
                                {team_name}
                            </li>{/each}
                    </ul>
                    {#if available_teams_count === 0}<p
                            class="mt-2 text-sm font-medium text-violet-800 dark:text-violet-200"
                        >
                            All teams in this fixture have already submitted
                            their lineups.
                        </p>{/if}
                </div>
            </div>
        </div>{/if}<SelectField
        label="Team"
        name="team"
        value={selected_team_id}
        options={team_select_options}
        placeholder={!has_selected_fixture
            ? "Select a fixture first"
            : available_teams_count === 0
              ? "All teams have submitted lineups"
              : team_is_restricted
                ? "Your team (auto-selected)"
                : "Search home/away team..."}
        required={true}
        disabled={!has_selected_fixture ||
            saving ||
            available_teams_count === 0 ||
            team_is_restricted}
        error={validation_error}
        on:change={(event) => on_change(event.detail.value)}
    />{#if team_is_restricted && has_selected_fixture}<div
            class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
        >
            <p class="text-sm text-blue-800 dark:text-blue-200">
                <span class="font-medium">Team Manager:</span> Your team is automatically
                selected. You can only submit lineups for your assigned team.
            </p>
        </div>{/if}
</div>
