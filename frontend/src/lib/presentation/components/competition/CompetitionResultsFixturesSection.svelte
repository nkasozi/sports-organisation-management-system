<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import Pagination from "$lib/presentation/components/ui/Pagination.svelte";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";

    export let upcoming_fixtures: Fixture[];
    export let paginated_upcoming: Fixture[];
    export let upcoming_page: number;
    export let upcoming_total_pages: number;
    export let upcoming_per_page: number;
    export let page_size_options: number[];
    export let format_date: (date_string: string) => string;
    export let get_fixture_stage_name: (stage_id: string) => string;
    export let get_fixture_stage_type: (stage_id: string) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;
</script>

{#if upcoming_fixtures.length === 0}
    <div class="text-center py-8 text-accent-500">
        No upcoming fixtures scheduled.
    </div>
{:else}
    <div class="space-y-3">
        {#each paginated_upcoming as fixture}
            {@const fixture_stage_name = get_fixture_stage_name(
                fixture.stage_id || "",
            )}
            {@const fixture_stage_type = get_fixture_stage_type(
                fixture.stage_id || "",
            )}
            <div
                class={`p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${fixture.status === "in_progress" ? "border border-red-200 dark:border-red-800" : ""}`}
            >
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            {format_date(fixture.scheduled_date)}
                        </div>
                        {#if fixture_stage_name}
                            <div class="mt-1">
                                <span
                                    class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                                >
                                    {fixture_stage_name}
                                    {#if fixture_stage_type}
                                        <span
                                            class="text-primary-500 dark:text-primary-400"
                                            >• {fixture_stage_type}</span
                                        >
                                    {/if}
                                </span>
                            </div>
                        {/if}
                    </div>
                    {#if fixture.status === "in_progress"}
                        <div class="flex items-center gap-1.5">
                            <span class="relative flex h-2 w-2"
                                ><span
                                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                                ></span><span
                                    class="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                                ></span></span
                            >
                            <span
                                class="text-xs font-semibold text-red-600 dark:text-red-400"
                                >LIVE</span
                            >
                        </div>
                    {/if}
                </div>
                <div class="flex items-center justify-between gap-2">
                    <div class="flex-1 flex items-center justify-end gap-1.5">
                        <span
                            class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                            >{get_team_name(fixture.home_team_id)}</span
                        >
                        <TeamLogoThumbnail
                            logo_url={get_team_logo_url(fixture.home_team_id)}
                            team_name={get_team_name(fixture.home_team_id)}
                            size="sm"
                        />
                    </div>
                    <div class="flex-shrink-0 px-3 sm:px-6">
                        <div
                            class="text-base sm:text-lg font-bold text-gray-400"
                        >
                            VS
                        </div>
                    </div>
                    <div class="flex-1 flex items-center gap-1.5">
                        <TeamLogoThumbnail
                            logo_url={get_team_logo_url(fixture.away_team_id)}
                            team_name={get_team_name(fixture.away_team_id)}
                            size="sm"
                        />
                        <span
                            class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                            >{get_team_name(fixture.away_team_id)}</span
                        >
                    </div>
                </div>
                <div
                    class="flex justify-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                    <button
                        type="button"
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        on:click={() => on_open_match_report(fixture.id)}
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            /><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            /></svg
                        >
                        View Details
                    </button>
                </div>
            </div>
        {/each}
    </div>

    <Pagination
        current_page={upcoming_page}
        total_pages={upcoming_total_pages}
        total_items={upcoming_fixtures.length}
        items_per_page={upcoming_per_page}
        {page_size_options}
        on:page_change={(event) => (upcoming_page = event.detail.page)}
        on:page_size_change={(event) => {
            upcoming_per_page = event.detail.size;
            upcoming_page = 1;
        }}
    />
{/if}
