<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { auth_store } from "$lib/presentation/stores/auth";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        get_scope_value,
        ANY_VALUE,
        type UserScopeProfile,
    } from "$lib/core/interfaces/ports";
    import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
    import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
    import { get_official_performance_rating_use_cases } from "$lib/core/usecases/OfficialPerformanceRatingUseCases";
    import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
    import { get_competition_stage_use_cases } from "$lib/core/usecases/CompetitionStageUseCases";
    import {
        build_leaderboard_entries,
        build_official_name_map,
        build_fixture_label_map,
        filter_ratings_by_organization,
        filter_ratings_by_official,
        build_per_fixture_breakdown,
        type OfficialLeaderboardEntry,
        type PerFixtureRating,
    } from "$lib/presentation/logic/officialLeaderboardLogic";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Official } from "$lib/core/entities/Official";
    import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import OfficialLeaderboardTable from "$lib/presentation/components/OfficialLeaderboardTable.svelte";
    import OfficialLeaderboardBreakdownPanel from "$lib/presentation/components/OfficialLeaderboardBreakdownPanel.svelte";

    let is_loading = true;
    let error_message = "";
    let organizations: Organization[] = [];
    let selected_organization_id = "";
    let leaderboard_entries: OfficialLeaderboardEntry[] = [];
    let selected_entry: OfficialLeaderboardEntry | null = null;
    let selected_breakdown: PerFixtureRating[] = [];
    let user_official_id: string | null = null;
    let all_ratings: OfficialPerformanceRating[] = [];
    let all_officials: Official[] = [];
    let all_fixtures: Fixture[] = [];
    let all_stages: CompetitionStage[] = [];

    function can_user_change_organizations(): boolean {
        const profile = get(auth_store)
            .current_profile as UserScopeProfile | null;
        if (!profile) return false;
        return (
            profile.organization_id === ANY_VALUE || !profile.organization_id
        );
    }

    function get_selected_org_name(): string {
        return (
            organizations.find((o) => o.id === selected_organization_id)
                ?.name ?? "Organization"
        );
    }

    function resolve_organizations(
        all_orgs: Organization[],
        profile: UserScopeProfile | null,
    ): Organization[] {
        const org_scope = get_scope_value(profile, "organization_id");
        if (!org_scope) return all_orgs;
        return all_orgs.filter((o) => o.id === org_scope);
    }

    onMount(async () => {
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            is_loading = false;
            return;
        }
        const profile = get(auth_store)
            .current_profile as UserScopeProfile | null;
        user_official_id = get_scope_value(profile, "official_id");
        await load_all_data();
    });

    async function load_all_data(): Promise<void> {
        is_loading = true;
        error_message = "";
        const [
            org_result,
            ratings_result,
            officials_result,
            fixtures_result,
            stages_result,
        ] = await Promise.all([
            get_organization_use_cases().list(),
            get_official_performance_rating_use_cases().list(undefined, {
                page_size: 1000,
            }),
            get_official_use_cases().list(undefined, { page_size: 1000 }),
            get_fixture_use_cases().list(undefined, { page_size: 1000 }),
            get_competition_stage_use_cases().list(undefined, {
                page_size: 1000,
            }),
        ]);

        const data_load_failed =
            !ratings_result.success ||
            !officials_result.success ||
            !fixtures_result.success ||
            !stages_result.success;
        if (data_load_failed) {
            error_message =
                "Failed to load leaderboard data. Please try again.";
            console.error("[OfficialLeaderboard] Data load failed", {
                event: "official_leaderboard_load_failed",
                ratings_ok: ratings_result.success,
                officials_ok: officials_result.success,
                fixtures_ok: fixtures_result.success,
                stages_ok: stages_result.success,
            });
            is_loading = false;
            return;
        }
        const profile = get(auth_store)
            .current_profile as UserScopeProfile | null;
        organizations = resolve_organizations(
            org_result.success ? org_result.data.items : [],
            profile,
        );
        selected_organization_id = organizations[0]?.id ?? "";
        all_ratings = ratings_result.data?.items ?? [];
        all_officials = officials_result.data?.items ?? [];
        all_fixtures = fixtures_result.data?.items ?? [];
        all_stages = stages_result.data?.items ?? [];
        rebuild_entries();
        is_loading = false;
    }

    function rebuild_entries(): void {
        const org_filtered = filter_ratings_by_organization(
            all_ratings,
            selected_organization_id,
        );
        const filtered = user_official_id
            ? filter_ratings_by_official(org_filtered, user_official_id)
            : org_filtered;
        const name_map = build_official_name_map(all_officials);
        leaderboard_entries = build_leaderboard_entries(
            filtered,
            all_fixtures,
            all_stages,
            name_map,
        );
        if (user_official_id && leaderboard_entries.length > 0) {
            select_official(leaderboard_entries[0]);
        }
        console.info("[OfficialLeaderboard] Entries rebuilt", {
            event: "official_leaderboard_rebuilt",
            entry_count: leaderboard_entries.length,
            organization_id: selected_organization_id,
        });
    }

    function select_official(entry: OfficialLeaderboardEntry): void {
        const org_filtered = filter_ratings_by_organization(
            all_ratings,
            selected_organization_id,
        );
        const official_ratings = filter_ratings_by_official(
            org_filtered,
            entry.official_id,
        );
        const fixture_label_map = build_fixture_label_map(all_fixtures);
        selected_breakdown = build_per_fixture_breakdown(
            official_ratings,
            fixture_label_map,
            all_fixtures,
        );
        selected_entry = entry;
        console.info("[OfficialLeaderboard] Official selected", {
            event: "official_leaderboard_entry_selected",
            official_id: entry.official_id,
            rating_count: selected_breakdown.length,
        });
    }

    function close_breakdown(): void {
        selected_entry = null;
        selected_breakdown = [];
    }

    function handle_organization_change(): void {
        if (selected_entry && !user_official_id) close_breakdown();
        rebuild_entries();
    }
