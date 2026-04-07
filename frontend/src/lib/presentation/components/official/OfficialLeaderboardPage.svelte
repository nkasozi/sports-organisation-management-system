<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Official } from "$lib/core/entities/Official";
    import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import type {
        OfficialLeaderboardEntry,
        PerFixtureRating,
    } from "$lib/presentation/logic/officialLeaderboardLogic";
    import { official_leaderboard_page_dependencies } from "$lib/presentation/logic/officialLeaderboardPageDependencies";
    import {
        load_official_leaderboard_page_state,
        type OfficialLeaderboardPageData,
    } from "$lib/presentation/logic/officialLeaderboardPageLoad";
    import {
        rebuild_official_leaderboard_view,
        select_official_leaderboard_entry,
    } from "$lib/presentation/logic/officialLeaderboardPageState";
    import { auth_store } from "$lib/presentation/stores/auth";

    import OfficialLeaderboardPageShell from "./OfficialLeaderboardPageShell.svelte";

    let is_loading = true,
        error_message = "",
        organizations: Organization[] = [],
        selected_organization_id = "",
        leaderboard_entries: OfficialLeaderboardEntry[] = [],
        selected_entry: OfficialLeaderboardEntry | null = null,
        selected_breakdown: PerFixtureRating[] = [],
        user_official_id: string | null = null,
        all_ratings: OfficialPerformanceRating[] = [],
        all_officials: Official[] = [],
        all_fixtures: Fixture[] = [],
        all_stages: CompetitionStage[] = [];

    async function load_all_data(): Promise<void> {
        is_loading = true;
        error_message = "";
        const profile = get(auth_store)
            .current_profile as UserScopeProfile | null;
        const load_result = await load_official_leaderboard_page_state({
            profile,
            dependencies: official_leaderboard_page_dependencies,
        });
        if (!load_result.success) {
            error_message = load_result.error_message;
            is_loading = false;
            return;
        }
        apply_page_state(load_result.data);
        is_loading = false;
    }

    function apply_page_state(page_state: OfficialLeaderboardPageData): void {
        organizations = page_state.organizations;
        selected_organization_id = page_state.selected_organization_id;
        leaderboard_entries = page_state.leaderboard_entries;
        selected_entry = page_state.selected_entry;
        selected_breakdown = page_state.selected_breakdown;
        user_official_id = page_state.user_official_id;
        all_ratings = page_state.all_ratings;
        all_officials = page_state.all_officials;
        all_fixtures = page_state.all_fixtures;
        all_stages = page_state.all_stages;
    }

    function rebuild_entries(): void {
        ({ leaderboard_entries, selected_entry, selected_breakdown } =
            rebuild_official_leaderboard_view({
                all_ratings,
                all_officials,
                all_fixtures,
                all_stages,
                selected_organization_id,
                user_official_id,
            }));
    }

    function select_official(entry: OfficialLeaderboardEntry): void {
        ({ selected_entry, selected_breakdown } =
            select_official_leaderboard_entry({
                all_ratings,
                all_fixtures,
                selected_organization_id,
                entry,
            }));
    }

    function close_breakdown(): void {
        selected_entry = null;
        selected_breakdown = [];
    }

    function handle_organization_change(): void {
        if (selected_entry && !user_official_id) close_breakdown();
        rebuild_entries();
    }

    onMount(async () => {
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            is_loading = false;
            return;
        }
        await load_all_data();
    });
</script>

<svelte:head
    ><title>Official Performance Leaderboard - Sports Management</title
    ></svelte:head
>

<OfficialLeaderboardPageShell
    {organizations}
    bind:selected_organization_id
    {leaderboard_entries}
    {selected_entry}
    {selected_breakdown}
    {user_official_id}
    {is_loading}
    {error_message}
    on_close_breakdown={close_breakdown}
    on_organization_change={handle_organization_change}
    on_select_official={select_official}
/>
