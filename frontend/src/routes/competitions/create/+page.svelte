<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { get_sport_by_id } from "$lib/adapters/persistence/sportService";
    import {
        create_empty_competition_input,
        type CreateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { Team } from "$lib/core/entities/Team";
    import {
        is_scope_restricted,
        type UserScopeProfile,
    } from "$lib/core/interfaces/ports";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_competition_format_use_cases,
        get_competition_team_use_cases,
        get_competition_use_cases,
        get_organization_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import CompetitionCreateEditor from "$lib/presentation/components/competition/CompetitionCreateEditor.svelte";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        create_competition_team_inputs,
        get_competition_format_team_requirements,
        get_next_selected_team_ids,
        is_competition_team_count_valid,
        normalize_competition_auto_squad_settings,
        update_competition_auto_squad_submission,
    } from "$lib/presentation/logic/competitionCreatePageState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    const competition_use_cases = get_competition_use_cases();
    const competition_team_use_cases = get_competition_team_use_cases();
    const organization_use_cases = get_organization_use_cases();
    const competition_format_use_cases = get_competition_format_use_cases();
    const team_use_cases = get_team_use_cases();
    const status_options = [
        { value: "upcoming", label: "Upcoming" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    let form_data: CreateCompetitionInput = create_empty_competition_input();
    let organizations: Organization[] = [];
    let competition_formats: CompetitionFormat[] = [];
    let team_options: SelectOption[] = [];
    let organization_options: SelectOption[] = [];
    let competition_format_options: SelectOption[] = [];
    let selected_team_ids: Set<string> = new Set();
    let selected_format: CompetitionFormat | null = null;
    let selected_sport: Sport | null = null;
    let is_loading_organizations: boolean = true;
    let is_loading_formats: boolean = true;
    let is_loading_teams: boolean = false;
    let is_saving: boolean = false;
    let errors: Record<string, string> = {};
    let error_message: string = "";
    let toast_visible: boolean = false;
    let toast_message: string = "";
    let toast_type: "success" | "error" | "info" = "info";
    $: current_auth_profile = $auth_store.current_profile;
    $: is_organization_restricted =
        current_auth_profile !== null &&
        is_scope_restricted(
            current_auth_profile as UserScopeProfile,
            "organization_id",
        );
    $: form_data.team_ids = Array.from(selected_team_ids);
    $: format_team_requirements =
        get_competition_format_team_requirements(selected_format);
    $: is_team_count_valid = is_competition_team_count_valid(
        selected_format,
        selected_team_ids.size,
    );
    $: {
        const normalized_form_data =
            normalize_competition_auto_squad_settings(form_data);
        if (normalized_form_data !== form_data)
            form_data = normalized_form_data;
    }
    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            is_loading_organizations = false;
            is_loading_formats = false;
            is_loading_teams = false;
            return;
        }
        const auth_state = get(auth_store);
        if (auth_state.current_token) {
            const authorization_check =
                await get_authorization_adapter().check_entity_authorized(
                    auth_state.current_token.raw_token,
                    "competition",
                    "create",
                );
            if (!authorization_check.success) return;
            if (!authorization_check.data.is_authorized) {
                access_denial_store.set_denial(
                    "/competitions/create",
                    "You do not have permission to create competitions.",
                );
                await goto("/competitions");
                return;
            }
        }
        await load_organizations();
    }
    async function load_organizations(): Promise<void> {
        is_loading_organizations = true;
        if (is_organization_restricted && current_auth_profile) {
            const result = await organization_use_cases.get_by_id(
                current_auth_profile.organization_id,
            );
            if (result.success && result.data) {
                organizations = [result.data];
                organization_options = [
                    { value: result.data.id, label: result.data.name },
                ];
                form_data.organization_id = result.data.id;
                await trigger_organization_side_effects(result.data.id);
            }
            is_loading_organizations = false;
            return;
        }

        const result = await organization_use_cases.list(undefined, {
            page_number: 1,
            page_size: 100,
        });
        if (result.success) {
            organizations = result.data?.items || [];
            organization_options = organizations.map(
                (current_organization: Organization) => ({
                    value: current_organization.id,
                    label: current_organization.name,
                }),
            );
        }
        is_loading_organizations = false;
    }
    async function load_competition_formats(
        organization_id?: string,
    ): Promise<void> {
        is_loading_formats = true;
        const result = await competition_format_use_cases.list(
            organization_id ? { organization_id } : undefined,
            { page_number: 1, page_size: 100 },
        );
        if (result.success) {
            competition_formats = (result.data?.items || []).filter(
                (current_format: CompetitionFormat) =>
                    current_format.status === "active",
            );
            competition_format_options = competition_formats.map(
                (current_format: CompetitionFormat) => ({
                    value: current_format.id,
                    label: current_format.name,
                }),
            );
        }
        is_loading_formats = false;
    }
    async function load_teams_for_organization(
        organization_id: string,
    ): Promise<void> {
        is_loading_teams = true;
        const result = await team_use_cases.list(
            { organization_id },
            { page_number: 1, page_size: 200 },
        );
        team_options = result.success
            ? (result.data?.items || []).map((current_team: Team) => ({
                  value: current_team.id,
                  label: current_team.name,
              }))
            : [];
        is_loading_teams = false;
    }
    async function trigger_organization_side_effects(
        organization_id: string,
    ): Promise<void> {
        selected_team_ids = new Set();
        team_options = [];
        competition_formats = [];
        competition_format_options = [];
        form_data = {
            ...form_data,
            competition_format_id: "",
            rule_overrides: {},
        };
        selected_format = null;
        selected_sport = null;
        await Promise.all([
            load_teams_for_organization(organization_id),
            load_competition_formats(organization_id),
        ]);
        const selected_organization = organizations.find(
            (current_organization: Organization) =>
                current_organization.id === organization_id,
        );
        if (!selected_organization?.sport_id) return;
        const sport_result = await get_sport_by_id(
            selected_organization.sport_id,
        );
        if (sport_result.success && sport_result.data)
            selected_sport = sport_result.data;
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
                (current_format: CompetitionFormat) =>
                    current_format.id === event.detail.value,
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
    async function create_competition_team_records(
        competition_id: string,
        team_ids: string[],
    ): Promise<boolean> {
        const registration_date = new Date().toISOString().split("T")[0];
        for (const competition_team_input of create_competition_team_inputs(
            competition_id,
            team_ids,
            registration_date,
        )) {
            const result = await competition_team_use_cases.create(
                competition_team_input,
            );
            if (result.success) continue;
            console.error(
                "[CompetitionCreate] Failed to create competition team",
                {
                    event: "competition_team_create_failed",
                    competition_id,
                    team_id: competition_team_input.team_id,
                    error: result.error,
                },
            );
            return false;
        }
        return true;
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
        const result = await competition_use_cases.create(form_data);
        if (!result.success || !result.data) {
            is_saving = false;
            show_toast(
                !result.success
                    ? result.error || "Failed to create competition"
                    : "Failed to create competition",
                "error",
            );
            return;
        }
        const teams_created = await create_competition_team_records(
            result.data.id,
            form_data.team_ids,
        );
        if (!teams_created) {
            is_saving = false;
            show_toast(
                "Competition created but failed to register some teams. Please add teams manually.",
                "error",
            );
            return;
        }
        is_saving = false;
        show_toast("Competition created successfully!", "success");
        setTimeout(() => goto("/competitions"), 1500);
    }
    function handle_cancel(): void {
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
    onMount(() => {
        void initialize_page();
    });
</script>

<svelte:head>
    <title>Create Competition - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
    {#if error_message}
        <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
            <p class="text-red-600 dark:text-red-400">{error_message}</p>
        </div>
    {/if}
    <CompetitionCreateEditor
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
        {status_options}
        {format_team_requirements}
        {is_team_count_valid}
        {is_saving}
        on_cancel={handle_cancel}
        on_organization_change={handle_organization_change}
        on_format_change={handle_format_change}
        on_toggle_team={handle_team_toggle}
        on_toggle_auto_squad_submission={handle_auto_squad_submission_toggle}
        on_submit={handle_submit}
    />
</div>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
