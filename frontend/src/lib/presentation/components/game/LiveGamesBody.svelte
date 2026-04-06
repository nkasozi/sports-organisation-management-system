<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
    import LiveGamesFixtureCard from "./LiveGamesFixtureCard.svelte";

    export let is_loading: boolean;
    export let error_message: string;
    export let has_organizations: boolean;
    export let is_loading_fixtures: boolean;
    export let incomplete_fixtures: Fixture[] = [];
    export let can_start_games: boolean;
    export let team_names: Record<string, string> = {};
    export let team_logo_urls: Record<string, string> = {};
    export let competition_names: Record<string, string> = {};
    export let sport_names: Record<string, string> = {};
    export let current_checks: Record<string, PreFlightCheck[]> = {};
    export let is_starting: Record<string, boolean> = {};
    export let on_start_click: (fixture: Fixture) => void;

    function get_team_name(team_id: string): string {
        return team_names[team_id] || "Unknown Team";
    }

    function get_competition_name(competition_id: string): string {
        return competition_names[competition_id] || "Unknown Competition";
    }

    function get_sport_name(competition_id: string): string {
        return sport_names[competition_id] || "Unknown Sport";
    }
</script>

{#if is_loading}
    <div class="flex justify-center items-center py-12">
        <div
            class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"
        ></div>
    </div>
{:else if error_message}
    <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
        <p class="text-red-600 dark:text-red-400">{error_message}</p>
    </div>
{:else if !has_organizations}
    <div
        class="bg-accent-50 dark:bg-accent-800 rounded-xl p-6 sm:p-8 text-center"
    >
        <p class="text-accent-600 dark:text-accent-300 mb-4">
            No organizations found
        </p>
        <a
            href="/organizations"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
            Go to Organizations
        </a>
    </div>
{:else if is_loading_fixtures}
    <div class="flex justify-center items-center py-12">
        <div
            class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"
        ></div>
    </div>
{:else if incomplete_fixtures.length === 0}
    <div
        class="bg-accent-50 dark:bg-accent-800 rounded-xl p-6 sm:p-8 text-center"
    >
        <p class="text-accent-600 dark:text-accent-300 mb-4">
            No upcoming fixtures to start
        </p>
        <a
            href="/fixtures"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
            Create Fixture
        </a>
    </div>
{:else}
    <div class="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
        {#each incomplete_fixtures as fixture (fixture.id)}
            <LiveGamesFixtureCard
                {fixture}
                home_team_name={get_team_name(fixture.home_team_id)}
                away_team_name={get_team_name(fixture.away_team_id)}
                home_team_logo_url={team_logo_urls[fixture.home_team_id] ?? ""}
                away_team_logo_url={team_logo_urls[fixture.away_team_id] ?? ""}
                competition_name={get_competition_name(fixture.competition_id)}
                sport_name={get_sport_name(fixture.competition_id)}
                {can_start_games}
                is_starting={is_starting[fixture.id || ""]}
                checks={current_checks[fixture.id || ""] || []}
                {on_start_click}
            />
        {/each}
    </div>
{/if}