</script>

<svelte:head>
    <title>Official Performance Leaderboard - Sports Management</title>
</svelte:head>

<div class="space-y-4">
    <div
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
        <div>
            <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
                {user_official_id
                    ? "Your Performance"
                    : "Official Performance Leaderboard"}
            </h1>
            <p class="mt-1 text-sm text-accent-600 dark:text-accent-400">
                Aggregated ratings across all fixtures, weighted by match
                importance.
            </p>
        </div>
        <div class="shrink-0">
            {#if can_user_change_organizations()}
                <select
                    bind:value={selected_organization_id}
                    onchange={handle_organization_change}
                    class="select-styled w-full sm:w-auto sm:min-w-[200px]"
                >
                    {#each organizations as org}
                        <option value={org.id}>{org.name}</option>
                    {/each}
                </select>
            {:else if organizations.length > 0}
                <span
                    class="rounded-lg bg-accent-100 px-3 py-2 text-sm font-medium
                 text-accent-700 dark:bg-accent-800 dark:text-accent-300"
                >
                    {get_selected_org_name()}
                </span>
            {/if}
        </div>
    </div>
    <hr class="border-accent-200 dark:border-accent-700" />

    {#if is_loading}
        <div class="card p-8 text-center text-accent-500 dark:text-accent-400">
            Loading leaderboard...
        </div>
    {:else if error_message}
        <div
            class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm
             text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
            {error_message}
        </div>
    {:else if leaderboard_entries.length === 0}
        <div class="card p-8 text-center text-accent-500 dark:text-accent-400">
            No performance ratings have been recorded yet.
        </div>
    {:else}
        {#if !user_official_id}
            <p class="text-xs text-accent-500 dark:text-accent-400">
                Click a row to see the full breakdown and notes for that
                official.
            </p>
        {/if}
        <OfficialLeaderboardTable
            entries={leaderboard_entries}
            selected_official_id={selected_entry?.official_id ?? ""}
            on_select={select_official}
        />
        {#if selected_entry}
            <OfficialLeaderboardBreakdownPanel
                entry={selected_entry}
                breakdown_items={selected_breakdown}
                on_close={close_breakdown}
            />
        {/if}
    {/if}
</div>
