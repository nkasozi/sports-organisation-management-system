<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import { create_fixture_lineup_create_dependencies } from "$lib/presentation/logic/fixtureLineupCreateData";
    import type {
        FixtureLineupCreateFixtureState,
        FixtureLineupCreateOrganizationState,
        FixtureLineupCreateTeamState,
    } from "$lib/presentation/logic/fixtureLineupCreatePageContracts";
    import {
        build_fixture_lineup_create_page_derived_state,
        sync_fixture_lineup_create_selected_organization,
    } from "$lib/presentation/logic/fixtureLineupCreatePageControllerDerived";
    import { create_fixture_lineup_create_page_controller_state } from "$lib/presentation/logic/fixtureLineupCreatePageControllerInitialState";
    import { create_fixture_lineup_create_page_controller_runtime } from "$lib/presentation/logic/fixtureLineupCreatePageControllerRuntime";
    import {
        build_fixture_lineup_create_auth_profile_state,
        build_fixture_lineup_create_page_view_handlers,
        build_fixture_lineup_create_page_view_props,
        has_authorization_defaults_changed,
    } from "$lib/presentation/logic/fixtureLineupCreatePageControllerView";
    import { apply_fixture_lineup_authorization_defaults } from "$lib/presentation/logic/fixtureLineupCreatePageFlow";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { auth_store } from "$lib/presentation/stores/auth";

    import FixtureLineupCreatePageView from "./FixtureLineupCreatePageView.svelte";

    const dependencies = create_fixture_lineup_create_dependencies();
    let {
        form_data,
        selected_fixture_state,
        selected_team_state,
        selected_organization_state,
        team_players,
        min_players,
        max_players,
        starters_count,
        current_step_index,
        confirm_lock_understood,
        player_search_text,
        loading,
        saving,
        error_message,
        organizations,
        fixtures,
        all_teams,
        all_competitions,
        available_teams,
        fixtures_with_complete_lineups,
        validation_errors,
        fixture_team_label_by_team_id,
        teams_with_existing_lineups,
        current_auth_profile_state,
    } = create_fixture_lineup_create_page_controller_state();
    $: current_auth_profile_state =
        build_fixture_lineup_create_auth_profile_state(
            $auth_store.current_profile,
        );
    $: derived_state = build_fixture_lineup_create_page_derived_state({
        current_auth_profile_state,
        form_data,
        selected_organization_state,
        selected_fixture_state,
        selected_team_state,
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
    });
    $: {
        const next_form_data = apply_fixture_lineup_authorization_defaults({
            form_data,
            current_auth_profile_state,
        });
        if (has_authorization_defaults_changed(form_data, next_form_data))
            form_data = next_form_data;
    }
    $: if (
        form_data.organization_id &&
        organizations.length > 0 &&
        selected_organization_state.status === PRESENCE_STATUS.MISSING
    )
        selected_organization_state =
            sync_fixture_lineup_create_selected_organization(
                form_data.organization_id,
                organizations,
            );
    const runtime = create_fixture_lineup_create_page_controller_runtime({
        dependencies,
        get_confirm_lock_understood: () => confirm_lock_understood,
        get_current_auth_profile_state: () => current_auth_profile_state,
        get_fixtures_with_complete_lineups: () =>
            fixtures_with_complete_lineups,
        get_form_data: () => form_data,
        get_max_players: () => max_players,
        get_min_players: () => min_players,
        get_organization_is_restricted: () =>
            derived_state.organization_is_restricted,
        get_organizations: () => organizations,
        get_selected_fixture_state: () => selected_fixture_state,
        get_selected_organization_state: () => selected_organization_state,
        get_selected_team_state: () => selected_team_state,
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
        set_selected_fixture_state: (value: FixtureLineupCreateFixtureState) =>
            (selected_fixture_state = value),
        set_selected_organization_state: (
            value: FixtureLineupCreateOrganizationState,
        ) => (selected_organization_state = value),
        set_selected_team_state: (value: FixtureLineupCreateTeamState) =>
            (selected_team_state = value),
        set_starters_count: (value: number) => (starters_count = value),
        set_team_players: (value: TeamPlayer[]) => (team_players = value),
        set_teams_with_existing_lineups: (value: Map<string, string>) =>
            (teams_with_existing_lineups = value),
        set_validation_errors: (value: Record<string, string>) =>
            (validation_errors = value),
    });

    const view_handlers = build_fixture_lineup_create_page_view_handlers({
        runtime,
        goto,
        get_starters_count: () => starters_count,
    });
    $: view_props = build_fixture_lineup_create_page_view_props({
        derived_state,
        form_data,
        organizations,
        selected_organization_state,
        selected_team_state,
        fixtures_with_complete_lineups,
        teams_with_existing_lineups,
        available_teams,
    });

    onMount(() => void runtime.initialize_page());
</script>

<svelte:head><title>Create Fixture Lineup - Sport-Sync</title></svelte:head>

<FixtureLineupCreatePageView
    {...view_props}
    {...view_handlers}
    {min_players}
    {max_players}
    {loading}
    {saving}
    {error_message}
    {validation_errors}
    bind:current_step_index
    {starters_count}
    {player_search_text}
    {confirm_lock_understood}
    on_player_search_change={(search_text) =>
        (player_search_text = search_text)}
    on_confirm_change={(is_checked) => (confirm_lock_understood = is_checked)}
    on_notes_change={(notes) => (form_data.notes = notes)}
/>
