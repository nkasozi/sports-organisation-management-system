<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import {
        create_empty_fixture_lineup_input,
        type CreateFixtureLineupInput,
    } from "$lib/core/entities/FixtureLineup";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import { create_fixture_lineup_create_dependencies } from "$lib/presentation/logic/fixtureLineupCreateData";
    import {
        build_fixture_lineup_create_page_derived_state,
        sync_fixture_lineup_create_selected_organization,
    } from "$lib/presentation/logic/fixtureLineupCreatePageControllerDerived";
    import { create_fixture_lineup_create_page_controller_runtime } from "$lib/presentation/logic/fixtureLineupCreatePageControllerRuntime";
    import { apply_fixture_lineup_authorization_defaults } from "$lib/presentation/logic/fixtureLineupCreatePageFlow";
    import { get_player_role_label } from "$lib/presentation/logic/fixtureLineupCreateState";
    import { auth_store } from "$lib/presentation/stores/auth";

    import FixtureLineupCreatePageView from "./FixtureLineupCreatePageView.svelte";

    const dependencies = create_fixture_lineup_create_dependencies();
    let form_data: CreateFixtureLineupInput =
            create_empty_fixture_lineup_input(),
        selected_fixture: Fixture | null = null,
        selected_team: Team | null = null,
        selected_organization: Organization | null = null,
        team_players: TeamPlayer[] = [],
        min_players = 2,
        max_players = 18,
        starters_count = 11,
        current_step_index = 0,
        confirm_lock_understood = false,
        player_search_text = "",
        loading = true,
        saving = false,
        error_message = "",
        organizations: Organization[] = [],
        fixtures: Fixture[] = [],
        all_teams: Team[] = [],
        all_competitions: Competition[] = [],
        available_teams: Team[] = [],
        fixtures_with_complete_lineups = new Set<string>(),
        validation_errors: Record<string, string> = {},
        fixture_team_label_by_team_id = new Map<string, string>(),
        teams_with_existing_lineups = new Map<string, string>();
    let current_auth_profile: UserScopeProfile | null = null;
    function get_derived_state_input() {
        return {
            current_auth_profile,
            form_data,
            selected_organization,
            selected_fixture,
            selected_team,
            team_players,
            player_search_text,
            organizations,
            fixtures,
            all_teams,
            all_competitions,
            available_teams,
            fixtures_with_complete_lineups,
            fixture_team_label_by_team_id,
            min_players,
            max_players,
            confirm_lock_understood,
        };
    }
    let derived_state = build_fixture_lineup_create_page_derived_state(
        get_derived_state_input(),
    );

    $: current_auth_profile =
        $auth_store.current_profile as UserScopeProfile | null;
    $: derived_state = build_fixture_lineup_create_page_derived_state(
        get_derived_state_input(),
    );
    $: {
        const next_form_data = apply_fixture_lineup_authorization_defaults({
            form_data,
            current_auth_profile,
        });
        if (
            next_form_data.organization_id !== form_data.organization_id ||
            next_form_data.team_id !== form_data.team_id
        )
            form_data = next_form_data;
    }
    $: if (
        form_data.organization_id &&
        organizations.length > 0 &&
        !selected_organization
    )
        selected_organization =
            sync_fixture_lineup_create_selected_organization(
                form_data.organization_id,
                organizations,
            );
    const runtime = create_fixture_lineup_create_page_controller_runtime({
        dependencies,
        get_confirm_lock_understood: () => confirm_lock_understood,
        get_current_auth_profile: () => current_auth_profile,
        get_fixtures_with_complete_lineups: () =>
            fixtures_with_complete_lineups,
        get_form_data: () => form_data,
        get_max_players: () => max_players,
        get_min_players: () => min_players,
        get_organization_is_restricted: () =>
            derived_state.organization_is_restricted,
        get_organizations: () => organizations,
        get_selected_fixture: () => selected_fixture,
        get_selected_organization: () => selected_organization,
        get_selected_team: () => selected_team,
        get_team_players: () => team_players,
        goto,
        is_browser: browser,
        set_all_competitions: (value: Competition[]) =>
            (all_competitions = value),
        set_all_teams: (value: Team[]) => (all_teams = value),
        set_available_teams: (value: Team[]) => (available_teams = value),
        set_confirm_lock_understood: (value: boolean) =>
            (confirm_lock_understood = value),
        set_current_step_index: (value: number) => (current_step_index = value),
        set_error_message: (value: string) => (error_message = value),
        set_fixture_team_label_by_team_id: (value: Map<string, string>) =>
            (fixture_team_label_by_team_id = value),
        set_fixtures: (value: Fixture[]) => (fixtures = value),
        set_fixtures_with_complete_lineups: (value: Set<string>) =>
            (fixtures_with_complete_lineups = value),
        set_form_data: (value: CreateFixtureLineupInput) => (form_data = value),
        set_loading: (value: boolean) => (loading = value),
        set_max_players: (value: number) => (max_players = value),
        set_min_players: (value: number) => (min_players = value),
        set_organizations: (value: Organization[]) => (organizations = value),
        set_player_search_text: (value: string) => (player_search_text = value),
        set_saving: (value: boolean) => (saving = value),
        set_selected_fixture: (value: Fixture | null) =>
            (selected_fixture = value),
        set_selected_organization: (value: Organization | null) =>
            (selected_organization = value),
        set_selected_team: (value: Team | null) => (selected_team = value),
        set_starters_count: (value: number) => (starters_count = value),
        set_team_players: (value: TeamPlayer[]) => (team_players = value),
        set_teams_with_existing_lineups: (value: Map<string, string>) =>
            (teams_with_existing_lineups = value),
        set_validation_errors: (value: Record<string, string>) =>
            (validation_errors = value),
    });

    onMount(() => void runtime.initialize_page());
