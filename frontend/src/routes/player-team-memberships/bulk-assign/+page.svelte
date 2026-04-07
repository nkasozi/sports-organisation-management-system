<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { Team } from "$lib/core/entities/Team";
    import {
        build_authorization_list_filter,
        type UserScopeProfile,
    } from "$lib/core/interfaces/ports";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_gender_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import BulkPlayerAssignmentFooter from "$lib/presentation/components/playerTeamMemberships/BulkPlayerAssignmentFooter.svelte";
    import BulkPlayerAssignmentHeader from "$lib/presentation/components/playerTeamMemberships/BulkPlayerAssignmentHeader.svelte";
    import BulkPlayerAssignmentSection from "$lib/presentation/components/playerTeamMemberships/BulkPlayerAssignmentSection.svelte";
    import BulkPlayerAssignmentTeamSelection from "$lib/presentation/components/playerTeamMemberships/BulkPlayerAssignmentTeamSelection.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        build_player_assignments,
        count_selected_players,
        create_membership_input,
        filter_player_assignments_by_name,
        filter_player_assignments_by_team_gender,
        get_selected_player_assignments,
        get_target_gender_label,
        get_today_date,
        type PlayerAssignment,
    } from "$lib/presentation/logic/bulkPlayerAssignmentPageState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";
    const player_use_cases = get_player_use_cases();
    const team_use_cases = get_team_use_cases();
    const membership_use_cases = get_player_team_membership_use_cases();
    const gender_use_cases = get_gender_use_cases();

    let teams: Team[] = [];
    let selected_team_id: string = "";
    let all_player_assignments: PlayerAssignment[] = [];
    let gender_name_map: Map<string, string> = new Map();
    let is_loading: boolean = true;
    let is_saving: boolean = false;
    let error_message: string = "";
    let search_query: string = "";
    let toast_visible: boolean = false;
    let toast_message: string = "";
    let toast_type: "success" | "error" | "info" = "info";
    $: selected_team =
        teams.find(
            (current_team: Team) => current_team.id === selected_team_id,
        ) ?? null;
    $: gender_filtered_assignments = filter_player_assignments_by_team_gender(
        all_player_assignments,
        selected_team,
    );
    $: unassigned_players = gender_filtered_assignments.filter(
        (current_assignment: PlayerAssignment) =>
            current_assignment.current_team_id === null,
    );
    $: assigned_players_on_other_teams = gender_filtered_assignments.filter(
        (current_assignment: PlayerAssignment) =>
            current_assignment.current_team_id !== null &&
            current_assignment.current_team_id !== selected_team_id,
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

    function build_auth_filter(): Record<string, string> {
        const auth_state = get(auth_store);
        if (!auth_state.current_profile) return {};
        return build_authorization_list_filter(
            auth_state.current_profile as UserScopeProfile,
            ["organization_id", "team_id"],
        );
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
                    "/player-team-memberships/bulk-assign",
                    "Access denied: Your role does not have permission to assign players to teams. Please contact your organization administrator if you believe this is an error.",
                );
                await goto("/");
                return;
            }
        }
        await load_initial_data();
    }
    async function load_initial_data(): Promise<void> {
        is_loading = true;
        error_message = "";
        const auth_filter = build_auth_filter();
        const [teams_result, players_result, memberships_result] =
            await Promise.all([
                team_use_cases.list(auth_filter, {
                    page_number: 1,
                    page_size: 200,
                }),
                player_use_cases.list(auth_filter, {
                    page_number: 1,
                    page_size: 500,
                }),
                membership_use_cases.list(auth_filter, {
                    page_number: 1,
                    page_size: 1000,
                }),
            ]);
        if (!teams_result.success) {
            error_message = "Failed to load teams";
            is_loading = false;
            return;
        }
        if (!players_result.success) {
            error_message = "Failed to load players";
            is_loading = false;
            return;
        }
        teams = teams_result.data?.items ?? [];
        const auth_state = get(auth_store);
        const user_organization_id =
            auth_state.current_profile?.organization_id;
        const gender_filter =
            user_organization_id && user_organization_id !== "*"
                ? { organization_id: user_organization_id }
                : {};
        const genders_result = await gender_use_cases.list(gender_filter, {
            page_number: 1,
            page_size: 50,
        });
        if (genders_result.success) {
            gender_name_map = new Map(
                genders_result.data.items.map((current_gender) => [
                    current_gender.id,
                    current_gender.name,
                ]),
            );
        }
        all_player_assignments = build_player_assignments(
            players_result.data?.items ?? [],
            memberships_result.success
                ? (memberships_result.data?.items ?? [])
                : [],
            teams,
            get_today_date(),
        );
        is_loading = false;
    }
    function toggle_player_selection(assignment: PlayerAssignment): void {
        assignment.selected = !assignment.selected;
        all_player_assignments = [...all_player_assignments];
    }
    function select_all_unassigned(): void {
        for (const current_assignment of all_player_assignments) {
            if (current_assignment.current_team_id !== null) continue;
            current_assignment.selected = true;
        }
        all_player_assignments = [...all_player_assignments];
    }
    function deselect_all(): void {
        for (const current_assignment of all_player_assignments) {
            current_assignment.selected = false;
        }
        all_player_assignments = [...all_player_assignments];
    }
    async function handle_save(): Promise<void> {
        if (!can_save) return;
        is_saving = true;
        let success_count = 0;
        let error_count = 0;
        for (const current_assignment of get_selected_player_assignments(
            unassigned_players,
            assigned_players_on_other_teams,
        )) {
            const result = await membership_use_cases.create(
                create_membership_input(
                    current_assignment,
                    selected_team,
                    selected_team_id,
                ),
            );
            if (result.success) {
                success_count += 1;
                continue;
            }
            error_count += 1;
            console.error(
                "[BulkPlayerAssignment] Failed to create membership",
                {
                    event: "bulk_player_assignment_create_failed",
                    player_id: current_assignment.player.id,
                    team_id: selected_team_id,
                    error: result.error,
                },
            );
        }
        is_saving = false;
        if (error_count === 0) {
            show_toast(
                `Successfully assigned ${success_count} player(s) to ${selected_team?.name}`,
                "success",
            );
            setTimeout(() => goto("/player-team-memberships"), 1500);
            return;
        }
        show_toast(
            `Assigned ${success_count} player(s), but ${error_count} failed. Some players may already be on this team.`,
            "error",
        );
    }
    function handle_cancel(): void {
        goto("/player-team-memberships");
    }
    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
    onMount(() => {
        void initialize_page();
    });
