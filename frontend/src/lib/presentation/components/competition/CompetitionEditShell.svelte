<script lang="ts">
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { Team } from "$lib/core/entities/Team";
    import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

    import CompetitionEditDetailsTab from "./CompetitionEditDetailsTab.svelte";
    import CompetitionEditHeader from "./CompetitionEditHeader.svelte";
    import CompetitionEditOfficialJerseysTab from "./CompetitionEditOfficialJerseysTab.svelte";
    import CompetitionEditRulesTab from "./CompetitionEditRulesTab.svelte";
    import CompetitionEditSettingsTab from "./CompetitionEditSettingsTab.svelte";
    import CompetitionEditStagesTab from "./CompetitionEditStagesTab.svelte";
    import CompetitionEditTabs from "./CompetitionEditTabs.svelte";
    import CompetitionEditTeamsTab from "./CompetitionEditTeamsTab.svelte";

    export let competition: Competition | null;
    export let form_data: UpdateCompetitionInput;
    export let organization_options: SelectOption[];
    export let competition_format_options: SelectOption[];
    export let selected_format: CompetitionFormat | null;
    export let selected_sport: Sport | null;
    export let teams_in_competition: Team[];
    export let available_teams: Team[];
    export let can_edit_competition: boolean;
    export let permission_info_message: string;
    export let is_saving: boolean;
    export let is_customizing_scoring: boolean;
    export let competition_stage_filter: SubEntityFilter;
    export let official_jersey_filter: SubEntityFilter;
    export let derived_status: string;
    export let status_label: string;
    export let on_cancel: () => void;
    export let on_submit: () => Promise<void>;
    export let on_done: () => void;
    export let on_organization_change: (
        event: CustomEvent<{ value: string }>,
    ) => Promise<void>;
    export let on_format_change: (
        event: CustomEvent<{ value: string }>,
    ) => void;
    export let on_add_team: (team: Team) => Promise<void>;
    export let on_remove_team: (team: Team) => Promise<void>;
    export let on_toggle_auto_squad_submission: (enabled: boolean) => void;
    export let on_update_points: (
        field: "points_for_win" | "points_for_draw" | "points_for_loss",
        raw_value: string,
    ) => void;
    export let on_toggle_tie_breaker: (
        tie_breaker: any,
        enabled: boolean,
    ) => void;
    export let on_reset_scoring: () => void;

    let active_tab:
        | "details"
        | "teams"
        | "stages"
        | "rules"
        | "settings"
        | "official_jerseys" = "details";
</script>

<div class="max-w-4xl mx-auto space-y-6">
    <CompetitionEditHeader
        competition_name={competition?.name ?? "Edit Competition"}
        {derived_status}
        {status_label}
        {on_cancel}
    />
    <div class="border-b border-accent-200 dark:border-accent-700 my-6"></div>
    {#if permission_info_message}
        <div
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6"
        >
            <div class="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    ><path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                    /></svg
                >
                <p class="text-sm text-blue-700 dark:text-blue-300">
                    {permission_info_message}
                </p>
            </div>
        </div>
    {/if}
    <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
    >
        <CompetitionEditTabs
            bind:active_tab
            team_count={teams_in_competition.length}
            max_teams={form_data.max_teams ?? 0}
        />
        <div class="p-6">
            {#if active_tab === "details"}
                <CompetitionEditDetailsTab
                    {competition}
                    bind:form_data
                    {organization_options}
                    {competition_format_options}
                    {can_edit_competition}
                    {is_saving}
                    {on_cancel}
                    {on_submit}
                    {on_organization_change}
                    {on_format_change}
                />
            {:else if active_tab === "teams"}
                <CompetitionEditTeamsTab
                    {teams_in_competition}
                    {available_teams}
                    max_teams={form_data.max_teams ?? 0}
                    {can_edit_competition}
                    {on_cancel}
                    {on_done}
                    {on_add_team}
                    {on_remove_team}
                />
            {:else if active_tab === "stages"}
                <CompetitionEditStagesTab
                    {competition_stage_filter}
                    {can_edit_competition}
                />
            {:else if active_tab === "rules"}
                <CompetitionEditRulesTab
                    bind:form_data
                    {selected_format}
                    {selected_sport}
                    bind:is_customizing_scoring
                    {can_edit_competition}
                    {is_saving}
                    {on_cancel}
                    {on_submit}
                    {on_update_points}
                    {on_toggle_tie_breaker}
                    {on_reset_scoring}
                />
            {:else if active_tab === "settings"}
                <CompetitionEditSettingsTab
                    bind:form_data
                    {can_edit_competition}
                    {is_saving}
                    {on_cancel}
                    {on_submit}
                    {on_toggle_auto_squad_submission}
                />
            {:else}
                <CompetitionEditOfficialJerseysTab {official_jersey_filter} />
            {/if}
        </div>
    </div>
</div>
