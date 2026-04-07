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
    import {
        create_fixture_lineup_create_dependencies,
        submit_fixture_lineup_create_form,
    } from "$lib/presentation/logic/fixtureLineupCreateData";
    import {
        build_fixture_lineup_create_page_derived_state,
        sync_fixture_lineup_create_selected_organization,
    } from "$lib/presentation/logic/fixtureLineupCreatePageControllerDerived";
    import { initialize_fixture_lineup_create_page } from "$lib/presentation/logic/fixtureLineupCreatePageControllerInitialization";
    import {
        build_fixture_lineup_create_fixture_change_state,
        build_fixture_lineup_create_reference_state,
        build_fixture_lineup_create_team_change_state,
        get_fixture_lineup_create_validation_field,
    } from "$lib/presentation/logic/fixtureLineupCreatePageControllerUpdates";
    import {
        apply_fixture_lineup_authorization_defaults,
        handle_fixture_lineup_create_fixture_change,
        handle_fixture_lineup_create_organization_change,
        handle_fixture_lineup_create_step_change_attempt,
        handle_fixture_lineup_create_team_change,
        reset_fixture_lineup_create_team_state,
        select_all_fixture_lineup_create_players,
        toggle_fixture_lineup_create_player,
    } from "$lib/presentation/logic/fixtureLineupCreatePageFlow";
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

    function reset_interaction_state(): void {
        error_message = "";
        validation_errors = {};
        confirm_lock_understood = false;
        player_search_text = "";
    }
    function apply_team_reset(): void {
        const reset_state = reset_fixture_lineup_create_team_state();
        form_data = { ...form_data, ...reset_state.form_data };
        selected_team = reset_state.selected_team;
        team_players = reset_state.team_players;
        available_teams = reset_state.available_teams;
    }
    function handle_organization_change(organization_id: string): void {
        const next_state = handle_fixture_lineup_create_organization_change({
            organization_id,
            organizations,
        });
        form_data = { ...form_data, ...next_state.form_data };
        error_message = next_state.error_message;
        validation_errors = next_state.validation_errors;
        selected_organization = next_state.selected_organization;
        selected_fixture = next_state.selected_fixture;
        apply_team_reset();
        current_step_index = next_state.current_step_index;
    }

    async function handle_fixture_change(fixture_id: string): Promise<void> {
        reset_interaction_state();
        const result = await handle_fixture_lineup_create_fixture_change({
            fixture_id,
            current_auth_profile,
            organizations,
            dependencies,
            fixtures_with_complete_lineups,
            team_players_count: team_players.length,
        });
        ({
            error_message,
            form_data,
            selected_fixture,
            selected_organization,
            min_players,
            max_players,
            starters_count,
            available_teams,
            fixture_team_label_by_team_id,
            teams_with_existing_lineups,
            selected_team,
            team_players,
            fixtures_with_complete_lineups,
        } = build_fixture_lineup_create_fixture_change_state(
            result,
            form_data,
        ));
        if (result.auto_selected_team_id) {
            await handle_team_change(result.auto_selected_team_id);
            current_step_index = 3;
            return;
        }
        current_step_index = result.current_step_index;
    }

    async function handle_team_change(team_id: string): Promise<void> {
        reset_interaction_state();
        const result = await handle_fixture_lineup_create_team_change({
            team_id,
            selected_fixture,
            current_auth_profile,
            max_players,
            dependencies,
        });
        ({ selected_team, team_players, form_data, validation_errors } =
            build_fixture_lineup_create_team_change_state(
                result,
                form_data,
                team_id,
            ));
        current_step_index = 2;
    }

    function handle_step_change_attempt(
        from_step_index: number,
        to_step_index: number,
    ): boolean {
        const result = handle_fixture_lineup_create_step_change_attempt({
            from_step_index,
            to_step_index,
            form_data,
            min_players,
            max_players,
        });
        validation_errors = result.validation_errors;
        return result.is_allowed;
    }

    function toggle_player_selection(player_id: string): void {
        const result = toggle_fixture_lineup_create_player({
            form_data,
            team_players,
            player_id,
            max_players,
        });
        form_data.selected_players = result.selected_players;
        error_message = result.error_message || error_message;
        if (result.error_message) setTimeout(() => (error_message = ""), 3000);
    }

    function select_all_players(): void {
        form_data.selected_players = select_all_fixture_lineup_create_players({
            team_players,
            max_players,
        });
    }
    function deselect_all_players(): void {
        form_data.selected_players = [];
    }

    async function handle_submit_locked_lineup(): Promise<void> {
        if (saving) return;
        saving = true;
        validation_errors = {};
        error_message = "";
        const result = await submit_fixture_lineup_create_form(
            form_data,
            selected_organization,
            selected_fixture,
            selected_team,
            min_players,
            max_players,
            confirm_lock_understood,
            dependencies,
        );
        saving = false;
        if (!result.success) {
            current_step_index = result.step_index;
            if (
                result.step_index === 4 &&
                !result.error_message.includes("Confirmation required")
            ) {
                error_message = result.error_message;
                return;
            }
            validation_errors = {
                ...validation_errors,
                [get_fixture_lineup_create_validation_field(result.step_index)]:
                    result.error_message,
            };
            return;
        }
        void goto(`/fixture-lineups/${result.lineup_id}`);
    }

    onMount(async () => {
        const initialization_result =
            await initialize_fixture_lineup_create_page({
                is_browser: browser,
                current_auth_profile,
                form_organization_id: form_data.organization_id,
                organization_is_restricted:
                    derived_state.organization_is_restricted,
                dependencies,
            });
        if (initialization_result.kind === "skip") return;
        if (initialization_result.kind === "auth-failed") {
            error_message = initialization_result.error_message;
            loading = false;
            return;
        }
        if (initialization_result.kind === "redirect") {
            void goto(initialization_result.redirect_to);
            return;
        }
        const reference_state = build_fixture_lineup_create_reference_state(
            initialization_result.reference_data,
        );
        fixtures = reference_state.fixtures;
        all_teams = reference_state.all_teams;
        all_competitions = reference_state.all_competitions;
        organizations = reference_state.organizations;
        selected_organization = reference_state.selected_organization;
        error_message = reference_state.error_message;
        loading = false;
        current_step_index = initialization_result.current_step_index;
    });
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
    on_validate_step_change={handle_step_change_attempt}
    on_cancel={() => void goto("/fixture-lineups")}
    on_submit={handle_submit_locked_lineup}
    on_organization_change={handle_organization_change}
    on_fixture_change={(fixture_id) => void handle_fixture_change(fixture_id)}
    on_team_change={(team_id) => void handle_team_change(team_id)}
    on_player_search_change={(search_text) =>
        (player_search_text = search_text)}
    on_select_all={select_all_players}
    on_deselect_all={deselect_all_players}
    on_toggle_player={toggle_player_selection}
    get_player_role_label={(player_index) =>
        get_player_role_label(player_index, starters_count)}
    on_confirm_change={(is_checked) => (confirm_lock_understood = is_checked)}
    on_notes_change={(notes) => (form_data.notes = notes)}
/>
