<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
    import type { Team } from "$lib/core/entities/Team";
    import {
        format_fixture_lineup_submission_date,
        get_fixture_lineup_name,
        get_fixture_lineup_status_class,
    } from "$lib/presentation/logic/fixtureLineupDetailPageState";

    export let lineup: FixtureLineup;
    export let fixture: Fixture | null;
    export let team: Team | null;
    export let home_team: Team | null;
    export let away_team: Team | null;
    export let permission_info_message: string;
</script>

{#if permission_info_message}
    <div
        class="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg"
    >
        <div class="flex items-start gap-3">
            <svg
                class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <p class="text-sm text-blue-800 dark:text-blue-200">
                {permission_info_message}
            </p>
        </div>
    </div>
{/if}

<div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
>
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1
                class="text-2xl font-bold text-accent-900 dark:text-accent-100 mb-2"
            >
                {team?.name || "Unknown Team"} Lineup
            </h1>
            <p class="text-accent-600 dark:text-accent-300">
                {get_fixture_lineup_name(fixture, home_team, away_team)}
            </p>
        </div>
        <span
            class="px-3 py-1 rounded-full {get_fixture_lineup_status_class(
                lineup.status,
            )}"
        >
            {lineup.status}
        </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card p-4">
            <p class="text-sm text-accent-600 dark:text-accent-400 mb-1">
                Players Selected
            </p>
            <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
                {lineup.selected_players.length}
            </p>
        </div>
        <div class="card p-4">
            <p class="text-sm text-accent-600 dark:text-accent-400 mb-1">
                Submitted By
            </p>
            <p class="text-lg font-medium text-accent-900 dark:text-accent-100">
                {lineup.submitted_by || "-"}
            </p>
        </div>
        <div class="card p-4">
            <p class="text-sm text-accent-600 dark:text-accent-400 mb-1">
                Submitted At
            </p>
            <p class="text-lg font-medium text-accent-900 dark:text-accent-100">
                {format_fixture_lineup_submission_date(lineup.submitted_at)}
            </p>
        </div>
    </div>
</div>
