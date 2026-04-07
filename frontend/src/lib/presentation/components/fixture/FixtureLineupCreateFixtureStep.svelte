<script lang="ts">
    import SelectField from "$lib/presentation/components/ui/SelectField.svelte";

    export let has_selected_organization: boolean;
    export let selected_fixture_id: string;
    export let fixture_select_options: Array<{
        value: string;
        label: string;
        group?: string;
    }>;
    export let loading: boolean;
    export let saving: boolean;
    export let team_is_restricted: boolean;
    export let validation_error: string;
    export let fixtures_for_organization_count: number;
    export let all_fixtures_for_org_count: number;
    export let non_scheduled_fixtures_count: number;
    export let fixtures_with_complete_lineups_count: number;
    export let on_change: (fixture_id: string) => void;
</script>

<div>
    <SelectField
        label="Fixture"
        name="fixture"
        value={selected_fixture_id}
        options={fixture_select_options}
        placeholder={!has_selected_organization
            ? "Select an organization first"
            : fixtures_for_organization_count === 0
              ? "No fixtures available"
              : team_is_restricted
                ? "Select fixture (your team only)..."
                : "Search fixture..."}
        required={true}
        disabled={!has_selected_organization || loading || saving}
        is_loading={loading}
        error={validation_error}
        on:change={(event) => on_change(event.detail.value)}
    />
</div>
{#if team_is_restricted && has_selected_organization && !loading}<div
        class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
    >
        <p class="text-sm text-blue-800 dark:text-blue-200">
            <span class="font-medium">Team Manager:</span> Only showing fixtures involving
            your team.
        </p>
    </div>{/if}
{#if fixtures_for_organization_count === 0 && has_selected_organization && !loading}<div
        class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300"
    >
        <p class="font-semibold">No fixtures available for lineup submission</p>
        <p class="mt-2 text-sm">
            Only fixtures with status "Scheduled" that still need team lineups
            are shown.
        </p>
        {#if all_fixtures_for_org_count > 0}<ul
                class="mt-2 text-sm list-disc list-inside"
            >
                {#if non_scheduled_fixtures_count > 0}<li>
                        {non_scheduled_fixtures_count} fixture{non_scheduled_fixtures_count ===
                        1
                            ? " is"
                            : "s are"} not scheduled (in progress, completed, postponed,
                        or cancelled)
                    </li>{/if}{#if fixtures_with_complete_lineups_count > 0}<li>
                        {fixtures_with_complete_lineups_count} fixture{fixtures_with_complete_lineups_count ===
                        1
                            ? " has"
                            : "s have"} all team lineups already submitted
                    </li>{/if}
            </ul>{:else}<p class="mt-2 text-sm">
                Create fixtures first (Fixtures tab), then come back here to
                submit a lineup.
            </p>{/if}
    </div>{/if}
{#if fixtures_for_organization_count > 0 && (non_scheduled_fixtures_count > 0 || fixtures_with_complete_lineups_count > 0) && has_selected_organization && !loading}<div
        class="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700"
    >
        <p class="text-sm text-violet-800 dark:text-violet-200">
            <span class="font-medium">Note:</span> Only showing scheduled
            fixtures that still need lineups.{#if non_scheduled_fixtures_count > 0}
                {non_scheduled_fixtures_count} fixture{non_scheduled_fixtures_count ===
                1
                    ? " is"
                    : "s are"} hidden (not scheduled).{/if}
        </p>
    </div>{/if}
