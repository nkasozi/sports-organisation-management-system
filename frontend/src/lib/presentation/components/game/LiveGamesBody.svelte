<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";

    import {
        LIVE_GAMES_BODY_STATUS,
        LIVE_GAMES_BODY_TEXT,
        type LiveGamesBodyState,
    } from "./liveGamesConstants";
    import LiveGamesFixtureCard from "./LiveGamesFixtureCard.svelte";

    export let body_state: LiveGamesBodyState;
    export let incomplete_fixtures: Fixture[] = [];
    export let can_start_games: boolean;
    export let team_names: Record<string, string> = {};
    export let team_logo_urls: Record<string, string> = {};
    export let competition_names: Record<string, string> = {};
    export let sport_names: Record<string, string> = {};
    export let current_checks: Record<string, PreFlightCheck[]> = {};
    export let is_starting: Record<string, boolean> = {};
    export let on_start_click: (fixture: Fixture) => void;
    export let can_run_fixture: (fixture: Fixture) => boolean = () => true;

    function get_team_name(team_id: string): string {
        return team_names[team_id] || LIVE_GAMES_BODY_TEXT.UNKNOWN_TEAM;
    }

    function get_competition_name(competition_id: string): string {
        return (
            competition_names[competition_id] ||
            LIVE_GAMES_BODY_TEXT.UNKNOWN_COMPETITION
        );
    }

    function get_sport_name(competition_id: string): string {
        return (
            sport_names[competition_id] || LIVE_GAMES_BODY_TEXT.UNKNOWN_SPORT
        );
    }
</script>

{#if body_state.status === LIVE_GAMES_BODY_STATUS.LOADING}
    <div class="flex justify-center items-center py-12">
        <div
            class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"
        ></div>
    </div>
{:else if body_state.status === LIVE_GAMES_BODY_STATUS.FAILED}
    <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
        <p class="text-red-600 dark:text-red-400">{body_state.message}</p>
    </div>
{:else if body_state.status === LIVE_GAMES_BODY_STATUS.NO_ORGANIZATIONS}
    <div
        class="bg-accent-50 dark:bg-accent-800 rounded-xl p-6 sm:p-8 text-center"
    >
        <p class="text-accent-600 dark:text-accent-300 mb-4">
            {LIVE_GAMES_BODY_TEXT.NO_ORGANIZATIONS}
        </p>
        <a
            href={LIVE_GAMES_BODY_TEXT.ORGANIZATIONS_PATH}
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
            {LIVE_GAMES_BODY_TEXT.GO_TO_ORGANIZATIONS}
        </a>
    </div>
{:else if body_state.status === LIVE_GAMES_BODY_STATUS.LOADING_FIXTURES}
    <div class="flex justify-center items-center py-12">
        <div
            class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"
        ></div>
    </div>
{:else if body_state.status === LIVE_GAMES_BODY_STATUS.NO_FIXTURES}
    <div
        class="bg-accent-50 dark:bg-accent-800 rounded-xl p-6 sm:p-8 text-center"
    >
        <p class="text-accent-600 dark:text-accent-300 mb-4">
            {LIVE_GAMES_BODY_TEXT.NO_FIXTURES}
        </p>
        <a
            href={LIVE_GAMES_BODY_TEXT.FIXTURES_PATH}
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
            {LIVE_GAMES_BODY_TEXT.CREATE_FIXTURE}
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
                can_start_games={can_start_games && can_run_fixture(fixture)}
                is_starting={is_starting[fixture.id || ""]}
                checks={current_checks[fixture.id || ""] || []}
                {on_start_click}
            />
        {/each}
    </div>
{/if}
