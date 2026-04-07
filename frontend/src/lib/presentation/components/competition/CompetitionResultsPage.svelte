<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import {
        get_competition_format_use_cases,
        get_competition_stage_use_cases,
        get_competition_team_use_cases,
        get_competition_use_cases,
        get_fixture_use_cases,
        get_organization_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";
    import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { extract_competition_results_url_params } from "$lib/presentation/logic/competitionResultsPageData";
    import { initialize_competition_results_page } from "$lib/presentation/logic/competitionResultsPageInitialization";
    import {
        type CompetitionResultsSelectedBundle,
        create_empty_competition_results_bundle,
        derive_competition_results_can_change_organizations,
        find_competition_results_organization,
        load_competition_results_bundle,
        load_competitions_for_results_organization,
    } from "$lib/presentation/logic/competitionResultsPageState";
    import {
        auth_store,
        is_public_viewer,
    } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";
    import { public_organization_store } from "$lib/presentation/stores/publicOrganization";

    import CompetitionResultsPageContent from "./CompetitionResultsPageContent.svelte";

    const competition_use_cases = get_competition_use_cases();
    const fixture_use_cases = get_fixture_use_cases();
    const team_use_cases = get_team_use_cases();
    const format_use_cases = get_competition_format_use_cases();
    const competition_stage_use_cases = get_competition_stage_use_cases();
    const competition_team_use_cases = get_competition_team_use_cases();
    const organization_use_cases = get_organization_use_cases();

    let organizations: Organization[] = [];
    let selected_organization_id = "";
    let competitions: Competition[] = [];
    let selected_competition_id = "";
    let selected_competition: Competition | null = null;
    let competition_format: CompetitionFormat | null = null;
    let competition_stages: CompetitionStage[] = [];
    let fixtures: Fixture[] = [];
    let teams: Team[] = [];
    let team_map: Map<string, Team> = new Map();
    let loading_state: LoadingState = "loading";
    let fixtures_loading = false;
    let error_message = "";
    let is_using_cached_data = false;
    let can_change_organizations = false;

    const competition_results_dependencies = {
        organization_use_cases,
        competition_use_cases,
        format_use_cases,
        competition_stage_use_cases,
        competition_team_use_cases,
        team_use_cases,
        fixture_use_cases,
    };

    function apply_competition_results_bundle(
        bundle: CompetitionResultsSelectedBundle,
    ): void {
        selected_competition = bundle.selected_competition;
        competition_format = bundle.competition_format;
        competition_stages = bundle.competition_stages;
        fixtures = bundle.fixtures;
        teams = bundle.teams;
        team_map = bundle.team_map;
    }

    async function sync_branding_for_org(
        organization: Organization,
    ): Promise<void> {
        await branding_store.set_organization_context(
            organization.id,
            organization.name,
            organization.contact_email,
            organization.address,
        );
    }

    async function load_competition_data(): Promise<void> {
        const bundle = await load_competition_results_bundle(
            competition_results_dependencies,
            selected_competition_id,
        );
        apply_competition_results_bundle(bundle);
    }

    async function load_competitions_for_organization(
        organization_id: string,
    ): Promise<void> {
        const result = await load_competitions_for_results_organization(
            competition_results_dependencies,
            organization_id,
        );
        competitions = result.competitions;
        selected_competition_id = result.selected_competition_id;
        apply_competition_results_bundle(result.bundle);
    }

    async function handle_organization_change(): Promise<void> {
        if (!selected_organization_id) return;
        const is_public = get(is_public_viewer);
        const url_params = extract_competition_results_url_params(
            get(page).url,
        );
        if (is_public && url_params.org_id.length === 0) {
            const selected_org = find_competition_results_organization(
                organizations,
                selected_organization_id,
            );
            if (selected_org) {
                await public_organization_store.set_organization(
                    selected_org.id,
                    selected_org.name,
                );
                await sync_branding_for_org(selected_org);
            }
        }
        fixtures_loading = true;
        await load_competitions_for_organization(selected_organization_id);
        fixtures_loading = false;
    }

    onMount(() => {
        void initialize_page();
    });

    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const url_params = extract_competition_results_url_params(
            get(page).url,
        );
        const auth_result = await ensure_auth_profile();
        const is_public = get(is_public_viewer);

        if (!auth_result.success && !is_public) {
            error_message = auth_result.error_message;
            loading_state = "error";
            return;
        }

        can_change_organizations =
            derive_competition_results_can_change_organizations(
                get(auth_store).current_profile,
                url_params.org_id,
            );
        loading_state = "loading";

        try {
            const initialized_page = await initialize_competition_results_page({
                current_profile: get(auth_store).current_profile,
                competition_results_dependencies,
                url_params,
                is_public,
                saved_organization_id: get(public_organization_store)
                    .organization_id,
                sync_public_organization: async (
                    organization: Organization,
                ): Promise<void> => {
                    await public_organization_store.set_organization(
                        organization.id,
                        organization.name,
                    );
                    await sync_branding_for_org(organization);
                },
                load_public_data: () =>
                    fetch_public_data_from_convex("competition_results"),
            });
            is_using_cached_data = initialized_page.is_using_cached_data;
            organizations = initialized_page.organizations;
            selected_organization_id =
                initialized_page.selected_organization_id;
            competitions = initialized_page.competitions;
            selected_competition_id = initialized_page.selected_competition_id;
            apply_competition_results_bundle(initialized_page.bundle);

            loading_state = "success";
        } catch (error) {
            console.error(
                "[CompetitionResultsPage] Failed to initialize page",
                {
                    event: "competition_results_page_initialize_failed",
                    organization_id: url_params.org_id || "unknown",
                    competition_id: url_params.competition_id || "unknown",
                    error: String(error),
                },
            );
            error_message =
                error instanceof Error ? error.message : "Failed to load data";
            loading_state = "error";
            apply_competition_results_bundle(
                create_empty_competition_results_bundle(),
            );
        }
    }
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
    {selected_competition}
    {competition_format}
    {competition_stages}
    {fixtures}
    {teams}
    {team_map}
    {fixtures_loading}
    {can_change_organizations}
    on_organization_change={handle_organization_change}
    on_competition_change={() => void load_competition_data()}
/>
