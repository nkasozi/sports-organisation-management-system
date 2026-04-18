<script lang="ts">
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type {
        TieBreaker,
    } from "$lib/core/entities/CompetitionFormat";
    import type { Team } from "$lib/core/entities/Team";
    import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type {
        CompetitionEditSelectedFormatState,
        CompetitionEditSelectedSportState,
    } from "$lib/presentation/logic/competitionEditPageContracts";

    import CompetitionEditShell from "./CompetitionEditShell.svelte";

    export let competition: Competition;
    export let form_data: UpdateCompetitionInput;
    export let organization_options: SelectOption[];
    export let competition_format_options: SelectOption[];
    export let selected_format_state: CompetitionEditSelectedFormatState = {
        status: "missing",
    };
    export let selected_sport_state: CompetitionEditSelectedSportState = {
        status: "missing",
    };
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
    export let toast_visible: boolean;
    export let toast_message: string;
    export let toast_type: "success" | "error" | "info";
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
        tie_breaker: TieBreaker,
        enabled: boolean,
    ) => void;
    export let on_reset_scoring: () => void;
</script>

<CompetitionEditShell
    {competition}
    bind:form_data
    {organization_options}
    {competition_format_options}
    {selected_format_state}
    {selected_sport_state}
    {teams_in_competition}
    {available_teams}
    {can_edit_competition}
    {permission_info_message}
    {is_saving}
    bind:is_customizing_scoring
    {competition_stage_filter}
    {official_jersey_filter}
    {derived_status}
    {status_label}
    {on_cancel}
    {on_submit}
    {on_done}
    {on_organization_change}
    {on_format_change}
    {on_add_team}
    {on_remove_team}
    {on_toggle_auto_squad_submission}
    {on_update_points}
    {on_toggle_tie_breaker}
    {on_reset_scoring}
/>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
