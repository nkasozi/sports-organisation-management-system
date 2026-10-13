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
    import {
        authorize_competition_edit_page,
        build_competition_edit_current_profile_state,
        build_competition_edit_raw_token_state,
    } from "$lib/presentation/logic/competitionEditPageAuthorization";
    import type {
        CompetitionEditSelectedFormatState,
        CompetitionEditSelectedSportState,
    } from "$lib/presentation/logic/competitionEditPageContracts";
    import { load_competition_edit_page_data } from "$lib/presentation/logic/competitionEditPageData";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import {
        COMPETITION_EDIT_AUTHORIZATION_STATUS,
        COMPETITION_EDIT_LOG_EVENTS,
        COMPETITION_EDIT_PAGE_TEXT,
    } from "./competitionEditPageMessages";
    import CompetitionEditWorkspace from "./CompetitionEditWorkspace.svelte";

    export let competition_id: string;

    const competition_use_cases = get_competition_use_cases();
    const organization_use_cases = get_organization_use_cases();
    const team_use_cases = get_team_use_cases();
    const competition_team_use_cases = get_competition_team_use_cases();
    const competition_format_use_cases = get_competition_format_use_cases();

    type CompetitionEditCompetitionState =
        | { status: typeof PRESENCE_STATUS.MISSING }
        | {
              status: typeof PRESENCE_STATUS.PRESENT;
              competition: Competition;
          };

    let competition_state: CompetitionEditCompetitionState = {
        status: PRESENCE_STATUS.MISSING,
    };
    let organizations: Organization[] = [];
    let competition_formats: CompetitionFormat[] = [];
    let all_teams: Team[] = [];
    let competition_team_entries: CompetitionTeam[] = [];
    let selected_format_state: CompetitionEditSelectedFormatState = {
        status: PRESENCE_STATUS.MISSING,
    };
    let selected_sport_state: CompetitionEditSelectedSportState = {
        status: PRESENCE_STATUS.MISSING,
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

    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            loading_state = "error";
            return;
        }
        if (!competition_id) {
            error_message = COMPETITION_EDIT_PAGE_TEXT.MISSING_ID;
            loading_state = "error";
            return;
        }
        if (!(await authorize_page())) return;
        await load_competition_data();
    }

    async function authorize_page(): Promise<boolean> {
        const authorization = await authorize_competition_edit_page({
            raw_token_state: build_competition_edit_raw_token_state(
                get(auth_store),
            ),
            get_authorization_adapter,
            deny_access: () => {
                access_denial_store.set_denial(
                    `${COMPETITION_EDIT_PAGE_TEXT.LIST_PATH}/${competition_id}`,
                    COMPETITION_EDIT_PAGE_TEXT.ACCESS_DENIED,
                );
                void goto(COMPETITION_EDIT_PAGE_TEXT.LIST_PATH);
            },
        });
        if (
            authorization.status ===
            COMPETITION_EDIT_AUTHORIZATION_STATUS.HALTED
        )
            return false;
        can_edit_competition = authorization.can_edit_competition;
        permission_info_message = authorization.permission_info_message;
        return true;
    }

    async function load_competition_data(): Promise<void> {
        loading_state = "loading";
        const load_result = await load_competition_edit_page_data({
            competition_id,
            current_profile_state: build_competition_edit_current_profile_state(
                get(auth_store),
            ),
            dependencies: {
                competition_use_cases,
                organization_use_cases,
                team_use_cases,
                competition_team_use_cases,
                competition_format_use_cases,
            },
        });
        if (!load_result.success) {
            console.error("[CompetitionEdit] Page load failed", {
                event: COMPETITION_EDIT_LOG_EVENTS.LOAD_FAILED,
                competition_id,
                error: load_result.error_message,
            });
            error_message = COMPETITION_EDIT_PAGE_TEXT.LOAD_FAILED;
            loading_state = "error";
            return;
        }
        competition_state = {
            status: PRESENCE_STATUS.PRESENT,
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
        {competition_state.status === PRESENCE_STATUS.PRESENT
            ? competition_state.competition.name
            : COMPETITION_EDIT_PAGE_TEXT.PAGE_TITLE_FALLBACK} - {COMPETITION_EDIT_PAGE_TEXT.PAGE_TITLE_SUFFIX}
    </title>
</svelte:head>

<LoadingStateWrapper
    state={loading_state}
    {error_message}
    loading_text={COMPETITION_EDIT_PAGE_TEXT.LOADING}
>
    {#if competition_state.status === PRESENCE_STATUS.PRESENT}
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
