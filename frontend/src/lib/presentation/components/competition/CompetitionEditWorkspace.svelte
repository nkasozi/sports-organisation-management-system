<script lang="ts">
    import { goto } from "$app/navigation";
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import {
        derive_competition_status,
        get_competition_status_display,
    } from "$lib/core/entities/Competition";
    import type {
        CompetitionFormat,
        TieBreaker,
    } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { Team } from "$lib/core/entities/Team";
    import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
    import {
        get_competition_team_use_cases,
        get_competition_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { load_competition_edit_sport } from "$lib/presentation/logic/competitionEditPageData";
    import {
        create_competition_team_collections,
        get_competition_team_collections_after_add,
        get_competition_team_collections_after_remove,
        normalize_competition_auto_squad_settings,
        reset_competition_scoring_overrides,
        toggle_competition_tie_breaker,
        update_competition_points_override,
    } from "$lib/presentation/logic/competitionEditPageState";

    import CompetitionEditShell from "./CompetitionEditShell.svelte";

    export let competition_id: string;
    export let competition: Competition;
    export let organizations: Organization[];
    export let competition_formats: CompetitionFormat[];
    export let all_teams: Team[];
    export let competition_team_entries: CompetitionTeam[];
    export let form_data: UpdateCompetitionInput;
    export let selected_format: CompetitionFormat | null;
    export let selected_sport: Sport | null;
    export let is_customizing_scoring: boolean;
    export let can_edit_competition: boolean;
    export let permission_info_message: string;

    const competition_use_cases = get_competition_use_cases();
    const competition_team_use_cases = get_competition_team_use_cases();

    let teams_in_competition: Team[] = [];
    let available_teams: Team[] = [];
    let is_saving = false;
    let toast_visible = false;
    let toast_message = "";
    let toast_type: "success" | "error" | "info" = "info";

    $: organization_options = organizations.map(
        (organization: Organization) => ({
            value: organization.id,
            label: organization.name,
        }),
    ) as SelectOption[];
    $: competition_format_options = competition_formats.map(
        (competition_format: CompetitionFormat) => ({
            value: competition_format.id,
            label: competition_format.name,
        }),
    ) as SelectOption[];
    $: derived_status =
        form_data.start_date && form_data.end_date
            ? derive_competition_status(
                  form_data.start_date,
                  form_data.end_date,
              )
            : "upcoming";
    $: status_display = get_competition_status_display(derived_status);
    $: competition_stage_filter = {
        foreign_key_field: "competition_id",
        foreign_key_value: competition_id,
    } as SubEntityFilter;
    $: official_jersey_filter = {
        foreign_key_field: "holder_id",
        foreign_key_value: competition_id,
        holder_type_field: "holder_type",
        holder_type_value: "competition_official",
    } as SubEntityFilter;
    $: {
        const normalized_form_data =
            normalize_competition_auto_squad_settings(form_data);
        if (normalized_form_data !== form_data)
            form_data = normalized_form_data;
    }
    $: apply_team_collections(
        competition_team_entries,
        form_data.organization_id ?? competition.organization_id,
    );

    function apply_team_collections(
        next_competition_team_entries: CompetitionTeam[],
        organization_id: string,
    ): void {
        const next_collections = create_competition_team_collections(
            all_teams,
            next_competition_team_entries,
            organization_id,
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
        const result = await competition_use_cases.update(
            competition_id,
            form_data,
        );
        is_saving = false;
        if (!result.success) {
            show_toast(result.error || "Failed to update competition", "error");
            return;
        }
        show_toast("Competition updated successfully!", "success");
        setTimeout(() => goto("/competitions"), 1500);
    }

    async function handle_add_team_to_competition(team: Team): Promise<void> {
        if (!can_edit_competition) return;
        const result = await competition_team_use_cases.add_team_to_competition(
            {
                competition_id,
                team_id: team.id,
                registration_date: new Date().toISOString().split("T")[0],
                seed_number: null,
                group_name: null,
                notes: "",
                status: "registered",
            },
        );
        if (!result.success) {
            show_toast(
                `Failed to add team: ${result.error || "Unknown error"}`,
                "error",
            );
            return;
        }
        const next_collections = get_competition_team_collections_after_add(
            { available_teams, competition_team_entries, teams_in_competition },
            result.data,
            team,
        );
        competition_team_entries = next_collections.competition_team_entries;
        teams_in_competition = next_collections.teams_in_competition;
        available_teams = next_collections.available_teams;
        show_toast(`${team.name} added to competition`, "success");
    }

    async function handle_remove_team_from_competition(
        team: Team,
    ): Promise<void> {
        if (!can_edit_competition) return;
        const result =
            await competition_team_use_cases.remove_team_from_competition(
                competition_id,
                team.id,
            );
        if (!result.success) {
            show_toast(
                `Failed to remove team: ${result.error || "Unknown error"}`,
                "error",
            );
            return;
        }
        const next_collections = get_competition_team_collections_after_remove(
            { available_teams, competition_team_entries, teams_in_competition },
            team,
        );
        competition_team_entries = next_collections.competition_team_entries;
        teams_in_competition = next_collections.teams_in_competition;
        available_teams = next_collections.available_teams;
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

    function handle_cancel(): void {
        goto("/competitions");
    }

    function handle_done(): void {
        show_toast("Team changes saved!", "success");
        goto("/competitions");
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

<CompetitionEditShell
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
    on_cancel={handle_cancel}
    on_submit={handle_submit}
    on_done={handle_done}
    on_organization_change={handle_organization_change}
    on_format_change={handle_format_change}
    on_add_team={handle_add_team_to_competition}
    on_remove_team={handle_remove_team_from_competition}
    on_toggle_auto_squad_submission={handle_toggle_auto_squad_submission}
    on_update_points={handle_update_points}
    on_toggle_tie_breaker={handle_toggle_tie_breaker}
    on_reset_scoring={handle_reset_scoring}
/>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