</script>

<svelte:head>
    <title>Bulk Assign Players to Team - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
    <BulkPlayerAssignmentHeader on_back={handle_cancel} />
    {#if is_loading}
        <div class="flex justify-center py-12">
            <div
                class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"
            ></div>
        </div>
    {:else if error_message}
        <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
            <p class="text-red-800 dark:text-red-200">{error_message}</p>
        </div>
    {:else}
        <BulkPlayerAssignmentTeamSelection
            bind:selected_team_id
            bind:search_query
            {teams}
            {selected_count}
            on_select_all_unassigned={select_all_unassigned}
            on_deselect_all={deselect_all}
        />
        {#if selected_team_id}
            <BulkPlayerAssignmentSection
                title="Players Without a Team"
                total_count={unassigned_players.length}
                description="These players are not currently assigned to any team"
                players={filtered_unassigned_players}
                {search_query}
                empty_search_message="No unassigned players match your search."
                empty_default_message="All players are currently assigned to a team."
                {gender_filter_active}
                {target_gender_label}
                status_variant="available"
                on_toggle_selection={toggle_player_selection}
            />
            <BulkPlayerAssignmentSection
                title="Players Already on Other Teams"
                total_count={assigned_players_on_other_teams.length}
                description="Selecting these will create an additional team membership"
                players={filtered_assigned_players}
                {search_query}
                empty_search_message="No players on other teams match your search."
                empty_default_message="No players are currently on other teams."
                {gender_filter_active}
                {target_gender_label}
                status_variant="assigned"
                on_toggle_selection={toggle_player_selection}
            />
        {:else}
            <div
                class="bg-accent-50 dark:bg-accent-800/50 rounded-lg p-8 text-center"
            >
                <p class="text-accent-600 dark:text-accent-400">
                    Select a team above to see available players
                </p>
            </div>
        {/if}
        <BulkPlayerAssignmentFooter
            {can_save}
            {is_saving}
            {selected_count}
            on_cancel={handle_cancel}
            on_save={handle_save}
        />
    {/if}
</div>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
