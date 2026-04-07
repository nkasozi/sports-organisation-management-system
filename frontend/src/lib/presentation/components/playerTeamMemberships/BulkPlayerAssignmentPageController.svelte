<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { Team } from "$lib/core/entities/Team";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_gender_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        load_bulk_player_assignment_page_data,
        save_bulk_player_assignments,
    } from "$lib/presentation/logic/bulkPlayerAssignmentPageData";
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

    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            is_loading = false;
            return;
        }
        const auth_state = get(auth_store);
        if (auth_state.current_token) {
            const authorization_check =
                await get_authorization_adapter().check_entity_authorized(
                    auth_state.current_token.raw_token,
                    "playerteammembership",
                    "create",
                );
            if (!authorization_check.success) return;
            if (!authorization_check.data.is_authorized) {
                access_denial_store.set_denial(
                    BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.created_path,
                    BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.access_denied,
                );
                await goto("/");
                return;
            }
        }
        const page_data = await load_bulk_player_assignment_page_data({
            current_profile: get(auth_store)
                .current_profile as UserScopeProfile | null,
            dependencies: bulk_player_assignment_dependencies,
        });
        teams = page_data.teams;
        all_player_assignments = page_data.all_player_assignments;
        gender_name_map = page_data.gender_name_map;
        error_message = page_data.error_message;
        is_loading = false;
    }

    function toggle_player_selection(assignment: PlayerAssignment): void {
        assignment.selected = !assignment.selected;
        all_player_assignments = [...all_player_assignments];
    }

    function select_all_unassigned(): void {
        for (const assignment of all_player_assignments) {
            if (assignment.current_team_id === null) assignment.selected = true;
        }
        all_player_assignments = [...all_player_assignments];
    }

    function deselect_all(): void {
        for (const assignment of all_player_assignments)
            assignment.selected = false;
        all_player_assignments = [...all_player_assignments];
    }

    async function handle_save(): Promise<void> {
        if (!can_save) return;
        is_saving = true;
        const save_result = await save_bulk_player_assignments({
            assigned_players_on_other_teams,
            dependencies: bulk_player_assignment_dependencies,
            selected_team,
            selected_team_id,
            unassigned_players,
        });
        is_saving = false;
        if (save_result.error_count === 0) {
            show_toast(
                BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.success_summary
                    .replace(
                        "{success_count}",
                        String(save_result.success_count),
                    )
                    .replace("{team_name}", selected_team?.name || ""),
                "success",
            );
            setTimeout(() => goto("/player-team-memberships"), 1500);
            return;
        }
        show_toast(
            BULK_PLAYER_ASSIGNMENT_PAGE_TEXT.failed_summary
                .replace("{success_count}", String(save_result.success_count))
                .replace("{error_count}", String(save_result.error_count)),
            "error",
        );
    }

    onMount(() => void initialize_page());
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
    on_select_all_unassigned={select_all_unassigned}
    on_deselect_all={deselect_all}
    on_save={handle_save}
    on_toggle_selection={toggle_player_selection}
/>
