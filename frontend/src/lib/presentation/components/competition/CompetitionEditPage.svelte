<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_competition_format_use_cases,
        get_competition_team_use_cases,
        get_competition_use_cases,
        get_organization_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import type {
        CompetitionEditSelectedFormatState,
        CompetitionEditSelectedSportState,
    } from "$lib/presentation/logic/competitionEditPageContracts";
    import { load_competition_edit_page_data } from "$lib/presentation/logic/competitionEditPageData";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import CompetitionEditWorkspace from "./CompetitionEditWorkspace.svelte";

    export let competition_id: string;

    const competition_use_cases = get_competition_use_cases();
    const organization_use_cases = get_organization_use_cases();
    const team_use_cases = get_team_use_cases();
    const competition_team_use_cases = get_competition_team_use_cases();
    const competition_format_use_cases = get_competition_format_use_cases();

    type CompetitionEditCompetitionState =
        | { status: "missing" }
        | { status: "present"; competition: Competition };

    type CompetitionEditCurrentProfileState =
        | { status: "missing" }
        | { status: "present"; profile: UserScopeProfile };

    let competition_state: CompetitionEditCompetitionState = {
        status: "missing",
    };
    let organizations: Organization[] = [];
    let competition_formats: CompetitionFormat[] = [];
    let all_teams: Team[] = [];
    let competition_team_entries: CompetitionTeam[] = [];
    let selected_format_state: CompetitionEditSelectedFormatState = {
        status: "missing",
    };
    let selected_sport_state: CompetitionEditSelectedSportState = {
        status: "missing",
    };
    let form_data: UpdateCompetitionInput = {};
    let loading_state: LoadingState = "idle";
    let error_message = "";
    let is_customizing_scoring = false;
    let can_edit_competition = false;
    let permission_info_message = "";

    onMount(() => {
        void initialize_page();
    });

    function build_competition_edit_current_profile_state(): CompetitionEditCurrentProfileState {
        const current_profile_state = get(auth_store).current_profile;

        if (current_profile_state.status !== "present") {
            return { status: "missing" };
        }

        return {
            status: "present",
            profile: current_profile_state.profile as unknown as UserScopeProfile,
        };
    }

    function build_competition_edit_raw_token_state():
        | { status: "missing" }
        | { status: "present"; raw_token: string } {
        const current_token_state = get(auth_store).current_token;

        if (current_token_state.status !== "present") {
            return { status: "missing" };
        }

        return {
            status: "present",
            raw_token: current_token_state.token.raw_token,
        };
    }

    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            loading_state = "error";
            return;
        }
        if (!competition_id) {
            error_message = "Competition ID is required";
            loading_state = "error";
            return;
        }
        if (!(await authorize_page())) return;
        await load_competition_data();
    }

    async function authorize_page(): Promise<boolean> {
        const current_token_state = build_competition_edit_raw_token_state();

        if (current_token_state.status !== "present") return true;

        const read_auth_check =
            await get_authorization_adapter().check_entity_authorized(
                current_token_state.raw_token,
                "competition",
                "read",
            );
        if (!read_auth_check.success) return false;
        if (!read_auth_check.data.is_authorized) {
            access_denial_store.set_denial(
                `/competitions/${competition_id}`,
                "You do not have permission to view this competition.",
            );
            goto("/competitions");
            return false;
        }
        const update_auth_check =
            await get_authorization_adapter().check_entity_authorized(
                current_token_state.raw_token,
                "competition",
                "update",
            );
        can_edit_competition =
            update_auth_check.success && update_auth_check.data.is_authorized;
        permission_info_message = can_edit_competition
            ? ""
            : "You have view-only access to this competition. Editing is not available.";
        return true;
    }

    async function load_competition_data(): Promise<void> {
        loading_state = "loading";
        const load_result = await load_competition_edit_page_data({
            competition_id,
            current_profile_state: build_competition_edit_current_profile_state(),
            dependencies: {
                competition_use_cases,
                organization_use_cases,
                team_use_cases,
                competition_team_use_cases,
                competition_format_use_cases,
            },
        });
        if (!load_result.success) {
            error_message = load_result.error_message;
            loading_state = "error";
            return;
        }
        competition_state = {
            status: "present",
            competition: load_result.data.competition,
        };
        organizations = load_result.data.organizations;
        competition_formats = load_result.data.competition_formats;
        all_teams = load_result.data.all_teams;
        competition_team_entries = load_result.data.competition_team_entries;
        form_data = load_result.data.form_data;
        selected_format_state = load_result.data.selected_format_state;
        selected_sport_state = load_result.data.selected_sport_state;
        is_customizing_scoring = load_result.data.is_customizing_scoring;
        loading_state = "success";
    }
</script>

<svelte:head>
    <title>
        {competition_state.status === "present"
            ? competition_state.competition.name
            : "Edit Competition"} - Sports Management
    </title>
</svelte:head>

<LoadingStateWrapper
    state={loading_state}
    {error_message}
    loading_text="Loading competition..."
>
    {#if competition_state.status === "present"}
        <CompetitionEditWorkspace
            {competition_id}
            competition={competition_state.competition}
            {organizations}
            {competition_formats}
            {all_teams}
            {competition_team_entries}
            bind:form_data
            {selected_format_state}
            {selected_sport_state}
            bind:is_customizing_scoring
            {can_edit_competition}
            {permission_info_message}
        />
    {/if}
</LoadingStateWrapper>
