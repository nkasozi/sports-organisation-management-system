<script lang="ts">
    import type { Organization } from "$lib/core/entities/Organization";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import type {
        OfficialLeaderboardEntry,
        PerFixtureRating,
    } from "$lib/presentation/logic/officialLeaderboardLogic";
    import {
        can_user_change_official_leaderboard_organizations,
        get_selected_official_leaderboard_organization_name,
        type OfficialLeaderboardProfileState,
    } from "$lib/presentation/logic/officialLeaderboardPageState";
    import { auth_store } from "$lib/presentation/stores/auth";

    import OfficialLeaderboardBreakdownPanel from "../OfficialLeaderboardBreakdownPanel.svelte";
    import OfficialLeaderboardTable from "../OfficialLeaderboardTable.svelte";

    export let error_message: string;
    export let is_loading: boolean;
    export let leaderboard_entries: OfficialLeaderboardEntry[];
    export let organizations: Organization[];
    export let selected_breakdown: PerFixtureRating[];
    export let selected_entry: OfficialLeaderboardEntry | undefined;
    export let selected_organization_id: string;
    export let user_official_id: string;
    export let on_close_breakdown: () => void;
    export let on_organization_change: () => void;
    export let on_select_official: (entry: OfficialLeaderboardEntry) => void;

    function get_official_leaderboard_profile_state(): OfficialLeaderboardProfileState {
        const current_profile_state = $auth_store.current_profile;

        if (current_profile_state.status !== "present") {
            return { status: "missing" };
        }

        return {
            status: "present",
            profile: current_profile_state.profile as unknown as UserScopeProfile,
        };
    }
</script>

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
            {#if can_user_change_official_leaderboard_organizations(get_official_leaderboard_profile_state())}
                <select
                    bind:value={selected_organization_id}
                    onchange={on_organization_change}
                    class="select-styled w-full sm:w-auto sm:min-w-[200px]"
                >
                    {#each organizations as organization}
                        <option value={organization.id}
                            >{organization.name}</option
                        >
                    {/each}
                </select>
            {:else if organizations.length > 0}
                <span
                    class="rounded-[0.175rem] bg-accent-100 px-3 py-2 text-sm font-medium text-accent-700 dark:bg-accent-800 dark:text-accent-300"
                    >{get_selected_official_leaderboard_organization_name(
                        organizations,
                        selected_organization_id,
                    )}</span
                >
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
            class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
            {error_message}
        </div>
    {:else if leaderboard_entries.length === 0}
        <div class="card p-8 text-center text-accent-500 dark:text-accent-400">
            No performance ratings have been recorded yet.
        </div>
    {:else}
        {#if !user_official_id}<p
                class="text-xs text-accent-500 dark:text-accent-400"
            >
                Click a row to see the full breakdown and notes for that
                official.
            </p>{/if}
        <OfficialLeaderboardTable
            entries={leaderboard_entries}
            selected_official_id={selected_entry?.official_id ?? ""}
            on_select={on_select_official}
        />
        {#if selected_entry}
            <OfficialLeaderboardBreakdownPanel
                entry={selected_entry}
                breakdown_items={selected_breakdown}
                on_close={on_close_breakdown}
            />
        {/if}
    {/if}
</div>
