<script lang="ts">
    import { goto } from "$app/navigation";
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type {
        CompetitionFormat,
    } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { Team } from "$lib/core/entities/Team";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import {
        create_competition_team_collections,
        normalize_competition_auto_squad_settings,
    } from "$lib/presentation/logic/competitionEditPageState";
    import { create_competition_edit_workspace_controller_runtime } from "$lib/presentation/logic/competitionEditWorkspaceControllerRuntime";
    import {
        create_competition_workspace_filters,
        create_competition_workspace_options,
        derive_competition_workspace_status,
    } from "$lib/presentation/logic/competitionEditWorkspaceControllerState";

    import CompetitionEditWorkspaceView from "./CompetitionEditWorkspaceView.svelte";

    export let competition_id: string,
        competition: Competition,
        organizations: Organization[],
        competition_formats: CompetitionFormat[],
        all_teams: Team[],
        competition_team_entries: CompetitionTeam[],
        form_data: UpdateCompetitionInput,
        selected_format: CompetitionFormat | null,
        selected_sport: Sport | null,
        is_customizing_scoring: boolean,
        can_edit_competition: boolean,
        permission_info_message: string;

    let teams_in_competition: Team[] = [],
        available_teams: Team[] = [],
        is_saving = false,
        toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "info" = "info",
        organization_options: SelectOption[] = [],
        competition_format_options: SelectOption[] = [];

    $: ({ organization_options, competition_format_options } =
        create_competition_workspace_options({
            organizations,
            competition_formats,
        }));
    $: ({ derived_status, status_display } =
        derive_competition_workspace_status({ form_data }));
    $: ({ competition_stage_filter, official_jersey_filter } =
        create_competition_workspace_filters(competition_id));
    $: {
        const normalized_form_data =
            normalize_competition_auto_squad_settings(form_data);
        if (normalized_form_data !== form_data)
            form_data = normalized_form_data;
    }
    $: {
        const next_collections = create_competition_team_collections(
            all_teams,
            competition_team_entries,
            form_data.organization_id ?? competition.organization_id,
        );
        teams_in_competition = next_collections.teams_in_competition;
        available_teams = next_collections.available_teams;
    }

    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }

    const runtime = create_competition_edit_workspace_controller_runtime({
        can_edit_competition,
        competition_id,
        competition_formats,
        competition_team_entries,
        get_available_teams: () => available_teams,
        get_form_data: () => form_data,
        get_selected_format: () => selected_format,
        get_teams_in_competition: () => teams_in_competition,
        goto,
        organizations,
        set_available_teams: (value: Team[]) => (available_teams = value),
        set_competition_team_entries: (value: CompetitionTeam[]) =>
            (competition_team_entries = value),
        set_form_data: (value: UpdateCompetitionInput) => (form_data = value),
        set_is_customizing_scoring: (value: boolean) =>
            (is_customizing_scoring = value),
        set_is_saving: (value: boolean) => (is_saving = value),
        set_selected_format: (value: CompetitionFormat | null) =>
            (selected_format = value),
        set_selected_sport: (value: Sport | null) => (selected_sport = value),
        set_teams_in_competition: (value: Team[]) =>
            (teams_in_competition = value),
        show_toast,
    });
</script>

<CompetitionEditWorkspaceView
    {competition}
    bind:form_data
    {organization_options}
    {competition_format_options}
    {selected_format}
    {selected_sport}
    {teams_in_competition}
    {available_teams}
    {can_edit_competition}
    {permission_info_message}
    {is_saving}
    bind:is_customizing_scoring
    {competition_stage_filter}
    {official_jersey_filter}
    {derived_status}
    status_label={status_display.label}
    {toast_visible}
    {toast_message}
    {toast_type}
    on_cancel={() => goto("/competitions")}
    on_submit={runtime.handle_submit}
    on_done={() => goto("/competitions")}
    on_organization_change={runtime.handle_organization_change}
    on_format_change={runtime.handle_format_change}
    on_add_team={runtime.handle_add_team_to_competition}
    on_remove_team={runtime.handle_remove_team_from_competition}
    on_toggle_auto_squad_submission={runtime.handle_toggle_auto_squad_submission}
    on_update_points={runtime.handle_update_points}
    on_toggle_tie_breaker={runtime.handle_toggle_tie_breaker}
    on_reset_scoring={runtime.handle_reset_scoring}
/>
