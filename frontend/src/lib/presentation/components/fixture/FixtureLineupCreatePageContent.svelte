<script lang="ts">
    import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import FixtureLineupCreateConfirmStep from "$lib/presentation/components/fixture/FixtureLineupCreateConfirmStep.svelte";
    import FixtureLineupCreateFixtureStep from "$lib/presentation/components/fixture/FixtureLineupCreateFixtureStep.svelte";
    import FixtureLineupCreateOrganizationStep from "$lib/presentation/components/fixture/FixtureLineupCreateOrganizationStep.svelte";
    import FixtureLineupCreatePlayersStep from "$lib/presentation/components/fixture/FixtureLineupCreatePlayersStep.svelte";
    import FixtureLineupCreateTeamStep from "$lib/presentation/components/fixture/FixtureLineupCreateTeamStep.svelte";
    import UiWizardStepper from "$lib/presentation/components/UiWizardStepper.svelte";
    import type { FixtureLineupCreateWizardStep } from "$lib/presentation/logic/fixtureLineupCreateState";

    export let min_players: number;
    export let max_players: number;
    export let loading: boolean;
    export let saving: boolean;
    export let error_message: string;
    export let validation_errors: Record<string, string>;
    export let wizard_steps: FixtureLineupCreateWizardStep[];
    export let current_step_index: number;
    export let selected_organization_id: string;
    export let selected_fixture_id: string;
    export let selected_team_id: string;
    export let organization_select_options: Array<{
        value: string;
        label: string;
    }>;
    export let organization_is_restricted: boolean;
    export let organizations_count: number;
    export let has_selected_organization: boolean;
    export let fixture_select_options: Array<{
        value: string;
        label: string;
        group?: string;
    }>;
    export let fixtures_for_organization_count: number;
    export let all_fixtures_for_org_count: number;
    export let non_scheduled_fixtures_count: number;
    export let fixtures_with_complete_lineups_count: number;
    export let team_is_restricted: boolean;
    export let current_fixture_title: string;
    export let existing_lineup_team_names: string[];
    export let available_teams_count: number;
    export let team_select_options: Array<{ value: string; label: string }>;
    export let selected_players: CreateFixtureLineupInput["selected_players"];
    export let starters_count: number;
    export let player_search_text: string;
    export let filtered_team_players: TeamPlayer[];
    export let selected_team_name: string;
    export let confirm_lock_understood: boolean;
    export let notes: string;
    export let on_validate_step_change: (
        from_step_index: number,
        to_step_index: number,
    ) => boolean;
    export let on_cancel: () => void;
    export let on_submit: () => Promise<void>;
    export let on_organization_change: (organization_id: string) => void;
    export let on_fixture_change: (fixture_id: string) => void;
    export let on_team_change: (team_id: string) => void;
    export let on_player_search_change: (search_text: string) => void;
    export let on_select_all: () => void;
    export let on_deselect_all: () => void;
    export let on_toggle_player: (player_id: string) => void;
    export let get_player_role_label: (player_index: number) => string;
    export let on_confirm_change: (is_checked: boolean) => void;
    export let on_notes_change: (notes: string) => void;
</script>

<div class="space-y-6">
    <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
    >
        <div class="mb-6">
            <h1
                class="text-2xl font-bold text-accent-900 dark:text-accent-100 mb-2"
            >
                Create Fixture Lineup
            </h1>
            <p class="text-accent-600 dark:text-accent-300">
                Select players for this team's lineup ({min_players}-{max_players}
                players)
            </p>
        </div>
        {#if error_message}<div
                class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
                <p class="text-red-600 dark:text-red-400 whitespace-pre-line">
                    {error_message}
                </p>
            </div>{/if}{#if Object.keys(validation_errors).length > 0}<div
                class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
                <ul class="list-disc pl-5">
                    {#each Object.entries(validation_errors) as [key, msg]}<li
                            class="text-red-600 dark:text-red-400 whitespace-pre-line"
                        >
                            {msg}
                        </li>{/each}
                </ul>
            </div>{/if}<UiWizardStepper
            steps={wizard_steps}
            bind:current_step_index
            is_mobile_view={true}
            is_busy={saving}
            validate_step_change={on_validate_step_change}
            on:wizard_cancelled={on_cancel}
            on:wizard_completed={() => void on_submit()}
            ><svelte:fragment let:step_index
                ><div class="space-y-6">
                    {#if step_index === 0}<FixtureLineupCreateOrganizationStep
                            {selected_organization_id}
                            {organization_select_options}
                            {loading}
                            {saving}
                            {organization_is_restricted}
                            validation_error={validation_errors.organization_id ||
                                ""}
                            {organizations_count}
                            on_change={on_organization_change}
                        />{/if}{#if step_index === 1}<FixtureLineupCreateFixtureStep
                            {has_selected_organization}
                            {selected_fixture_id}
                            {fixture_select_options}
                            {loading}
                            {saving}
                            {team_is_restricted}
                            validation_error={validation_errors.fixture_id ||
                                ""}
                            {fixtures_for_organization_count}
                            {all_fixtures_for_org_count}
                            {non_scheduled_fixtures_count}
                            {fixtures_with_complete_lineups_count}
                            on_change={on_fixture_change}
                        />{/if}{#if step_index === 2}<FixtureLineupCreateTeamStep
                            {current_fixture_title}
                            {existing_lineup_team_names}
                            {available_teams_count}
                            has_selected_fixture={Boolean(selected_fixture_id)}
                            {selected_team_id}
                            {team_is_restricted}
                            validation_error={validation_errors.team_id || ""}
                            {team_select_options}
                            {saving}
                            on_change={on_team_change}
                        />{/if}{#if step_index === 3}<FixtureLineupCreatePlayersStep
                            {current_fixture_title}
                            {selected_players}
                            {max_players}
                            {min_players}
                            {starters_count}
                            {player_search_text}
                            has_selected_team={Boolean(selected_team_id)}
                            {filtered_team_players}
                            validation_error={validation_errors.players || ""}
                            {on_player_search_change}
                            {on_select_all}
                            {on_deselect_all}
                            {on_toggle_player}
                            {get_player_role_label}
                        />{/if}{#if step_index === 4}<FixtureLineupCreateConfirmStep
                            {current_fixture_title}
                            {selected_team_name}
                            {selected_players}
                            {starters_count}
                            {confirm_lock_understood}
                            validation_error={validation_errors.confirm || ""}
                            {notes}
                            {on_confirm_change}
                            {on_notes_change}
                        />{/if}
                </div></svelte:fragment
            ></UiWizardStepper
        >
    </div>
</div>
