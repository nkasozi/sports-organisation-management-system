<script lang="ts">
    import { ErrorDisplay } from "$lib/presentation/components/ui";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type { MatchReportPageData } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import type { MatchReportViewState } from "$lib/presentation/logic/matchReportPageState";

    import MatchReportHeader from "./MatchReportHeader.svelte";
    import MatchReportPageContent from "./MatchReportPageContent.svelte";

    export let downloading_report: boolean;
    export let error_message: string;
    export let is_loading: boolean;
    export let live_poll_interval_ms: number;
    export let loading_error_title: string;
    export let page_data: MatchReportPageData | null;
    export let toast_message: string;
    export let toast_type: "success" | "error" | "info";
    export let toast_visible: boolean;
    export let view_state: MatchReportViewState;
    export let on_back: () => void;
    export let on_download: () => Promise<boolean>;
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
    {:else if page_data}
        <div class="flex flex-col min-h-screen">
            <MatchReportHeader
                fixture={page_data.fixture}
                home_team={page_data.home_team}
                away_team={page_data.away_team}
                competition={page_data.competition}
                organization_name={page_data.organization_name}
                venue={page_data.venue}
                {view_state}
                {live_poll_interval_ms}
                {downloading_report}
                {on_back}
                {on_download}
            />
            <MatchReportPageContent
                fixture={page_data.fixture}
                home_team={page_data.home_team}
                away_team={page_data.away_team}
                venue={page_data.venue}
                assigned_officials_data={page_data.assigned_officials_data}
                home_players={page_data.home_players}
                away_players={page_data.away_players}
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