</script>

<svelte:head><title>Create Fixture Lineup - Sport-Sync</title></svelte:head>

<FixtureLineupCreatePageView
    {min_players}
    {max_players}
    {loading}
    {saving}
    {error_message}
    {validation_errors}
    wizard_steps={derived_state.wizard_steps}
    bind:current_step_index
    selected_organization_id={form_data.organization_id}
    selected_fixture_id={form_data.fixture_id}
    selected_team_id={form_data.team_id}
    organization_select_options={derived_state.organization_select_options}
    organization_is_restricted={derived_state.organization_is_restricted}
    organizations_count={organizations.length}
    has_selected_organization={Boolean(selected_organization)}
    fixture_select_options={derived_state.fixture_select_options}
    fixtures_for_organization_count={derived_state.fixtures_for_organization
        .length}
    all_fixtures_for_org_count={derived_state.all_fixtures_for_org.length}
    non_scheduled_fixtures_count={derived_state.non_scheduled_fixtures_count}
    fixtures_with_complete_lineups_count={fixtures_with_complete_lineups.size}
    team_is_restricted={derived_state.team_is_restricted}
    current_fixture_title={derived_state.current_fixture_title}
    existing_lineup_team_names={Array.from(
        teams_with_existing_lineups.values(),
    )}
    available_teams_count={available_teams.length}
    team_select_options={derived_state.team_select_options}
    selected_players={form_data.selected_players}
    {starters_count}
    {player_search_text}
    filtered_team_players={derived_state.filtered_team_players}
    selected_team_name={selected_team?.name || ""}
    {confirm_lock_understood}
    notes={form_data.notes || ""}
    on_validate_step_change={runtime.handle_step_change_attempt}
    on_cancel={() => void goto("/fixture-lineups")}
    on_submit={runtime.handle_submit_locked_lineup}
    on_organization_change={runtime.handle_organization_change}
    on_fixture_change={(fixture_id) =>
        void runtime.handle_fixture_change(fixture_id)}
    on_team_change={(team_id) => void runtime.handle_team_change(team_id)}
    on_player_search_change={(search_text) =>
        (player_search_text = search_text)}
    on_select_all={runtime.select_all_players}
    on_deselect_all={runtime.deselect_all_players}
    on_toggle_player={runtime.toggle_player_selection}
    get_player_role_label={(player_index) =>
        get_player_role_label(player_index, starters_count)}
    on_confirm_change={(is_checked) => (confirm_lock_understood = is_checked)}
    on_notes_change={(notes) => (form_data.notes = notes)}
/>
