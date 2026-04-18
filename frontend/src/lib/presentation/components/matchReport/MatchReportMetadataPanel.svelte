<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import { get_official_full_name } from "$lib/core/entities/Official";
    import type {
        MatchReportAssignedOfficialData,
        MatchReportTeamState,
        MatchReportVenueState,
    } from "$lib/presentation/logic/matchReportPageLoadTypes";

    export let fixture: Fixture = {} as Fixture;
    export let home_team_state: MatchReportTeamState = { status: "missing" };
    export let away_team_state: MatchReportTeamState = { status: "missing" };
    export let venue_state: MatchReportVenueState = { status: "missing" };
    export let assigned_officials_data: MatchReportAssignedOfficialData[] = [];

    function build_team_abbreviation(
        team_state: MatchReportTeamState,
        fallback_value: string,
    ): string {
        if (team_state.status === "missing") {
            return fallback_value;
        }
        return team_state.team.name.slice(0, 3).toUpperCase();
    }
</script>

<div
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6"
>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center md:text-left">
            <div
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
                📍 Venue
            </div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
                {venue_state.status === "present"
                    ? venue_state.venue.name
                    : fixture.venue ?? "TBD"}
            </div>
            {#if venue_state.status === "present" && venue_state.venue.city}
                <div class="text-xs text-gray-500 dark:text-gray-400">
                    {venue_state.venue.city}{venue_state.venue.country
                        ? `, ${venue_state.venue.country}`
                        : ""}
                </div>
            {/if}
        </div>

        <div class="text-center">
            <div
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
            >
                👕 Team Colors
            </div>
            <div class="flex items-center justify-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-600 dark:text-gray-300">
                        {build_team_abbreviation(
                            home_team_state,
                            "HOM",
                        )}
                    </span>
                    <div
                        class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 {fixture
                            .home_team_jersey?.main_color
                            ? ''
                            : 'bg-blue-500'}"
                        style={fixture.home_team_jersey?.main_color
                            ? `background-color: ${fixture.home_team_jersey.main_color}`
                            : void 0}
                        title={fixture.home_team_jersey?.nickname || "Home Kit"}
                    ></div>
                </div>
                <span class="text-gray-400">vs</span>
                <div class="flex items-center gap-2">
                    <div
                        class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 {fixture
                            .away_team_jersey?.main_color
                            ? ''
                            : 'bg-red-500'}"
                        style={fixture.away_team_jersey?.main_color
                            ? `background-color: ${fixture.away_team_jersey.main_color}`
                            : void 0}
                        title={fixture.away_team_jersey?.nickname || "Away Kit"}
                    ></div>
                    <span class="text-xs text-gray-600 dark:text-gray-300">
                        {build_team_abbreviation(
                            away_team_state,
                            "AWY",
                        )}
                    </span>
                </div>
            </div>
            {#if fixture.officials_jersey?.main_color}
                <div class="mt-2 flex items-center justify-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400"
                        >Officials:</span
                    >
                    <div
                        class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                        style={`background-color: ${fixture.officials_jersey.main_color}`}
                        title={fixture.officials_jersey.nickname ||
                            "Officials Kit"}
                    ></div>
                </div>
            {/if}
        </div>

        <div class="text-center md:text-right">
            <div
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
                🏅 Match Officials
            </div>
            {#if assigned_officials_data.length > 0}
                <div class="space-y-1">
                    {#each assigned_officials_data as { official, role_name }}
                        <div class="text-sm">
                            <span class="text-gray-600 dark:text-gray-400"
                                >{role_name}:</span
                            >
                            <span
                                class="font-medium text-gray-900 dark:text-white"
                                >{get_official_full_name(official)}</span
                            >
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    Not assigned
                </div>
            {/if}
        </div>
    </div>
</div>
