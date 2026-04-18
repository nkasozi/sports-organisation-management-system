<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    import type {
        CompetitionResultsCompetitionFormatState,
        CompetitionResultsSelectedCompetitionState,
    } from "$lib/presentation/logic/competitionResultsPageContracts";
    import { create_competition_results_page_controller_runtime } from "$lib/presentation/logic/competitionResultsPageControllerRuntime";
    import { type CompetitionResultsSelectedBundle } from "$lib/presentation/logic/competitionResultsPageState";
    import {
        auth_store,
        is_public_viewer,
    } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";
    import { public_organization_store } from "$lib/presentation/stores/publicOrganization";

    import CompetitionResultsPageContent from "./CompetitionResultsPageContent.svelte";

    let organizations: Organization[] = [],
        selected_organization_id = "",
        competitions: Competition[] = [],
        selected_competition_id = "",
        selected_competition_state: CompetitionResultsSelectedCompetitionState = {
            status: "missing",
        },
        competition_format_state: CompetitionResultsCompetitionFormatState = {
            status: "missing",
        },
        competition_stages: CompetitionStage[] = [],
        fixtures: Fixture[] = [],
        teams: Team[] = [],
        team_map: Map<string, Team> = new Map(),
        loading_state: LoadingState = "loading",
        fixtures_loading = false,
        error_message = "",
        is_using_cached_data = false,
        can_change_organizations = false;

    function apply_competition_results_bundle(
        bundle: CompetitionResultsSelectedBundle,
    ): void {
        selected_competition_state = bundle.selected_competition_state;
        competition_format_state = bundle.competition_format_state;
        competition_stages = bundle.competition_stages;
        fixtures = bundle.fixtures;
        teams = bundle.teams;
        team_map = bundle.team_map;
    }

    function build_competition_results_profile_state() {
        const current_profile = get(auth_store).current_profile;

        if (current_profile.status !== "present") {
            return { status: "missing" as const };
        }

        return {
            status: "present" as const,
            profile: {
                organization_id: current_profile.profile.organization_id,
                role: current_profile.profile.role,
            },
        };
    }

    async function sync_branding_for_org(
        organization: Organization,
    ): Promise<void> {
        await branding_store.set_organization_context({
            status: "scoped",
            organization_id: organization.id,
            organization_name: organization.name,
            organization_email: organization.contact_email,
            organization_address: organization.address,
        });
    }

    const runtime = create_competition_results_page_controller_runtime({
        apply_bundle: apply_competition_results_bundle,
        get_auth_state: () => ({
            current_profile_state: build_competition_results_profile_state(),
        }),
        get_is_public: () => get(is_public_viewer),
        get_organizations: () => organizations,
        get_page_url: () => get(page).url,
        get_saved_organization_id: () =>
            get(public_organization_store).organization_id,
        get_selected_competition_id: () => selected_competition_id,
        get_selected_organization_id: () => selected_organization_id,
        is_browser: browser,
        set_can_change_organizations: (value: boolean) =>
            (can_change_organizations = value),
        set_competitions: (value: Competition[]) => (competitions = value),
        set_error_message: (value: string) => (error_message = value),
        set_fixtures_loading: (value: boolean) => (fixtures_loading = value),
        set_is_using_cached_data: (value: boolean) =>
            (is_using_cached_data = value),
        set_loading_state: (value: LoadingState) => (loading_state = value),
        set_organizations: (value: Organization[]) => (organizations = value),
        set_selected_competition_id: (value: string) =>
            (selected_competition_id = value),
        set_selected_organization_id: (value: string) =>
            (selected_organization_id = value),
        sync_branding_for_org,
        sync_public_organization: async (organization: Organization) => {
            await public_organization_store.set_organization(
                organization.id,
                organization.name,
            );
            await sync_branding_for_org(organization);
        },
    });

    onMount(() => void runtime.initialize_page());
</script>

<svelte:head>
    <title>Competition Results - Sports Management</title>
</svelte:head>

<CompetitionResultsPageContent
    {is_using_cached_data}
    {loading_state}
    {error_message}
    {organizations}
    bind:selected_organization_id
    {competitions}
    bind:selected_competition_id
    {selected_competition_state}
    {competition_format_state}
    {competition_stages}
    {fixtures}
    {teams}
    {team_map}
    {fixtures_loading}
    {can_change_organizations}
    on_organization_change={runtime.handle_organization_change}
    on_competition_change={() => void runtime.load_competition_data()}
/>
