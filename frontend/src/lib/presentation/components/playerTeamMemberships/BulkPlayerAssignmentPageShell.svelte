<script lang="ts">
    import type { Team } from "$lib/core/entities/Team";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type { PlayerAssignment } from "$lib/presentation/logic/bulkPlayerAssignmentPageState";
    import type { ToastType } from "$lib/presentation/logic/toastConfig";

    import BulkPlayerAssignmentFooter from "./BulkPlayerAssignmentFooter.svelte";
    import BulkPlayerAssignmentHeader from "./BulkPlayerAssignmentHeader.svelte";
    import {
        BULK_PLAYER_ASSIGNMENT_SECTION_TEXT,
        BULK_PLAYER_ASSIGNMENT_SECTION_VARIANT,
    } from "./bulkPlayerAssignmentMessages";
    import {
        BULK_PLAYER_ASSIGNMENT_PAGE_STATUS,
        type BulkPlayerAssignmentPageStatusState,
    } from "./bulkPlayerAssignmentPageStatus";
    import BulkPlayerAssignmentSection from "./BulkPlayerAssignmentSection.svelte";
    import BulkPlayerAssignmentTeamSelection from "./BulkPlayerAssignmentTeamSelection.svelte";

    export let assigned_players_on_other_teams: PlayerAssignment[];
    export let can_save: boolean;
    export let filtered_assigned_players: PlayerAssignment[];
    export let filtered_unassigned_players: PlayerAssignment[];
    export let gender_filter_active: boolean;
    export let page_status_state: BulkPlayerAssignmentPageStatusState;
    export let search_query: string;
    export let selected_count: number;
    export let selected_team_id: string;
    export let target_gender_label: string;
    export let teams: Team[];
    export let toast_message: string;
    export let toast_type: ToastType;
    export let toast_visible: boolean;
    export let unassigned_players: PlayerAssignment[];
    export let on_cancel: () => void;
    export let on_deselect_all: () => void;
    export let on_save: () => Promise<void>;
    export let on_select_all_unassigned: () => void;
    export let on_toggle_selection: (assignment: PlayerAssignment) => void;
</script>

<div class="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
    <BulkPlayerAssignmentHeader on_back={on_cancel} />
    {#if page_status_state.status === BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.LOADING}
        <div class="flex justify-center py-12">
            <div
                class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"
            ></div>
        </div>
    {:else if page_status_state.status === BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.FAILED}
        <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
            <p class="text-red-800 dark:text-red-200">
                {page_status_state.message}
            </p>
        </div>
    {:else}
        <BulkPlayerAssignmentTeamSelection
            bind:selected_team_id
            bind:search_query
            {teams}
            {selected_count}
            {on_select_all_unassigned}
            {on_deselect_all}
        />
        {#if selected_team_id}
            <BulkPlayerAssignmentSection
                title={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.unassigned_title}
                total_count={unassigned_players.length}
                description={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.unassigned_description}
                players={filtered_unassigned_players}
                {search_query}
                empty_search_message={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.unassigned_empty_search}
                empty_default_message={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.unassigned_empty_default}
                {gender_filter_active}
                {target_gender_label}
                status_variant={BULK_PLAYER_ASSIGNMENT_SECTION_VARIANT.AVAILABLE}
                {on_toggle_selection}
            />
            <BulkPlayerAssignmentSection
                title={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.assigned_title}
                total_count={assigned_players_on_other_teams.length}
                description={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.assigned_description}
                players={filtered_assigned_players}
                {search_query}
                empty_search_message={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.assigned_empty_search}
                empty_default_message={BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.assigned_empty_default}
                {gender_filter_active}
                {target_gender_label}
                status_variant={BULK_PLAYER_ASSIGNMENT_SECTION_VARIANT.ASSIGNED}
                {on_toggle_selection}
            />
        {:else}
            <div
                class="bg-accent-50 dark:bg-accent-800/50 rounded-lg p-8 text-center"
            >
                <p class="text-accent-600 dark:text-accent-400">
                    {BULK_PLAYER_ASSIGNMENT_SECTION_TEXT.select_team_prompt}
                </p>
            </div>
        {/if}
        <BulkPlayerAssignmentFooter
            {can_save}
            is_saving={page_status_state.status ===
                BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.SAVING}
            {selected_count}
            {on_cancel}
            {on_save}
        />
    {/if}
</div>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
