<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Official } from "$lib/core/entities/Official";
    import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import OfficialLeaderboardBreakdownPanel from "$lib/presentation/components/OfficialLeaderboardBreakdownPanel.svelte";
    import OfficialLeaderboardTable from "$lib/presentation/components/OfficialLeaderboardTable.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import type {
        OfficialLeaderboardEntry,
        PerFixtureRating,
    } from "$lib/presentation/logic/officialLeaderboardLogic";
    import { auth_store } from "$lib/presentation/stores/auth";

    import { official_leaderboard_page_dependencies } from "../../lib/presentation/logic/officialLeaderboardPageDependencies";
    import {
        load_official_leaderboard_page_state,
        type OfficialLeaderboardPageData,
    } from "../../lib/presentation/logic/officialLeaderboardPageLoad";
    import {
        can_user_change_official_leaderboard_organizations,
        get_selected_official_leaderboard_organization_name,
        rebuild_official_leaderboard_view,
        select_official_leaderboard_entry,
    } from "../../lib/presentation/logic/officialLeaderboardPageState";

    let is_loading = true,
        error_message = "";
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

    function get_selected_org_name(): string {
        return get_selected_official_leaderboard_organization_name(
            organizations,
            selected_organization_id,
        );
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
            {#if can_user_change_official_leaderboard_organizations(get(auth_store).current_profile as UserScopeProfile | null)}
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
                    class="rounded-md bg-accent-100 px-3 py-2 text-sm font-medium
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
