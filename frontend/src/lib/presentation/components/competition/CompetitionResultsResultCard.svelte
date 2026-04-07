<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";

    export let fixture: Fixture;
    export let downloading_fixture_id: string | null;
    export let format_date: (date_string: string) => string;
    export let get_fixture_stage_name: (stage_id?: string | null) => string;
    export let get_fixture_stage_type: (stage_id?: string | null) => string;
    export let get_team_name: (team_id: string) => string;
    export let get_team_logo_url: (team_id: string) => string;
    export let on_open_match_report: (fixture_id: string) => void;
    export let on_download_match_report: (
        fixture: Fixture,
        event: MouseEvent,
    ) => Promise<boolean>;

    $: home_score = fixture.home_team_score ?? 0;
    $: away_score = fixture.away_team_score ?? 0;
    $: fixture_stage_name = get_fixture_stage_name(fixture.stage_id);
    $: fixture_stage_type = get_fixture_stage_type(fixture.stage_id);
</script>

<div
    class="w-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors"
>
    <div class="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
        {format_date(fixture.scheduled_date)}
    </div>
    {#if fixture_stage_name}
        <div class="mb-3 text-center">
            <span
                class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
            >
                {fixture_stage_name}
                {#if fixture_stage_type}
                    <span class="text-primary-500 dark:text-primary-400">
                        • {fixture_stage_type}
                    </span>
                {/if}
            </span>
        </div>
    {/if}
    <div class="flex items-center justify-between gap-2">
        <div class="flex-1 flex items-center justify-end gap-1.5">
            <span
                class={`text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1 ${home_score > away_score ? "text-green-600 dark:text-green-400" : ""}`}
                >{get_team_name(fixture.home_team_id)}</span
            >
            <TeamLogoThumbnail
                logo_url={get_team_logo_url(fixture.home_team_id)}
                team_name={get_team_name(fixture.home_team_id)}
                size="sm"
            />
        </div>
        <div class="flex-shrink-0 px-2 sm:px-4">
            <div
                class="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold"
            >
                <span
                    class={home_score > away_score
                        ? "text-green-600 dark:text-green-400"
                        : "text-accent-900 dark:text-accent-100"}
                    >{home_score}</span
                >
                <span class="text-gray-400 text-base sm:text-lg">-</span>
                <span
                    class={away_score > home_score
                        ? "text-green-600 dark:text-green-400"
                        : "text-accent-900 dark:text-accent-100"}
                    >{away_score}</span
                >
            </div>
        </div>
        <div class="flex-1 flex items-center gap-1.5">
            <TeamLogoThumbnail
                logo_url={get_team_logo_url(fixture.away_team_id)}
                team_name={get_team_name(fixture.away_team_id)}
                size="sm"
            />
            <span
                class={`text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1 ${away_score > home_score ? "text-green-600 dark:text-green-400" : ""}`}
                >{get_team_name(fixture.away_team_id)}</span
            >
        </div>
    </div>
    <div
        class="flex justify-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
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
        <button
            type="button"
            class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            disabled={downloading_fixture_id === fixture.id}
            on:click={(event) => void on_download_match_report(fixture, event)}
        >
            {#if downloading_fixture_id === fixture.id}
                <svg
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    ><circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    ></circle><path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path></svg
                >
                Generating...
            {:else}
                <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    /></svg
                >
                Match Report
            {/if}
        </button>
    </div>
</div>
