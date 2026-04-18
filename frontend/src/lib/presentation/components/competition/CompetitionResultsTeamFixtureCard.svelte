<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";

    export let fixture: Fixture;
    export let selected_team_id: string;
    export let format_date: (date_string: string) => string;
    export let get_team_name_extended: (team_id: string) => string;
    export let get_competition_name_extended: (
        competition_id: string,
    ) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;

    $: is_home = fixture.home_team_id === selected_team_id;
    $: home_score = fixture.home_team_score ?? 0;
    $: away_score = fixture.away_team_score ?? 0;
    $: did_win =
        fixture.status === "completed" &&
        ((is_home && home_score > away_score) ||
            (!is_home && away_score > home_score));
    $: did_lose =
        fixture.status === "completed" &&
        ((is_home && home_score < away_score) ||
            (!is_home && away_score < home_score));
    $: status_classes =
        fixture.status === "completed"
            ? did_win
                ? "border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10"
                : did_lose
                  ? "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/10"
                  : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            : fixture.status === "in_progress"
              ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
</script>

<div class={`p-3 rounded-lg border transition-colors ${status_classes}`}>
    <div class="flex items-center justify-between mb-1">
        <div class="text-xs text-gray-500 dark:text-gray-400">
            {format_date(fixture.scheduled_date)}
        </div>
        <div class="flex items-center gap-2">
            {#if fixture.status === "in_progress"}
                <span class="flex items-center gap-1">
                    <span class="relative flex h-2 w-2">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                        ></span>
                    </span>
                    <span
                        class="text-xs font-semibold text-red-600 dark:text-red-400"
                        >LIVE</span
                    >
                </span>
            {:else if fixture.status === "completed"}
                <span
                    class={`text-xs font-medium px-1.5 py-0.5 rounded ${did_win ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" : did_lose ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}
                    >{did_win ? "W" : did_lose ? "L" : "D"}</span
                >
            {:else}
                <span class="text-xs text-gray-400 dark:text-gray-500"
                    >Scheduled</span
                >
            {/if}
        </div>
    </div>
    <div class="mb-2">
        <span
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 max-w-full truncate"
            title={get_competition_name_extended(fixture.competition_id)}
            >{get_competition_name_extended(fixture.competition_id)}</span
        >
    </div>
    <div class="flex items-center justify-between gap-2">
        <div class="flex-1 flex items-center justify-end gap-1.5">
            <span
                class={`text-sm font-medium line-clamp-1 ${fixture.home_team_id === selected_team_id ? "text-primary-600 dark:text-primary-400" : "text-accent-900 dark:text-accent-100"}`}
                >{get_team_name_extended(fixture.home_team_id)}</span
            >
            <TeamLogoThumbnail
                logo_url={get_team_logo_url(fixture.home_team_id)}
                team_name={get_team_name_extended(fixture.home_team_id)}
                size="sm"
            />
        </div>
        <div class="flex-shrink-0 px-2 sm:px-4">
            {#if fixture.status === "completed" || fixture.status === "in_progress"}
                <div class="flex items-center gap-1 text-lg font-bold">
                    <span
                        class={is_home && home_score > away_score
                            ? "text-green-600"
                            : is_home && home_score < away_score
                              ? "text-red-600"
                              : "text-accent-900 dark:text-accent-100"}
                        >{home_score}</span
                    >
                    <span class="text-gray-400">-</span>
                    <span
                        class={!is_home && away_score > home_score
                            ? "text-green-600"
                            : !is_home && away_score < home_score
                              ? "text-red-600"
                              : "text-accent-900 dark:text-accent-100"}
                        >{away_score}</span
                    >
                </div>
            {:else}
                <span class="text-sm font-bold text-gray-400">VS</span>
            {/if}
        </div>
        <div class="flex-1 flex items-center gap-1.5">
            <TeamLogoThumbnail
                logo_url={get_team_logo_url(fixture.away_team_id)}
                team_name={get_team_name_extended(fixture.away_team_id)}
                size="sm"
            />
            <span
                class={`text-sm font-medium line-clamp-1 ${fixture.away_team_id === selected_team_id ? "text-primary-600 dark:text-primary-400" : "text-accent-900 dark:text-accent-100"}`}
                >{get_team_name_extended(fixture.away_team_id)}</span
            >
        </div>
    </div>
    <div
        class="flex justify-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700"
    >
        <button
            type="button"
            class="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
            on:click={() => on_open_match_report(fixture.id)}
        >
            <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                /><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                /></svg
            >
            View Details
        </button>
    </div>
</div>
