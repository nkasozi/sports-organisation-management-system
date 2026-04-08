<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { Team } from "$lib/core/entities/Team";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import {
        get_gender_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { create_bulk_player_assignment_page_controller_runtime } from "$lib/presentation/logic/bulkPlayerAssignmentPageControllerRuntime";
    import {
        count_selected_players,
        filter_player_assignments_by_name,
        filter_player_assignments_by_team_gender,
        get_target_gender_label,
        type PlayerAssignment,
    } from "$lib/presentation/logic/bulkPlayerAssignmentPageState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import BulkPlayerAssignmentPageShell from "./BulkPlayerAssignmentPageShell.svelte";

    const bulk_player_assignment_dependencies = {
        player_use_cases: get_player_use_cases(),
        team_use_cases: get_team_use_cases(),
        membership_use_cases: get_player_team_membership_use_cases(),
        gender_use_cases: get_gender_use_cases(),
    };
    const BULK_PLAYER_ASSIGNMENT_PAGE_TEXT = {
        access_denied:
            "Access denied: Your role does not have permission to assign players to teams. Please contact your organization administrator if you believe this is an error.",
        created_path: "/player-team-memberships/bulk-assign",
        failed_summary:
            "Assigned {success_count} player(s), but {error_count} failed. Some players may already be on this team.",
        success_summary:
            "Successfully assigned {success_count} player(s) to {team_name}",
        title: "Bulk Assign Players to Team - Sports Management",
    } as const;

    let teams: Team[] = [],
        selected_team_id = "",
        all_player_assignments: PlayerAssignment[] = [];
    let gender_name_map: Map<string, string> = new Map();
    let is_loading = true,
        is_saving = false,
        error_message = "",
        search_query = "",
        toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "info" = "info";

    $: selected_team =
        teams.find((team: Team) => team.id === selected_team_id) ?? null;
    $: gender_filtered_assignments = filter_player_assignments_by_team_gender(
        all_player_assignments,
        selected_team,
    );
    $: unassigned_players = gender_filtered_assignments.filter(
        (assignment: PlayerAssignment) => assignment.current_team_id === null,
    );
    $: assigned_players_on_other_teams = gender_filtered_assignments.filter(
        (assignment: PlayerAssignment) =>
            assignment.current_team_id !== null &&
            assignment.current_team_id !== selected_team_id,
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
    $: gender_filter_active = Boolean(selected_team?.gender_id);
    $: target_gender_label = get_target_gender_label(
        selected_team,
        gender_name_map,
    );
    $: can_save = selected_count > 0 && selected_team_id !== "";

    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
    const runtime = create_bulk_player_assignment_page_controller_runtime({
        access_denied_message: BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.access_denied,
        access_denied_path: BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.created_path,
        dependencies: bulk_player_assignment_dependencies,
        failed_summary: BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.failed_summary,
        get_assigned_players_on_other_teams: () => assigned_players_on_other_teams,
        get_auth_state: () => ({
            current_profile: get(auth_store)
                .current_profile as UserScopeProfile | null,
            current_token: get(auth_store).current_token,
        }),
        get_selected_team: () => selected_team,
        get_selected_team_id: () => selected_team_id,
        get_unassigned_players: () => unassigned_players,
        goto,
        is_browser: browser,
        set_access_denial: (path: string, message: string) =>
            access_denial_store.set_denial(path, message),
        set_all_player_assignments: (value: PlayerAssignment[]) =>
            (all_player_assignments = value),
        set_error_message: (value: string) => (error_message = value),
        set_gender_name_map: (value: Map<string, string>) =>
            (gender_name_map = value),
        set_is_loading: (value: boolean) => (is_loading = value),
        set_is_saving: (value: boolean) => (is_saving = value),
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
    {is_loading}
    {is_saving}
    {error_message}
    {unassigned_players}
    {assigned_players_on_other_teams}
    {filtered_unassigned_players}
    {filtered_assigned_players}
    {gender_filter_active}
    {target_gender_label}
    {toast_message}
    {toast_type}
    bind:toast_visible
    on_cancel={() => goto("/player-team-memberships")}
    on_select_all_unassigned={runtime.select_all_unassigned}
    on_deselect_all={runtime.deselect_all}
    on_save={runtime.handle_save}
    on_toggle_selection={runtime.toggle_player_selection}
/>
