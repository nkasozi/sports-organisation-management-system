<script lang="ts">
    import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import type { FixtureLineupCreateWizardStep } from "$lib/presentation/logic/fixtureLineupCreateState";

    import FixtureLineupCreatePageContent from "./FixtureLineupCreatePageContent.svelte";

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

<FixtureLineupCreatePageContent
    {min_players}
    {max_players}
    {loading}
    {saving}
    {error_message}
    {validation_errors}
    {wizard_steps}
    bind:current_step_index
    {selected_organization_id}
    {selected_fixture_id}
    {selected_team_id}
    {organization_select_options}
    {organization_is_restricted}
    {organizations_count}
    {has_selected_organization}
    {fixture_select_options}
    {fixtures_for_organization_count}
    {all_fixtures_for_org_count}
    {non_scheduled_fixtures_count}
    {fixtures_with_complete_lineups_count}
    {team_is_restricted}
    {current_fixture_title}
    {existing_lineup_team_names}
    {available_teams_count}
    {team_select_options}
    {selected_players}
    {starters_count}
    {player_search_text}
    {filtered_team_players}
    {selected_team_name}
    {confirm_lock_understood}
    {notes}
    {on_validate_step_change}
    {on_cancel}
    {on_submit}
    {on_organization_change}
    {on_fixture_change}
    {on_team_change}
    {on_player_search_change}
    {on_select_all}
    {on_deselect_all}
    {on_toggle_player}
    {get_player_role_label}
    {on_confirm_change}
    {on_notes_change}
/>
