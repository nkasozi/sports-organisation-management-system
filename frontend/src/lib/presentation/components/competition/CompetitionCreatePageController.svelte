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
    import {
        competition_create_dependencies,
        COMPETITION_CREATE_PAGE_TEXT,
    } from "$lib/presentation/logic/competitionCreatePageControllerDependencies";
    import { competition_create_status_options } from "$lib/presentation/logic/competitionCreatePageData";
    import {
        initialize_competition_create_page,
        load_competition_create_organization_state,
    } from "$lib/presentation/logic/competitionCreatePageFlow";
    import {
        get_competition_format_team_requirements,
        get_next_selected_team_ids,
        is_competition_team_count_valid,
        normalize_competition_auto_squad_settings,
        update_competition_auto_squad_submission,
    } from "$lib/presentation/logic/competitionCreatePageState";
    import { submit_competition_create_form } from "$lib/presentation/logic/competitionCreatePageSubmit";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
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

    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const auth_state = get(auth_store);
        const page_result = await initialize_competition_create_page({
            current_auth_profile,
            dependencies: competition_create_dependencies,
            is_organization_restricted,
            raw_token: auth_state.current_token?.raw_token ?? null,
        });
        if (page_result.access_denied) {
            access_denial_store.set_denial(
                COMPETITION_CREATE_PAGE_TEXT.create_path,
                COMPETITION_CREATE_PAGE_TEXT.access_denied,
            );
            await goto("/competitions");
            return;
        }
        if (page_result.error_message) {
            error_message = page_result.error_message;
            is_loading_organizations = false;
            is_loading_formats = false;
            is_loading_teams = false;
            return;
        }
        organizations = page_result.organizations;
        organization_options = page_result.organization_options;
        is_loading_organizations = false;
        if (!page_result.preselected_organization_id) {
            is_loading_formats = false;
            return;
        }
        form_data = {
            ...form_data,
            organization_id: page_result.preselected_organization_id,
        };
        await trigger_organization_side_effects(
            page_result.preselected_organization_id,
        );
    }

    async function trigger_organization_side_effects(
        organization_id: string,
    ): Promise<void> {
        selected_team_ids = new Set();
        selected_format = null;
        selected_sport = null;
        form_data = {
            ...form_data,
            competition_format_id: "",
            rule_overrides: {},
        };
        is_loading_teams = true;
        is_loading_formats = true;
        const organization_state =
            await load_competition_create_organization_state({
                dependencies: competition_create_dependencies,
                organization_id,
                organizations,
            });
        team_options = organization_state.team_options;
        competition_formats = organization_state.competition_formats;
        competition_format_options =
            organization_state.competition_format_options;
        selected_sport = organization_state.selected_sport;
        is_loading_teams = false;
        is_loading_formats = false;
    }

    async function handle_organization_change(
        event: CustomEvent<{ value: string }>,
    ): Promise<void> {
        form_data = { ...form_data, organization_id: event.detail.value };
        await trigger_organization_side_effects(event.detail.value);
    }

    function handle_format_change(event: CustomEvent<{ value: string }>): void {
        form_data = { ...form_data, competition_format_id: event.detail.value };
        selected_format =
            competition_formats.find(
                (competition_format: CompetitionFormat) =>
                    competition_format.id === event.detail.value,
            ) || null;
    }

    function handle_team_toggle(team_id: string): boolean {
        selected_team_ids = get_next_selected_team_ids(
            selected_team_ids,
            team_id,
        );
        return true;
    }

    function handle_auto_squad_submission_toggle(enabled: boolean): void {
        form_data = update_competition_auto_squad_submission(
            form_data,
            enabled,
        );
    }

    async function handle_submit(): Promise<void> {
        errors = {};
        if (!is_team_count_valid) {
            show_toast(
                `Please select between ${selected_format?.min_teams_required} and ${selected_format?.max_teams_allowed} teams`,
                "error",
            );
            return;
        }
        is_saving = true;
        const submit_result = await submit_competition_create_form({
            dependencies: competition_create_dependencies,
            form_data,
        });
        is_saving = false;
        if (!submit_result.success) {
            show_toast(submit_result.error_message, "error");
            return;
        }
        show_toast(COMPETITION_CREATE_PAGE_TEXT.created, "success");
        setTimeout(() => goto("/competitions"), 1500);
    }

    onMount(() => void initialize_page());
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
    on_organization_change={handle_organization_change}
    on_format_change={handle_format_change}
    on_toggle_team={handle_team_toggle}
    on_toggle_auto_squad_submission={handle_auto_squad_submission_toggle}
    on_submit={handle_submit}
/>
