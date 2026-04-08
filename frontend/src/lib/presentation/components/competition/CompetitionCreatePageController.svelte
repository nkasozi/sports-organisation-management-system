<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import {
        create_empty_competition_input,
        type CreateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Sport } from "$lib/core/entities/Sport";
    import {
        is_scope_restricted,
        type UserScopeProfile,
    } from "$lib/core/interfaces/ports";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import { COMPETITION_CREATE_PAGE_TEXT } from "$lib/presentation/logic/competitionCreatePageControllerDependencies";
    import { create_competition_create_page_controller_runtime } from "$lib/presentation/logic/competitionCreatePageControllerRuntime";
    import { competition_create_status_options } from "$lib/presentation/logic/competitionCreatePageData";
    import {
        get_competition_format_team_requirements,
        is_competition_team_count_valid,
        normalize_competition_auto_squad_settings,
    } from "$lib/presentation/logic/competitionCreatePageState";
    import { auth_store } from "$lib/presentation/stores/auth";

    import CompetitionCreatePageShell from "./CompetitionCreatePageShell.svelte";

    let form_data: CreateCompetitionInput = create_empty_competition_input(),
        organizations: Organization[] = [],
        competition_formats: CompetitionFormat[] = [],
        selected_team_ids: Set<string> = new Set(),
        selected_format: CompetitionFormat | null = null,
        selected_sport: Sport | null = null,
        is_loading_organizations = true,
        is_loading_formats = true,
        is_loading_teams = false,
        is_saving = false,
        errors: Record<string, string> = {},
        error_message = "",
        toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "info" = "info",
        organization_options: SelectOption[] = [],
        competition_format_options: SelectOption[] = [],
        team_options: SelectOption[] = [];

    $: current_auth_profile =
        $auth_store.current_profile as UserScopeProfile | null;
    $: is_organization_restricted =
        current_auth_profile !== null &&
        is_scope_restricted(current_auth_profile, "organization_id");
    $: form_data.team_ids = Array.from(selected_team_ids);
    $: format_team_requirements =
        get_competition_format_team_requirements(selected_format);
    $: is_team_count_valid = is_competition_team_count_valid(
        selected_format,
        selected_team_ids.size,
    );
    $: {
        const next_form_data =
            normalize_competition_auto_squad_settings(form_data);
        if (next_form_data !== form_data) form_data = next_form_data;
    }

    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
    const runtime = create_competition_create_page_controller_runtime({
        get_auth_state: () => get(auth_store),
        get_competition_formats: () => competition_formats,
        get_current_auth_profile: () => current_auth_profile,
        get_form_data: () => form_data,
        get_selected_format: () => selected_format,
        get_selected_team_ids: () => selected_team_ids,
        get_is_team_count_valid: () => is_team_count_valid,
        get_organizations: () => organizations,
        is_browser: browser,
        goto,
        set_competition_format_options: (value: SelectOption[]) =>
            (competition_format_options = value),
        set_competition_formats: (value: CompetitionFormat[]) =>
            (competition_formats = value),
        set_error_message: (value: string) => (error_message = value),
        set_form_data: (value: CreateCompetitionInput) => (form_data = value),
        set_is_loading_formats: (value: boolean) =>
            (is_loading_formats = value),
        set_is_loading_organizations: (value: boolean) =>
            (is_loading_organizations = value),
        set_is_loading_teams: (value: boolean) => (is_loading_teams = value),
        set_is_saving: (value: boolean) => (is_saving = value),
        set_organization_options: (value: SelectOption[]) =>
            (organization_options = value),
        set_organizations: (value: Organization[]) => (organizations = value),
        set_selected_format: (value: CompetitionFormat | null) =>
            (selected_format = value),
        set_selected_sport: (value: Sport | null) => (selected_sport = value),
        set_selected_team_ids: (value: Set<string>) =>
            (selected_team_ids = value),
        set_team_options: (value: SelectOption[]) => (team_options = value),
        show_toast,
    });

    onMount(() => void runtime.initialize());
</script>

<svelte:head>
    <title>{COMPETITION_CREATE_PAGE_TEXT.title}</title>
</svelte:head>

<CompetitionCreatePageShell
    bind:form_data
    {organization_options}
    {competition_format_options}
    {team_options}
    {selected_team_ids}
    {selected_sport}
    {is_loading_organizations}
    {is_loading_formats}
    {is_loading_teams}
    {is_organization_restricted}
    {errors}
    status_options={competition_create_status_options}
    {format_team_requirements}
    {is_team_count_valid}
    {is_saving}
    {error_message}
    {toast_message}
    {toast_type}
    bind:toast_visible
    on_cancel={() => goto("/competitions")}
    on_organization_change={runtime.handle_organization_change}
    on_format_change={runtime.handle_format_change}
    on_toggle_team={runtime.handle_team_toggle}
    on_toggle_auto_squad_submission={runtime.handle_auto_squad_submission_toggle}
    on_submit={runtime.handle_submit}
/>
