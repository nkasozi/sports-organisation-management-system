<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { Team } from "$lib/core/entities/Team";
    import {
        get_gender_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { build_bulk_player_assignment_auth_snapshot } from "$lib/presentation/logic/bulkPlayerAssignmentAuthState";
    import { create_bulk_player_assignment_page_controller_runtime } from "$lib/presentation/logic/bulkPlayerAssignmentPageControllerRuntime";
    import {
        type BulkPlayerAssignmentSelectedTeamState,
        count_selected_players,
        filter_player_assignments_by_name,
        filter_player_assignments_by_team_gender,
        get_target_gender_label,
        type PlayerAssignment,
    } from "$lib/presentation/logic/bulkPlayerAssignmentPageState";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import type { ToastType } from "$lib/presentation/logic/toastConfig";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import {
        BULK_PLAYER_ASSIGNMENT_PAGE_TEXT,
        PLAYER_ASSIGNMENT_TEAM_STATUS,
    } from "./bulkPlayerAssignmentMessages";
    import BulkPlayerAssignmentPageShell from "./BulkPlayerAssignmentPageShell.svelte";
    import {
        apply_bulk_assignment_error_message,
        apply_bulk_assignment_loading_flag,
        apply_bulk_assignment_saving_flag,
        BULK_PLAYER_ASSIGNMENT_INITIAL_STATE,
        type BulkPlayerAssignmentPageStatusState,
    } from "./bulkPlayerAssignmentPageStatus";

    const bulk_player_assignment_dependencies = {
        player_use_cases: get_player_use_cases(),
        team_use_cases: get_team_use_cases(),
        membership_use_cases: get_player_team_membership_use_cases(),
        gender_use_cases: get_gender_use_cases(),
    };

    let teams: Team[] = [],
        selected_team_id = "",
        all_player_assignments: PlayerAssignment[] = [];
    let gender_name_map: Map<string, string> = new Map();
    let page_status_state: BulkPlayerAssignmentPageStatusState =
            BULK_PLAYER_ASSIGNMENT_INITIAL_STATE,
        search_query = "",
        toast_visible = false,
        toast_message = "",
        toast_type: ToastType = "info";

    let selected_team_state: BulkPlayerAssignmentSelectedTeamState = {
        status: PRESENCE_STATUS.MISSING,
    };

    $: {
        const selected_team = teams.find(
            (team: Team) => team.id === selected_team_id,
        );
        selected_team_state = selected_team
            ? { status: PRESENCE_STATUS.PRESENT, team: selected_team }
            : { status: PRESENCE_STATUS.MISSING };
    }
    $: gender_filtered_assignments = filter_player_assignments_by_team_gender(
        all_player_assignments,
        selected_team_state,
    );
    $: unassigned_players = gender_filtered_assignments.filter(
        (assignment: PlayerAssignment) =>
            assignment.current_team_state.status ===
            PLAYER_ASSIGNMENT_TEAM_STATUS.UNASSIGNED,
    );
    $: assigned_players_on_other_teams = gender_filtered_assignments.filter(
        (assignment: PlayerAssignment) =>
            assignment.current_team_state.status ===
                PLAYER_ASSIGNMENT_TEAM_STATUS.ASSIGNED &&
            assignment.current_team_state.team_id !== selected_team_id,
    );
    $: filtered_unassigned_players = filter_player_assignments_by_name(
        unassigned_players,
        search_query,
    );
    $: filtered_assigned_players = filter_player_assignments_by_name(
        assigned_players_on_other_teams,
        search_query,
    );
    $: selected_count = count_selected_players(
        unassigned_players,
        assigned_players_on_other_teams,
    );
    $: gender_filter_active =
        selected_team_state.status === PRESENCE_STATUS.PRESENT &&
        Boolean(selected_team_state.team.gender_id);
    $: target_gender_label = get_target_gender_label(
        selected_team_state,
        gender_name_map,
    );
    $: can_save = selected_count > 0 && selected_team_id !== "";

    function show_toast(message: string, type: ToastType): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
    const runtime = create_bulk_player_assignment_page_controller_runtime({
        access_denied_message: BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.access_denied,
        access_denied_path: BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.created_path,
        dependencies: bulk_player_assignment_dependencies,
        failed_summary: BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.failed_summary,
        get_assigned_players_on_other_teams: () =>
            assigned_players_on_other_teams,
        get_auth_state: () =>
            build_bulk_player_assignment_auth_snapshot(get(auth_store)),
        get_selected_team_state: () => selected_team_state,
        get_selected_team_id: () => selected_team_id,
        get_unassigned_players: () => unassigned_players,
        goto,
        is_browser: browser,
        set_access_denial: (path: string, message: string) =>
            access_denial_store.set_denial(path, message),
        set_all_player_assignments: (value: PlayerAssignment[]) =>
            (all_player_assignments = value),
        set_error_message: (value: string) =>
            (page_status_state = apply_bulk_assignment_error_message(
                page_status_state,
                value,
            )),
        set_gender_name_map: (value: Map<string, string>) =>
            (gender_name_map = value),
        set_is_loading: (value: boolean) =>
            (page_status_state = apply_bulk_assignment_loading_flag(
                page_status_state,
                value,
            )),
        set_is_saving: (value: boolean) =>
            (page_status_state = apply_bulk_assignment_saving_flag(
                page_status_state,
                value,
            )),
        set_teams: (value: Team[]) => (teams = value),
        show_toast,
        success_summary: BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.success_summary,
    });

    onMount(() => void runtime.initialize_page());
</script>

<svelte:head
    ><title>{BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.title}</title></svelte:head
>

<BulkPlayerAssignmentPageShell
    bind:selected_team_id
    bind:search_query
    {teams}
    {selected_count}
    {can_save}
    {page_status_state}
    {unassigned_players}
    {assigned_players_on_other_teams}
    {filtered_unassigned_players}
    {filtered_assigned_players}
    {gender_filter_active}
    {target_gender_label}
    {toast_message}
    {toast_type}
    bind:toast_visible
    on_cancel={() =>
        void goto(BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.memberships_path)}
    on_select_all_unassigned={runtime.select_all_unassigned}
    on_deselect_all={runtime.deselect_all}
    on_save={runtime.handle_save}
    on_toggle_selection={runtime.toggle_player_selection}
/>
