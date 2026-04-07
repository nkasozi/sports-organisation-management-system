<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

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
    import {
        get_authorization_preselect_values,
        is_field_restricted_by_authorization,
    } from "$lib/core/interfaces/ports";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
    import {
        build_error_message,
        convert_team_player_to_lineup_player,
        determine_initial_wizard_step,
        determine_step_after_team_auto_selected,
    } from "$lib/core/services/fixtureLineupWizard";
    import type { TeamPlayer } from "$lib/core/services/teamPlayers";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_competition_team_use_cases,
        get_competition_use_cases,
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_organization_use_cases,
        get_player_position_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import FixtureLineupCreatePageContent from "$lib/presentation/components/fixture/FixtureLineupCreatePageContent.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        load_fixture_lineup_create_fixture_data,
        load_fixture_lineup_create_reference_data,
        load_fixture_lineup_create_team_data,
        submit_fixture_lineup_create_form,
    } from "$lib/presentation/logic/fixtureLineupCreateData";
    import {
        build_filtered_team_players,
        build_fixture_lineup_create_wizard_steps,
        get_fixture_display_name,
        get_player_role_label,
    } from "$lib/presentation/logic/fixtureLineupCreateState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    const dependencies = {
        lineup_use_cases: get_fixture_lineup_use_cases(),
        fixture_use_cases: get_fixture_use_cases(),
        team_use_cases: get_team_use_cases(),
        player_use_cases: get_player_use_cases(),
        competition_use_cases: get_competition_use_cases(),
        competition_team_use_cases: get_competition_team_use_cases(),
        membership_use_cases: get_player_team_membership_use_cases(),
        player_position_use_cases: get_player_position_use_cases(),
        organization_use_cases: get_organization_use_cases(),
    };
    let form_data: CreateFixtureLineupInput =
            create_empty_fixture_lineup_input(),
        selected_fixture: Fixture | null = null,
        selected_team: Team | null = null,
        selected_organization: Organization | null = null;
    let team_players: TeamPlayer[] = [],
        min_players = 2,
        max_players = 18,
        starters_count = 11,
        current_step_index = 0,
        confirm_lock_understood = false,
        player_search_text = "",
        loading = true,
        saving = false,
        error_message = "";
    let organizations: Organization[] = [],
        fixtures: Fixture[] = [],
        all_teams: Team[] = [],
        all_competitions: Competition[] = [],
        available_teams: Team[] = [],
        fixtures_with_complete_lineups = new Set<string>(),
        validation_errors: Record<string, string> = {},
        fixture_team_label_by_team_id = new Map<string, string>(),
        teams_with_existing_lineups = new Map<string, string>();

    $: current_auth_profile =
        $auth_store.current_profile as UserScopeProfile | null;
    $: organization_is_restricted = is_field_restricted_by_authorization(
        current_auth_profile,
        "organization_id",
    );
    $: team_is_restricted = is_field_restricted_by_authorization(
        current_auth_profile,
        "team_id",
    );
    $: user_team_id = current_auth_profile?.team_id;
    $: current_fixture_title = selected_fixture
        ? get_fixture_display_name(
              selected_fixture,
              all_teams,
              all_competitions,
          )
        : "";
    $: organization_select_options = organizations.map((organization) => ({
        value: organization.id,
        label: organization.name,
    }));
    $: all_fixtures_for_org = selected_organization
        ? fixtures.filter(
              (fixture) =>
                  fixture.organization_id === selected_organization?.id,
          )
        : fixtures;
    $: fixtures_for_user_team =
        team_is_restricted && user_team_id
            ? all_fixtures_for_org.filter(
                  (fixture) =>
                      fixture.home_team_id === user_team_id ||
                      fixture.away_team_id === user_team_id,
              )
            : all_fixtures_for_org;
    $: non_scheduled_fixtures_count = fixtures_for_user_team.filter(
        (fixture) => fixture.status !== "scheduled",
    ).length;
    $: fixtures_for_organization = fixtures_for_user_team.filter(
        (fixture) =>
            fixture.status === "scheduled" &&
            !fixtures_with_complete_lineups.has(fixture.id),
    );
    $: fixture_select_options = fixtures_for_organization.map((fixture) => ({
        value: fixture.id,
        label: get_fixture_display_name(fixture, all_teams, all_competitions),
        group:
            all_competitions.find(
                (competition) => competition.id === fixture.competition_id,
            )?.name || "",
    }));
    $: team_select_options = available_teams.map((team) => ({
        value: team.id,
        label: fixture_team_label_by_team_id.get(team.id) || team.name,
    }));
    $: filtered_team_players = build_filtered_team_players(
        team_players,
        player_search_text,
    );
    $: wizard_steps = build_fixture_lineup_create_wizard_steps(
        selected_organization,
        selected_fixture,
        selected_team,
        form_data.selected_players.length,
        min_players,
        max_players,
        confirm_lock_understood,
    );
    $: if (!form_data.organization_id)
        form_data.organization_id =
            get_authorization_preselect_values(current_auth_profile)
                .organization_id || "";
    $: if (!form_data.team_id)
        form_data.team_id =
            get_authorization_preselect_values(current_auth_profile).team_id ||
            "";
    $: if (
        form_data.organization_id &&
        organizations.length > 0 &&
        !selected_organization
    )
        selected_organization =
            organizations.find(
                (organization) => organization.id === form_data.organization_id,
            ) || null;

    function reset_team_and_roster(): void {
        form_data.team_id = "";
        form_data.selected_players = [];
        selected_team = null;
        team_players = [];
        available_teams = [];
    }
    async function load_reference_data(): Promise<void> {
        const result = await load_fixture_lineup_create_reference_data(
            current_auth_profile,
            form_data.organization_id,
            dependencies,
        );
        fixtures = result.fixtures;
        all_teams = result.all_teams;
        all_competitions = result.all_competitions;
        organizations = result.organizations;
        selected_organization = result.selected_organization;
        error_message = result.error_message;
    }
    function handle_organization_change(organization_id: string): void {
        form_data.organization_id = organization_id;
        error_message = "";
        validation_errors = {};
        if (!organization_id) {
            selected_organization = null;
            selected_fixture = null;
            form_data.fixture_id = "";
            reset_team_and_roster();
            current_step_index = 0;
            return;
        }
        selected_organization =
            organizations.find(
                (organization) => organization.id === organization_id,
            ) || null;
        selected_fixture = null;
        form_data.fixture_id = "";
        reset_team_and_roster();
    }

    async function handle_fixture_change(fixture_id: string): Promise<void> {
        form_data.fixture_id = fixture_id;
        error_message = "";
        validation_errors = {};
        confirm_lock_understood = false;
        player_search_text = "";
        if (!fixture_id) {
            selected_fixture = null;
            fixture_team_label_by_team_id = new Map();
            teams_with_existing_lineups = new Map();
            reset_team_and_roster();
            current_step_index = 1;
            return;
        }
        const result = await load_fixture_lineup_create_fixture_data(
            fixture_id,
            current_auth_profile,
            dependencies,
        );
        if (!result.success) {
            error_message = result.error_message;
            if (result.should_clear_fixture) {
                fixtures_with_complete_lineups = result.error_message.includes(
                    "All teams have already submitted",
                )
                    ? new Set([...fixtures_with_complete_lineups, fixture_id])
                    : fixtures_with_complete_lineups;
                selected_fixture = null;
                form_data.fixture_id = "";
            }
            fixture_team_label_by_team_id = new Map();
            teams_with_existing_lineups = new Map();
            reset_team_and_roster();
            current_step_index = 1;
            return;
        }
        selected_fixture = result.data.selected_fixture;
        form_data.organization_id = result.data.organization_id;
        selected_organization =
            organizations.find(
                (organization) =>
                    organization.id === result.data.organization_id,
            ) || selected_organization;
        min_players = result.data.min_players;
        max_players = result.data.max_players;
        starters_count = result.data.starters_count;
        available_teams = result.data.available_teams;
        fixture_team_label_by_team_id =
            result.data.fixture_team_label_by_team_id;
        teams_with_existing_lineups = result.data.teams_with_existing_lineups;
        reset_team_and_roster();
        if (result.data.auto_selected_team_id) {
            await handle_team_change(result.data.auto_selected_team_id);
            current_step_index = determine_step_after_team_auto_selected({
                has_selected_team: Boolean(selected_team),
                team_players_count: team_players.length,
            });
            return;
        }
        current_step_index = 2;
    }

    async function handle_team_change(team_id: string): Promise<void> {
        form_data.team_id = team_id;
        validation_errors = {};
        error_message = "";
        confirm_lock_understood = false;
        player_search_text = "";
        if (!team_id) {
            selected_team = null;
            team_players = [];
            form_data.selected_players = [];
            return;
        }
        const result = await load_fixture_lineup_create_team_data(
            team_id,
            selected_fixture,
            current_auth_profile,
            max_players,
            dependencies,
        );
        selected_team = result.selected_team;
        team_players = result.team_players;
        form_data.selected_players = result.selected_players;
        if (result.validation_error)
            validation_errors.players = result.validation_error;
        current_step_index = 2;
    }

    function validate_players_step(): boolean {
        validation_errors = {};
        const count = form_data.selected_players.length;
        if (count < min_players) {
            validation_errors.players = build_error_message(
                `Not enough players selected (${count} of minimum ${min_players}).`,
                `This fixture requires at least ${min_players} players to be selected.`,
                `Select ${min_players - count} more player(s) to continue.`,
            );
            return false;
        }
        if (count > max_players) {
            validation_errors.players = build_error_message(
                `Too many players selected (${count} of maximum ${max_players}).`,
                `This fixture allows a maximum of ${max_players} players.`,
                `Remove ${count - max_players} player(s) to continue.`,
            );
            return false;
        }
        return true;
    }
    function handle_step_change_attempt(
        from_step_index: number,
        to_step_index: number,
    ): boolean {
        if (to_step_index <= from_step_index) return true;
        if (from_step_index === 0 && !form_data.organization_id)
            return !(validation_errors.organization_id =
                "Please select an organization first.");
        if (from_step_index === 1 && !form_data.fixture_id)
            return !(validation_errors.fixture_id =
                "Please select a fixture first.");
        if (from_step_index === 2 && !form_data.team_id)
            return !(validation_errors.team_id = "Please select a team first.");
        return from_step_index !== 3 || validate_players_step();
    }
    function toggle_player_selection(player_id: string): void {
        const is_selected = form_data.selected_players.some(
            (player) => player.id === player_id,
        );
        if (is_selected) {
            form_data.selected_players = form_data.selected_players.filter(
                (player) => player.id !== player_id,
            );
            return;
        }
        if (form_data.selected_players.length >= max_players) {
            error_message = `Maximum ${max_players} players can be selected`;
            setTimeout(() => (error_message = ""), 3000);
            return;
        }
        const team_player = team_players.find(
            (player) => player.id === player_id,
        );
        if (team_player)
            form_data.selected_players = [
                ...form_data.selected_players,
                convert_team_player_to_lineup_player(team_player),
            ];
    }
    function select_all_players(): void {
        form_data.selected_players = team_players
            .slice(0, max_players)
            .map((player) => convert_team_player_to_lineup_player(player));
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
            validation_errors[
                [
                    "organization_id",
                    "fixture_id",
                    "team_id",
                    "players",
                    "confirm",
                ][result.step_index]
            ] = result.error_message;
            return;
        }
        void goto(`/fixture-lineups/${result.lineup_id}`);
    }

    onMount(async () => {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            loading = false;
            return;
        }
        const auth_state = get(auth_store);
        if (auth_state.current_token) {
            const authorization_result =
                await get_authorization_adapter().check_entity_authorized(
                    auth_state.current_token.raw_token,
                    "fixturelineup",
                    "create",
                );
            if (
                authorization_result.success &&
                !authorization_result.data.is_authorized
            ) {
                access_denial_store.set_denial(
                    "/fixture-lineups/create",
                    "Access denied: Your role does not have permission to create fixture lineups. Please contact your organization administrator if you believe this is an error.",
                );
                void goto("/");
                return;
            }
        }
        await load_reference_data();
        loading = false;
        current_step_index = determine_initial_wizard_step({
            organization_is_restricted,
            organization_id: form_data.organization_id,
            has_selected_organization: Boolean(selected_organization),
        });
    });
</script>

<svelte:head><title>Create Fixture Lineup - Sport-Sync</title></svelte:head>

<FixtureLineupCreatePageContent
    {min_players}
    {max_players}
    {loading}
    {saving}
    {error_message}
    {validation_errors}
    {wizard_steps}
    bind:current_step_index
    selected_organization_id={form_data.organization_id}
    selected_fixture_id={form_data.fixture_id}
    selected_team_id={form_data.team_id}
    {organization_select_options}
    {organization_is_restricted}
    organizations_count={organizations.length}
    has_selected_organization={Boolean(selected_organization)}
    {fixture_select_options}
    fixtures_for_organization_count={fixtures_for_organization.length}
    all_fixtures_for_org_count={all_fixtures_for_org.length}
    {non_scheduled_fixtures_count}
    fixtures_with_complete_lineups_count={fixtures_with_complete_lineups.size}
    {team_is_restricted}
    {current_fixture_title}
    existing_lineup_team_names={Array.from(
        teams_with_existing_lineups.values(),
    )}
    available_teams_count={available_teams.length}
    {team_select_options}
    selected_players={form_data.selected_players}
    {starters_count}
    {player_search_text}
    {filtered_team_players}
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
