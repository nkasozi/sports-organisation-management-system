<script lang="ts">
    import { ErrorDisplay } from "$lib/presentation/components/ui";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type { MatchReportPageDataState } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import type { MatchReportViewState } from "$lib/presentation/logic/matchReportPageState";

    import MatchReportHeader from "./MatchReportHeader.svelte";
    import MatchReportPageContent from "./MatchReportPageContent.svelte";

    const default_match_report_view_state: MatchReportViewState = {
        home_score: 0,
        away_score: 0,
        sorted_events: [],
        home_starters: [],
        home_substitutes: [],
        away_starters: [],
        away_substitutes: [],
        is_game_scheduled: false,
        is_game_in_progress: false,
        is_game_completed: false,
        has_lineups: false,
    };

    export let downloading_report = false;
    export let error_message = "";
    export let is_loading = false;
    export let live_poll_interval_ms = 0;
    export let loading_error_title = "";
    export let page_data_state: MatchReportPageDataState = {
        status: "missing",
    };
    export let toast_message = "";
    export let toast_type: "success" | "error" | "info" = "info";
    export let toast_visible = false;
    export let view_state: MatchReportViewState = default_match_report_view_state;
    export let on_back: () => void = () => {};
    export let on_download: () => Promise<boolean> = async () => false;
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    {#if is_loading}
        <div class="flex justify-center items-center min-h-screen">
            <div
                class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
            ></div>
        </div>
    {:else if error_message}
        <div class="max-w-2xl mx-auto p-6">
            <ErrorDisplay
                variant="page"
                title={loading_error_title}
                message={error_message}
                {on_back}
            />
        </div>
    {:else if page_data_state.status === "present"}
        <div class="flex flex-col min-h-screen">
            <MatchReportHeader
                fixture={page_data_state.page_data.fixture}
                home_team_state={page_data_state.page_data.home_team_state}
                away_team_state={page_data_state.page_data.away_team_state}
                competition_state={page_data_state.page_data.competition_state}
                organization_name={page_data_state.page_data.organization_name}
                venue_state={page_data_state.page_data.venue_state}
                {view_state}
                {live_poll_interval_ms}
                {downloading_report}
                {on_back}
                {on_download}
            />
            <MatchReportPageContent
                fixture={page_data_state.page_data.fixture}
                home_team_state={page_data_state.page_data.home_team_state}
                away_team_state={page_data_state.page_data.away_team_state}
                venue_state={page_data_state.page_data.venue_state}
                assigned_officials_data={page_data_state.page_data.assigned_officials_data}
                home_players={page_data_state.page_data.home_players}
                away_players={page_data_state.page_data.away_players}
                {view_state}
            />
        </div>
    {/if}
</div>

{#if toast_visible}
    <Toast
        message={toast_message}
        type={toast_type}
        bind:is_visible={toast_visible}
    />
{/if}
