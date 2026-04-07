<script lang="ts">
    import { goto } from "$app/navigation";
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type {
        CompetitionFormat,
        TieBreaker,
    } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { Team } from "$lib/core/entities/Team";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import { load_competition_edit_sport } from "$lib/presentation/logic/competitionEditPageData";
    import {
        create_competition_team_collections,
        normalize_competition_auto_squad_settings,
        reset_competition_scoring_overrides,
        toggle_competition_tie_breaker,
        update_competition_points_override,
    } from "$lib/presentation/logic/competitionEditPageState";
    import {
        add_team_to_competition_workspace,
        remove_team_from_competition_workspace,
        submit_competition_edit_workspace,
    } from "$lib/presentation/logic/competitionEditWorkspaceActions";
    import { competition_edit_workspace_dependencies } from "$lib/presentation/logic/competitionEditWorkspaceControllerDependencies";
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

    async function handle_organization_change(
        event: CustomEvent<{ value: string }>,
    ): Promise<void> {
        form_data = {
            ...form_data,
            organization_id: event.detail.value,
            rule_overrides: {},
        };
        selected_sport = await load_competition_edit_sport(
            organizations,
            event.detail.value,
        );
    }

    function handle_format_change(event: CustomEvent<{ value: string }>): void {
        form_data = { ...form_data, competition_format_id: event.detail.value };
        selected_format =
            competition_formats.find(
                (competition_format: CompetitionFormat) =>
                    competition_format.id === event.detail.value,
            ) || null;
    }

    async function handle_submit(): Promise<void> {
        if (!can_edit_competition) return;
        is_saving = true;
        const result = await submit_competition_edit_workspace({
            competition_id,
            form_data,
            competition_use_cases:
                competition_edit_workspace_dependencies.competition_use_cases,
        });
        is_saving = false;
        if (!result.success) {
            show_toast(result.error, "error");
            return;
        }
        show_toast("Competition updated successfully!", "success");
        setTimeout(() => goto("/competitions"), 1500);
    }

    async function handle_add_team_to_competition(team: Team): Promise<void> {
        if (!can_edit_competition) return;
        const result = await add_team_to_competition_workspace({
            competition_id,
            team,
            collections: {
                available_teams,
                competition_team_entries,
                teams_in_competition,
            },
            competition_team_use_cases:
                competition_edit_workspace_dependencies.competition_team_use_cases,
        });
        if (!result.success) {
            show_toast(`Failed to add team: ${result.error}`, "error");
            return;
        }
        competition_team_entries = result.data.competition_team_entries;
        teams_in_competition = result.data.teams_in_competition;
        available_teams = result.data.available_teams;
        show_toast(`${team.name} added to competition`, "success");
    }

    async function handle_remove_team_from_competition(
        team: Team,
    ): Promise<void> {
        if (!can_edit_competition) return;
        const result = await remove_team_from_competition_workspace({
            competition_id,
            team,
            collections: {
                available_teams,
                competition_team_entries,
                teams_in_competition,
            },
            competition_team_use_cases:
                competition_edit_workspace_dependencies.competition_team_use_cases,
        });
        if (!result.success) {
            show_toast(`Failed to remove team: ${result.error}`, "error");
            return;
        }
        competition_team_entries = result.data.competition_team_entries;
        teams_in_competition = result.data.teams_in_competition;
        available_teams = result.data.available_teams;
        show_toast(`${team.name} removed from competition`, "success");
    }

    function handle_toggle_auto_squad_submission(enabled: boolean): void {
        form_data = {
            ...form_data,
            allow_auto_squad_submission: enabled,
            lineup_submission_deadline_hours: enabled
                ? form_data.lineup_submission_deadline_hours
                : 0,
        };
    }

    function handle_update_points(
        field: "points_for_win" | "points_for_draw" | "points_for_loss",
        raw_value: string,
    ): void {
        form_data = update_competition_points_override(
            form_data,
            field,
            raw_value,
        );
    }

    function handle_toggle_tie_breaker(
        tie_breaker: TieBreaker,
        enabled: boolean,
    ): void {
        const format_default_tie_breakers = (selected_format?.tie_breakers ?? [
            "goal_difference",
            "goals_scored",
        ]) as TieBreaker[];
        form_data = toggle_competition_tie_breaker(
            form_data,
            tie_breaker,
            enabled,
            format_default_tie_breakers,
        );
    }

    function handle_reset_scoring(): void {
        form_data = reset_competition_scoring_overrides(form_data);
        is_customizing_scoring = false;
    }

    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
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
    on_submit={handle_submit}
    on_done={() => goto("/competitions")}
    on_organization_change={handle_organization_change}
    on_format_change={handle_format_change}
    on_add_team={handle_add_team_to_competition}
    on_remove_team={handle_remove_team_from_competition}
    on_toggle_auto_squad_submission={handle_toggle_auto_squad_submission}
    on_update_points={handle_update_points}
    on_toggle_tie_breaker={handle_toggle_tie_breaker}
    on_reset_scoring={handle_reset_scoring}
/>
